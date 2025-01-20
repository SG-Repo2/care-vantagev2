-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS permissions_granted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_health_sync timestamptz,
ADD COLUMN IF NOT EXISTS last_error text,
ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;

-- Update existing rows to have permissions_granted = false
UPDATE users
SET permissions_granted = false
WHERE permissions_granted IS NULL;

-- Add comment explaining the columns
COMMENT ON COLUMN users.permissions_granted IS 'Whether the user has granted health data access permissions';
COMMENT ON COLUMN users.last_health_sync IS 'Timestamp of last successful health data sync';
COMMENT ON COLUMN users.last_error IS 'Last error message encountered during health data sync';
COMMENT ON COLUMN users.score IS 'User''s current health score';