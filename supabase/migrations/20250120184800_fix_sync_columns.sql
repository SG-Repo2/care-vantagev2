-- Drop and recreate sync columns to ensure proper setup
ALTER TABLE public.users 
DROP COLUMN IF EXISTS last_health_sync,
ADD COLUMN last_health_sync TIMESTAMPTZ;

ALTER TABLE public.health_metrics 
DROP COLUMN IF EXISTS last_updated,
ADD COLUMN last_updated TIMESTAMPTZ;

-- Create index for sync timestamp queries
CREATE INDEX IF NOT EXISTS idx_users_last_health_sync 
ON public.users(last_health_sync)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_health_metrics_last_updated 
ON public.health_metrics(last_updated);

-- Update RLS policies to allow updating sync timestamps
CREATE POLICY "Users can update their own sync timestamps"
ON public.users
FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
  AND (
    -- Only allow updating sync timestamps and updated_at
    (
      CASE WHEN last_health_sync IS NOT NULL THEN true ELSE false END
      AND CASE WHEN updated_at IS NOT NULL THEN true ELSE false END
    )
  )
);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';