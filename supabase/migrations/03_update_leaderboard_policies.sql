-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read their own health metrics" ON health_metrics;
DROP POLICY IF EXISTS "Users can read public health metrics" ON health_metrics;
DROP POLICY IF EXISTS "Users can insert their own health metrics" ON health_metrics;
DROP POLICY IF EXISTS "Users can update their own health metrics" ON health_metrics;

-- Create new policy that allows reading public health metrics
CREATE POLICY "Users can read public health metrics"
ON health_metrics
FOR SELECT
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = health_metrics.user_id 
    AND (users.settings->>'privacyLevel')::text = 'public'
  )
);

-- Recreate insert and update policies
CREATE POLICY "Users can insert their own health metrics"
ON health_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics"
ON health_metrics
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add composite index for more efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_health_metrics_date_score 
ON health_metrics(date, score DESC);

-- Add index for privacy level lookups
CREATE INDEX IF NOT EXISTS idx_users_privacy_level 
ON users((settings->>'privacyLevel'));

-- Add index for combined date range and score queries
CREATE INDEX IF NOT EXISTS idx_health_metrics_date_range_score 
ON health_metrics(date, score DESC) 
WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- Update get_user_rank function to respect privacy settings
CREATE OR REPLACE FUNCTION get_user_rank(user_uuid UUID, target_date DATE)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
    user_privacy_level TEXT;
BEGIN
    -- Get the user's privacy level
    SELECT (settings->>'privacyLevel')::text
    INTO user_privacy_level
    FROM users
    WHERE id = user_uuid;

    -- If user is private, return null
    IF user_privacy_level = 'private' THEN
        RETURN NULL;
    END IF;

    -- Get rank considering only public users and the requesting user
    SELECT rank
    INTO user_rank
    FROM (
        SELECT hm.user_id,
               RANK() OVER (ORDER BY hm.score DESC) as rank
        FROM health_metrics hm
        JOIN users u ON u.id = hm.user_id
        WHERE hm.date = target_date
        AND (
            hm.user_id = user_uuid OR
            (u.settings->>'privacyLevel')::text = 'public'
        )
    ) rankings
    WHERE user_id = user_uuid;
    
    RETURN user_rank;
END;
$$ LANGUAGE plpgsql;

-- Create function to get daily leaderboard with privacy settings
CREATE OR REPLACE FUNCTION get_daily_leaderboard(target_date DATE)
RETURNS TABLE (
    user_id UUID,
    steps INTEGER,
    distance NUMERIC,
    score INTEGER,
    users JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hm.user_id,
        hm.steps,
        hm.distance,
        hm.score,
        jsonb_build_object(
            'display_name', u.display_name,
            'photo_url', u.photo_url,
            'settings', u.settings
        ) as users
    FROM health_metrics hm
    JOIN users u ON u.id = hm.user_id
    WHERE 
        hm.date = target_date
        AND (
            -- Include only public profiles and the requesting user's data
            (u.settings->>'privacyLevel')::text = 'public'
            OR hm.user_id = auth.uid()
        )
    ORDER BY hm.score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get weekly leaderboard with privacy settings
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(start_date DATE, end_date DATE)
RETURNS TABLE (
    user_id UUID,
    steps BIGINT,
    distance NUMERIC,
    score BIGINT,
    users JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hm.user_id,
        SUM(hm.steps)::BIGINT as steps,
        SUM(hm.distance)::NUMERIC as distance,
        SUM(hm.score)::BIGINT as score,
        jsonb_build_object(
            'display_name', u.display_name,
            'photo_url', u.photo_url,
            'settings', u.settings
        ) as users
    FROM health_metrics hm
    JOIN users u ON u.id = hm.user_id
    WHERE 
        hm.date BETWEEN start_date AND end_date
        AND (
            -- Include only public profiles and the requesting user's data
            (u.settings->>'privacyLevel')::text = 'public'
            OR hm.user_id = auth.uid()
        )
    GROUP BY 
        hm.user_id,
        u.display_name,
        u.photo_url,
        u.settings
    ORDER BY SUM(hm.score) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for weekly rankings
CREATE OR REPLACE FUNCTION get_weekly_user_rank(user_uuid UUID, start_date DATE, end_date DATE)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
    user_privacy_level TEXT;
BEGIN
    -- Get the user's privacy level
    SELECT (settings->>'privacyLevel')::text
    INTO user_privacy_level
    FROM users
    WHERE id = user_uuid;

    -- If user is private, return null
    IF user_privacy_level = 'private' THEN
        RETURN NULL;
    END IF;

    -- Get rank considering only public users and the requesting user
    SELECT rank
    INTO user_rank
    FROM (
        SELECT 
            hm.user_id,
            RANK() OVER (ORDER BY SUM(hm.score) DESC) as rank
        FROM health_metrics hm
        JOIN users u ON u.id = hm.user_id
        WHERE hm.date BETWEEN start_date AND end_date
        AND (
            hm.user_id = user_uuid OR
            (u.settings->>'privacyLevel')::text = 'public'
        )
        GROUP BY hm.user_id
    ) rankings
    WHERE user_id = user_uuid;
    
    RETURN user_rank;
END;
$$ LANGUAGE plpgsql;