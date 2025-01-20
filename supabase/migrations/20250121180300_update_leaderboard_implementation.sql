-- Revert any existing objects we'll be updating
DROP VIEW IF EXISTS public.leaderboard_public CASCADE;
DROP INDEX IF EXISTS public.idx_users_id_hash;
DROP INDEX IF EXISTS public.idx_users_privacy_level;
DROP INDEX IF EXISTS public.idx_users_score_privacy;

-- Only drop the specific policies we're replacing
DROP POLICY IF EXISTS "Public can view leaderboard_public" ON public.users;
DROP POLICY IF EXISTS "Users can update their own privacy" ON public.users;

-- Ensure privacy_level column is properly configured
ALTER TABLE public.users 
ALTER COLUMN privacy_level SET NOT NULL,
ALTER COLUMN privacy_level SET DEFAULT 'private',
ADD CONSTRAINT privacy_level_check 
    CHECK (privacy_level IN ('private', 'friends', 'public'));

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
        'anonymous_user_' || encode(digest(id::text, 'sha256'), 'base64')
      ELSE display_name
    END AS display_name,
    CASE
      WHEN privacy_level = 'private' THEN NULL
      ELSE photo_url
    END AS photo_url,
    CASE
      WHEN privacy_level = 'private' THEN 0
      ELSE GREATEST(COALESCE(score, 0), 0) -- Prevent negative scores
    END AS score,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE 
          WHEN privacy_level = 'private' THEN 0 
          ELSE COALESCE(score, 0) 
        END DESC,
        created_at ASC -- Consistent tie-breaking
    ) as rank
  FROM public.users
  WHERE deleted_at IS NULL
)
SELECT *
FROM ranked_users;
-- Note: Removed LIMIT clause to support proper pagination in the service layer

-- Set view owner to postgres to enable security definer behavior
ALTER VIEW public.leaderboard_public OWNER TO postgres;

-- Create updated public view policy that works alongside existing policies
CREATE POLICY "Public can view leaderboard_public"
ON public.users FOR SELECT
TO PUBLIC
USING (
  deleted_at IS NULL
  AND (
    privacy_level = 'public'
    OR privacy_level = 'friends'
    OR auth.uid() = id
  )
);

-- Add new privacy-specific update policy
CREATE POLICY "Users can update their own privacy"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Only allow valid privacy levels
    NEW.privacy_level IN ('private', 'friends', 'public')
    -- Only allow updating privacy_level and updated_at
    AND (
      NEW.id = OLD.id
      AND NEW.email = OLD.email
      AND NEW.display_name = OLD.display_name
      AND NEW.photo_url = OLD.photo_url
      AND NEW.device_info = OLD.device_info
      AND NEW.permissions_granted = OLD.permissions_granted
      AND NEW.last_error = OLD.last_error
      AND NEW.last_health_sync = OLD.last_health_sync
      AND NEW.created_at = OLD.created_at
      AND NEW.deleted_at = OLD.deleted_at
      AND NEW.score = OLD.score
    )
  )
);

-- Grant necessary permissions
GRANT SELECT ON public.leaderboard_public TO PUBLIC;
GRANT SELECT ON public.leaderboard_public TO authenticated;
GRANT SELECT ON public.leaderboard_public TO anon;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';