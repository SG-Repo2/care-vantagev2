-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create comprehensive policies
CREATE POLICY "Enable read access for authenticated users"
    ON users FOR SELECT
    TO authenticated
    USING (true);  -- Allow reading all profiles for social features

CREATE POLICY "Enable insert for authenticated users"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema'; 