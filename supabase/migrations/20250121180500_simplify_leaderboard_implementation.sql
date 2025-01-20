-- Drop existing privacy-related objects
DROP VIEW IF EXISTS public.leaderboard_public CASCADE;
DROP INDEX IF EXISTS public.idx_users_privacy_level;
DROP POLICY IF EXISTS "Users can update their own privacy" ON public.users;
ALTER TABLE public.users DROP COLUMN IF EXISTS privacy_level;

-- Create simplified leaderboard view without privacy masking
CREATE OR REPLACE VIEW public.leaderboard_public
AS
SELECT
  id as public_id,
  display_name,
  photo_url,
  GREATEST(COALESCE(score, 0), 0) as score,
  ROW_NUMBER() OVER (
    ORDER BY COALESCE(score, 0) DESC,
    created_at ASC
  ) as rank
FROM public.users
WHERE deleted_at IS NULL;

-- Create index for efficient leaderboard sorting
CREATE INDEX IF NOT EXISTS idx_users_score 
ON public.users(score DESC, created_at)
WHERE deleted_at IS NULL;

-- Update RLS policies for public leaderboard access
DROP POLICY IF EXISTS "Public can view leaderboard_public" ON public.users;

CREATE POLICY "Public can view leaderboard"
ON public.users FOR SELECT
TO PUBLIC
USING (deleted_at IS NULL);

-- Grant necessary permissions
GRANT SELECT ON public.leaderboard_public TO PUBLIC;
GRANT SELECT ON public.leaderboard_public TO authenticated;
GRANT SELECT ON public.leaderboard_public TO anon;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';