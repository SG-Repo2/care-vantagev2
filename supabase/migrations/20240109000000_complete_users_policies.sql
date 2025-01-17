-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert their own data" ON users;
    DROP POLICY IF EXISTS "Users can read their own data" ON users;
    DROP POLICY IF EXISTS "Users can update their own data" ON users;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Create insert policy
CREATE POLICY "Users can insert their own data"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create read policy
CREATE POLICY "Users can read their own data"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Create update policy
CREATE POLICY "Users can update their own data"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
