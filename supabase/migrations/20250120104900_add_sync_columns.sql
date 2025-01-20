-- Add missing columns to health_metrics table
ALTER TABLE public.health_metrics 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ;

-- Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_health_sync TIMESTAMPTZ;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';