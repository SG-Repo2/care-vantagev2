-- Add policy for users to insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema'; 