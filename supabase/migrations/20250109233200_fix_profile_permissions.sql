-- Ensure proper permissions for profile creation
DO $$ BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can insert their own data" ON users;
    DROP POLICY IF EXISTS "Users can read their own data" ON users;
    DROP POLICY IF EXISTS "Users can update their own data" ON users;

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
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';