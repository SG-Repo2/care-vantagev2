-- Drop existing constraints if they exist
ALTER TABLE health_metrics
DROP CONSTRAINT IF EXISTS health_metrics_user_id_fkey,
DROP CONSTRAINT IF EXISTS health_metrics_valid_metrics,
DROP CONSTRAINT IF EXISTS health_metrics_unique_daily_entry,
DROP CONSTRAINT IF EXISTS health_metrics_valid_date_range;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_health_metrics_user_date;
DROP INDEX IF EXISTS idx_health_metrics_date;

-- Add new constraints
ALTER TABLE health_metrics
    -- Add foreign key with cascade delete
    ADD CONSTRAINT health_metrics_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    -- Add check constraints for non-negative values
    ADD CONSTRAINT health_metrics_valid_metrics 
        CHECK (
            steps >= 0 AND
            distance >= 0 AND
            calories >= 0 AND
            heart_rate >= 0 AND
            daily_score >= 0 AND
            weekly_score >= 0 AND
            streak_days >= 0
        ),
    
    -- Add date range validation
    ADD CONSTRAINT health_metrics_valid_date_range
        CHECK (date >= '2020-01-01' AND date <= CURRENT_DATE),
    
    -- Add unique constraint for user-date combination
    ADD CONSTRAINT health_metrics_unique_daily_entry 
        UNIQUE (user_id, date);

-- Create performance-optimizing indexes
CREATE INDEX idx_health_metrics_user_date 
    ON health_metrics(user_id, date DESC);
CREATE INDEX idx_health_metrics_date 
    ON health_metrics(date DESC);

-- Add comment explaining the table structure
COMMENT ON TABLE health_metrics IS 'Stores user health metrics with data validation and performance optimizations';