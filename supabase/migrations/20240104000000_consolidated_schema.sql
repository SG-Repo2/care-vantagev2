-- Create base types
DO $$ BEGIN
    CREATE TYPE public.achievement_type AS ENUM (
        'daily_goal',
        'weekly_goal',
        'monthly_goal',
        'streak',
        'rank_improvement',
        'competition_win'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create base tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    settings JSONB DEFAULT '{
        "privacyLevel": "private",
        "notifications": true,
        "measurementSystem": "metric",
        "dailyGoals": {
            "steps": 10000,
            "sleep": 480,
            "water": 2000
        }
    }'::jsonb,
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    achievement_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_achievements INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    steps INTEGER NOT NULL,
    distance NUMERIC(10,2) NOT NULL,
    heartrate NUMERIC(5,2),
    calories INTEGER,
    score INTEGER NOT NULL,
    rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date),
    CONSTRAINT chk_steps_non_negative CHECK (steps >= 0),
    CONSTRAINT chk_distance_non_negative CHECK (distance >= 0),
    CONSTRAINT chk_heartrate_non_negative CHECK (heartrate >= 0),
    CONSTRAINT chk_calories_non_negative CHECK (calories >= 0)
);

CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type achievement_type NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    earned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    score INTEGER NOT NULL,
    streak_days INTEGER DEFAULT 0,
    period_type VARCHAR(10) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT leaderboard_rankings_period_type_check CHECK (
        period_type = ANY (ARRAY['daily'::VARCHAR, 'weekly'::VARCHAR, 'monthly'::VARCHAR])
    )
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_health_metrics_updated_at ON health_metrics;
CREATE TRIGGER update_health_metrics_updated_at
    BEFORE UPDATE ON health_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_date ON health_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_user_leaderboard ON leaderboard_rankings(user_id, leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rankings_user_period ON leaderboard_rankings(user_id, period_type, start_date);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can read their own data" ON users;
    CREATE POLICY "Users can read their own data"
        ON users FOR SELECT
        TO public
        USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update their own data" ON users;
    CREATE POLICY "Users can update their own data"
        ON users FOR UPDATE
        TO public
        USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can read their own metrics" ON health_metrics;
    CREATE POLICY "Users can read their own metrics"
        ON health_metrics FOR SELECT
        TO public
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can insert their own metrics" ON health_metrics;
    CREATE POLICY "Users can insert their own metrics"
        ON health_metrics FOR INSERT
        TO public
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own metrics" ON health_metrics;
    CREATE POLICY "Users can update their own metrics"
        ON health_metrics FOR UPDATE
        TO public
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can view their own achievements" ON achievements;
    CREATE POLICY "Users can view their own achievements"
        ON achievements FOR SELECT
        TO public
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "System can manage achievements" ON achievements;
    CREATE POLICY "System can manage achievements"
        ON achievements
        AS permissive
        FOR ALL
        TO public
        USING (true)
        WITH CHECK (true);

    DROP POLICY IF EXISTS "Leaderboard rankings are viewable by everyone" ON leaderboard_rankings;
    CREATE POLICY "Leaderboard rankings are viewable by everyone"
        ON leaderboard_rankings FOR SELECT
        TO public
        USING (true);
END $$;

-- Create functions
CREATE OR REPLACE FUNCTION random_between(min_val INTEGER, max_val INTEGER)
RETURNS INTEGER AS $$
BEGIN
   RETURN floor(random() * (max_val - min_val + 1) + min_val);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_daily_ranks(target_date DATE)
RETURNS VOID AS $$
BEGIN
  WITH ranked_metrics AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
    FROM health_metrics
    WHERE date = target_date
  )
  UPDATE health_metrics hm
  SET rank = rm.new_rank
  FROM ranked_metrics rm
  WHERE hm.id = rm.id
    AND hm.date = target_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_achievement_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET 
    total_achievements = (
      SELECT COUNT(*) 
      FROM achievements 
      WHERE user_id = NEW.user_id
    ),
    achievement_points = (
      SELECT COALESCE(SUM(points), 0) 
      FROM achievements 
      WHERE user_id = NEW.user_id
    )
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  streak_count INT;
BEGIN
  SELECT current_streak 
  INTO streak_count 
  FROM users 
  WHERE id = NEW.user_id;
  
  IF EXISTS (
    SELECT 1 
    FROM health_metrics 
    WHERE user_id = NEW.user_id 
    AND date = yesterday_date
  ) THEN
    streak_count := streak_count + 1;
  ELSE
    streak_count := 1;
  END IF;
  
  UPDATE users 
  SET 
    current_streak = streak_count,
    longest_streak = GREATEST(longest_streak, streak_count)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create achievement triggers
DROP TRIGGER IF EXISTS achievement_stats_trigger ON achievements;
CREATE TRIGGER achievement_stats_trigger
    AFTER INSERT OR DELETE OR UPDATE ON achievements
    FOR EACH ROW
    EXECUTE FUNCTION update_user_achievement_stats();

DROP TRIGGER IF EXISTS update_streak_trigger ON health_metrics;
CREATE TRIGGER update_streak_trigger
    AFTER INSERT ON health_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_user_streak();

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.health_metrics TO authenticated;
GRANT ALL ON public.health_metrics TO service_role;
GRANT ALL ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
GRANT ALL ON public.leaderboard_rankings TO authenticated;
GRANT ALL ON public.leaderboard_rankings TO service_role;
GRANT ALL ON public.leaderboards TO authenticated;
GRANT ALL ON public.leaderboards TO service_role;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
