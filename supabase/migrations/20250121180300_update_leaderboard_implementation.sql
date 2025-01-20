-- Revert any existing objects we'll be updating
DROP VIEW IF EXISTS public.leaderboard_public CASCADE;
DROP INDEX IF EXISTS public.idx_users_id_hash;
DROP INDEX IF EXISTS public.idx_users_privacy_level;
DROP INDEX IF EXISTS public.idx_users_score_privacy;

-- Only drop the specific policies we're replacing
DROP POLICY IF EXISTS "Public can view leaderboard_public" ON public.users;
DROP POLICY IF EXISTS "Users can update their own privacy" ON public.users;

-- Drop existing constraint if it exists
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS privacy_level_check;

-- Ensure privacy_level column is properly configured
ALTER TABLE public.users 
ALTER COLUMN privacy_level SET NOT NULL,
ALTER COLUMN privacy_level TYPE text,
ALTER COLUMN privacy_level SET DEFAULT 'private'::text,
ADD CONSTRAINT privacy_level_check 
    CHECK (privacy_level = ANY (ARRAY['private'::text, 'public'::text, 'friends'::text]));

-- Update existing NULL privacy levels to private
UPDATE public.users 
SET privacy_level = 'private' 
WHERE privacy_level IS NULL;

-- Create indices for performance
-- Main index for leaderboard sorting and filtering
CREATE INDEX IF NOT EXISTS idx_users_score_privacy 
ON public.users(score DESC, privacy_level, created_at)
WHERE deleted_at IS NULL;

-- Index for user identification
CREATE INDEX IF NOT EXISTS idx_users_id_hash 
ON public.users(encode(digest(id::text, 'sha256'), 'hex'))
WHERE deleted_at IS NULL;

-- Index for privacy level queries
CREATE INDEX IF NOT EXISTS idx_users_privacy_level 
ON public.users(privacy_level)
WHERE deleted_at IS NULL;

-- Create or replace the sanitized leaderboard view with improved privacy and performance
CREATE OR REPLACE VIEW public.leaderboard_public
WITH (security_barrier = true)
AS
WITH ranked_users AS (
  SELECT
    -- Hash the user_id for public display
    encode(digest(id::text, 'sha256'), 'hex') AS public_id,
    CASE
      WHEN privacy_level = 'private' THEN 
        'anonymous_user_' || encode(digest(id::text, 'sha256'), 'base64')
      WHEN display_name IS NULL OR display_name = '' THEN 
        'user_' || encode(digest(id::text, 'sha256'), 'base64')
      ELSE display_name
    END AS display_name,
    photo_url,
    GREATEST(COALESCE(score, 0), 0) as score, -- Prevent negative scores
    privacy_level,
    created_at,
    ROW_NUMBER() OVER (ORDER BY GREATEST(COALESCE(score, 0), 0) DESC, created_at ASC) as rank
  FROM public.users
  WHERE 
    deleted_at IS NULL
    AND privacy_level != 'private'
)
SELECT
  public_id,
  display_name,
  CASE 
    WHEN privacy_level = 'public' THEN photo_url
    ELSE NULL
  END as photo_url,
  score,
  rank,
  privacy_level
FROM ranked_users;

-- Set view owner to postgres for security definer behavior
ALTER VIEW public.leaderboard_public OWNER TO postgres;

-- Grant access to the view
GRANT SELECT ON public.leaderboard_public TO anon;
GRANT SELECT ON public.leaderboard_public TO authenticated;

-- Add privacy-specific update policy
CREATE POLICY "Users can update their own privacy"
ON public.users
FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
  AND (
    privacy_level = ANY (ARRAY['private'::text, 'public'::text, 'friends'::text])
  )
);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';