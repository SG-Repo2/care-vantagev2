-- Drop existing policy
DROP POLICY IF EXISTS "Users can insert their own data" ON users;

-- Create new insert policy for authenticated users
CREATE POLICY "Users can insert their own data"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create trigger to automatically create user profile after auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';