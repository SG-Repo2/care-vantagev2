-- Add a new leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter leaderboard_rankings table to include leaderboard_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leaderboard_rankings' AND column_name = 'leaderboard_id'
    ) THEN
        ALTER TABLE leaderboard_rankings
        ADD COLUMN leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update leaderboard_rankings table to improve indexing for performance
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE indexname = 'idx_leaderboard_rankings_user_leaderboard'
    ) THEN
        CREATE INDEX idx_leaderboard_rankings_user_leaderboard ON leaderboard_rankings (user_id, leaderboard_id);
    END IF;
END $$;

-- Add privacy settings column to users table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'privacy_settings'
    ) THEN
        ALTER TABLE users
        ADD COLUMN privacy_settings JSONB DEFAULT '{}'::JSONB;
    END IF;
END $$;

-- Enable Row-Level Security (RLS) and policies for leaderboard_rankings
DO $$
BEGIN
    ALTER TABLE leaderboard_rankings ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN
    -- RLS already enabled
END $$;

-- Policy to allow users to access their own leaderboard rankings
DO $$
BEGIN
    CREATE POLICY "allow_own_rankings_access"
    ON leaderboard_rankings
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
END $$;

-- Policy to restrict access to leaderboard rankings by leaderboard_id
DO $$
BEGIN
    CREATE POLICY "allow_leaderboard_members_access"
    ON leaderboard_rankings
    USING (leaderboard_id IN (SELECT id FROM leaderboards));
EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
END $$;

-- Add constraints to health_metrics for data integrity
DO $$
BEGIN
    ALTER TABLE health_metrics
    ADD CONSTRAINT chk_steps_non_negative CHECK (steps >= 0);
EXCEPTION WHEN duplicate_object THEN
    -- Constraint already exists
END $$;

DO $$
BEGIN
    ALTER TABLE health_metrics
    ADD CONSTRAINT chk_distance_non_negative CHECK (distance >= 0);
EXCEPTION WHEN duplicate_object THEN
    -- Constraint already exists
END $$;

-- Ensure achievements are tied to valid users
DO $$
BEGIN
    ALTER TABLE achievements
    ADD CONSTRAINT fk_achievements_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
    -- Foreign key already exists
END $$;

-- Enable Row-Level Security (RLS) and policies for achievements
DO $$
BEGIN
    ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN
    -- RLS already enabled
END $$;

DO $$
BEGIN
    CREATE POLICY "allow_own_achievements_access"
    ON achievements
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
END $$;

-- Enable Row-Level Security (RLS) and policies for health_metrics
DO $$
BEGIN
    ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN
    -- RLS already enabled
END $$;

DO $$
BEGIN
    CREATE POLICY "allow_own_health_metrics_access"
    ON health_metrics
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists
END $$;
