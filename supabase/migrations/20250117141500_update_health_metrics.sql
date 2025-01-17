-- Drop existing health_metrics table if it exists
DROP TABLE IF EXISTS health_metrics CASCADE;

-- Create new health_metrics table
CREATE TABLE health_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  date date NOT NULL,
  steps int4 NOT NULL,
  distance numeric NOT NULL,
  calories int4,
  heart_rate numeric,
  daily_score int4 NOT NULL,
  weekly_score int4,
  streak_days int4,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT health_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT chk_steps_non_negative CHECK (steps >= 0),
  CONSTRAINT chk_distance_non_negative CHECK (distance >= 0),
  CONSTRAINT chk_heart_rate_non_negative CHECK (heart_rate >= 0),
  CONSTRAINT chk_calories_non_negative CHECK (calories >= 0),
  CONSTRAINT chk_daily_score_non_negative CHECK (daily_score >= 0),
  CONSTRAINT chk_weekly_score_non_negative CHECK (weekly_score >= 0),
  CONSTRAINT chk_streak_days_non_negative CHECK (streak_days >= 0)
);

-- Add indices for performance
CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, date);
CREATE INDEX idx_health_metrics_daily_score ON health_metrics(daily_score);
CREATE INDEX idx_health_metrics_weekly_score ON health_metrics(weekly_score) WHERE weekly_score IS NOT NULL;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_health_metrics_updated_at ON health_metrics;
CREATE TRIGGER update_health_metrics_updated_at
    BEFORE UPDATE ON health_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create user rank function
CREATE OR REPLACE FUNCTION get_user_rank(user_id uuid)
RETURNS INTEGER AS $$
  SELECT rank
  FROM (
    SELECT id, 
           RANK() OVER (
             PARTITION BY date
             ORDER BY daily_score DESC
           ) as rank
    FROM health_metrics
    WHERE date = CURRENT_DATE
  ) rankings
  WHERE id = user_id;
$$ LANGUAGE SQL STABLE;

-- Enable RLS
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can read their own metrics" ON health_metrics;
CREATE POLICY "Users can read their own metrics"
    ON health_metrics FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own metrics" ON health_metrics;
CREATE POLICY "Users can insert their own metrics"
    ON health_metrics FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own metrics" ON health_metrics;
CREATE POLICY "Users can update their own metrics"
    ON health_metrics FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.health_metrics TO authenticated;
GRANT ALL ON public.health_metrics TO service_role;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';