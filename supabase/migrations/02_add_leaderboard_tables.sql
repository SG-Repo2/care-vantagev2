-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_date ON health_metrics(date);
CREATE INDEX IF NOT EXISTS idx_health_metrics_score ON health_metrics(score);

-- Add foreign key constraint if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'health_metrics_user_id_fkey'
    ) THEN
        ALTER TABLE health_metrics
        ADD CONSTRAINT health_metrics_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add default settings to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'settings'
    ) THEN
        ALTER TABLE users
        ADD COLUMN settings JSONB DEFAULT '{
            "measurementSystem": "metric",
            "notifications": true,
            "privacyLevel": "private",
            "dailyGoals": {
                "steps": 10000,
                "sleep": 480,
                "water": 2000
            }
        }'::jsonb;
    END IF;
END $$;