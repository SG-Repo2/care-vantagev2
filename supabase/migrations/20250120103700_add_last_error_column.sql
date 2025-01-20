-- Add last_error column to users table if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Ensure PostgREST picks up the changes
NOTIFY pgrst, 'reload schema';