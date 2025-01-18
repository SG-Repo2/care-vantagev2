-- Drop existing tables and functions if they exist
DROP FUNCTION IF EXISTS public.update_daily_ranks CASCADE;
DROP TABLE IF EXISTS public.health_metrics CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    device_info JSONB,
    permissions_granted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    score INT4
);

-- Create health_metrics table
CREATE TABLE public.health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    date DATE NOT NULL,
    steps INT4,
    distance NUMERIC,
    calories INT4,
    heart_rate INT4,
    daily_score INT4,
    weekly_score INT4,
    streak_days INT4,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT health_metrics_unique_daily_entry UNIQUE (user_id, date)
);

-- Create indexes
CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, date DESC);
CREATE INDEX idx_users_email ON users(email);

-- Add RLS policies for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile"
    ON public.users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Add RLS policies for health_metrics table
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own metrics"
    ON health_metrics FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
    ON health_metrics FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
    ON health_metrics FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create function to calculate daily ranks (using daily_score instead of rank column)
CREATE OR REPLACE FUNCTION public.update_daily_ranks(target_date DATE)
RETURNS void AS $$
BEGIN
  -- Update daily_score based on ranking
  WITH ranked_metrics AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY daily_score DESC) as rank_position
    FROM health_metrics
    WHERE date = target_date
  )
  UPDATE health_metrics hm
  SET daily_score = 100 - LEAST((rm.rank_position - 1) * 5, 100)  -- Score decreases by 5 for each rank, minimum 0
  FROM ranked_metrics rm
  WHERE hm.id = rm.id
    AND hm.date = target_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.health_metrics TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_daily_ranks TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';