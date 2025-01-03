-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.get_daily_leaderboard(target_date DATE);
DROP FUNCTION IF EXISTS public.get_weekly_leaderboard(start_date DATE, end_date DATE);
DROP FUNCTION IF EXISTS public.get_user_rank(user_uuid UUID, target_date DATE);
DROP FUNCTION IF EXISTS public.get_weekly_user_rank(user_uuid UUID, start_date DATE, end_date DATE);

-- Recreate the functions in the public schema explicitly with text parameters
CREATE OR REPLACE FUNCTION public.get_daily_leaderboard(target_date text)
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
        hm.date = target_date::date
        AND (
            -- Include only public profiles and the requesting user's data
            (u.settings->>'privacyLevel')::text = 'public'
            OR hm.user_id = auth.uid()
        )
    ORDER BY hm.score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(start_date text, end_date text)
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
        hm.date BETWEEN start_date::date AND end_date::date
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

-- Grant execute permissions to authenticated users for leaderboard functions
GRANT EXECUTE ON FUNCTION public.get_daily_leaderboard(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_leaderboard(text, text) TO authenticated;

-- Ensure functions are in public schema and owned by postgres
ALTER FUNCTION public.get_daily_leaderboard(text) OWNER TO postgres;
ALTER FUNCTION public.get_weekly_leaderboard(text, text) OWNER TO postgres;

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
