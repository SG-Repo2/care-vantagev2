-- Add privacy_level column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'privacy_level'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN privacy_level TEXT 
        CHECK (privacy_level IN ('private', 'friends', 'public'));

        -- Set default privacy level for existing users
        UPDATE public.users 
        SET privacy_level = 'private' 
        WHERE privacy_level IS NULL;
    END IF;
END $$;

-- Ensure PostgREST picks up the changes
NOTIFY pgrst, 'reload schema';