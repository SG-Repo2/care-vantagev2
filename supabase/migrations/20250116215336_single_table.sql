-- Add score column to users table
ALTER TABLE users
ADD COLUMN score INTEGER NOT NULL DEFAULT 0;

-- Drop dependent tables
DROP TABLE IF EXISTS leaderboard_rankings;
DROP TABLE IF EXISTS health_scores;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_score ON users(score DESC);

-- Update RLS policies
CREATE POLICY "Users can read all users for leaderboard"
    ON users FOR SELECT
    TO authenticated
    USING (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';