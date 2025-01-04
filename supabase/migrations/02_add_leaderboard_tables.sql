-- Enable Row Level Security
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for health_metrics table
CREATE POLICY "Users can read their own health metrics"
ON health_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics"
ON health_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics"
ON health_metrics
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policies for users table
CREATE POLICY "Users can read all profiles"
ON users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

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
