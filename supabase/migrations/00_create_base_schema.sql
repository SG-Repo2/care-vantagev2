-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    settings JSONB DEFAULT '{
        "measurementSystem": "metric",
        "notifications": true,
        "privacyLevel": "private",
        "dailyGoals": {
            "steps": 10000,
            "sleep": 480,
            "water": 2000
        }
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create health_metrics table if not exists
CREATE TABLE IF NOT EXISTS health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    steps INTEGER NOT NULL DEFAULT 0,
    distance NUMERIC(10,2) NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON health_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_date ON health_metrics(date);
CREATE INDEX IF NOT EXISTS idx_health_metrics_score ON health_metrics(score DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read all profiles"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create RLS policies for health_metrics table
CREATE POLICY "Users can read their own health metrics"
    ON health_metrics FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health metrics"
    ON health_metrics FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics"
    ON health_metrics FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create function to calculate user rank
CREATE OR REPLACE FUNCTION get_user_rank(user_uuid UUID, target_date DATE)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    SELECT rank
    INTO user_rank
    FROM (
        SELECT user_id, 
               RANK() OVER (ORDER BY score DESC) as rank
        FROM health_metrics
        WHERE date = target_date
    ) rankings
    WHERE user_id = user_uuid;
    
    RETURN user_rank;
END;
$$ LANGUAGE plpgsql;
