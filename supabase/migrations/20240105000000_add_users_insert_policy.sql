-- Add insert policy for users table
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can insert their own data" ON users;
    CREATE POLICY "Users can insert their own data"
        ON users FOR INSERT
        TO public
        WITH CHECK (auth.uid() = id);
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
