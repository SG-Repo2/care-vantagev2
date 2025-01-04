DO $$
BEGIN
    -- Only enable RLS if it's not already enabled
    IF NOT EXISTS (
        SELECT 1
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'users'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Create policies only if they don't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'users'
        AND policyname = 'Users can view own record'
    ) THEN
        CREATE POLICY "Users can view own record"
        ON public.users FOR SELECT
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'users'
        AND policyname = 'Users can update own record'
    ) THEN
        CREATE POLICY "Users can update own record"
        ON public.users FOR UPDATE
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'users'
        AND policyname = 'Users can insert own record'
    ) THEN
        CREATE POLICY "Users can insert own record"
        ON public.users FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'users'
        AND policyname = 'Service role can manage all records'
    ) THEN
        CREATE POLICY "Service role can manage all records"
        ON public.users
        USING (auth.role() = 'service_role');
    END IF;
END
$$;

-- Ensure permissions are granted
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
