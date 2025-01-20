-- Drop the view if it exists (safe to do since it's just a view)
DROP VIEW IF EXISTS public.leaderboard_public CASCADE;

-- Create or replace the sanitized leaderboard view with improved privacy and performance
CREATE OR REPLACE VIEW public.leaderboard_public
WITH (security_barrier = true)
AS
WITH ranked_users AS (
  SELECT
    -- Hash the user_id for public display
    encode(digest(id::text, 'sha256'), 'hex') AS public_id,
    CASE
      WHEN privacy_level IS NULL OR privacy_level = 'private' THEN 
        'anonymous_user_' || encode(digest(id::text, 'sha256'), 'base64')
      WHEN display_name IS NULL OR display_name = '' THEN 
        'anonymous_user_' || encode(digest(id::text, 'sha256'), 'base64')
      ELSE display_name
    END AS display_name,
    CASE
      WHEN privacy_level IS NULL OR privacy_level = 'private' THEN NULL
      ELSE photo_url
    END AS photo_url,
    CASE
      WHEN privacy_level IS NULL OR privacy_level = 'private' THEN 0
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
FROM ranked_users
LIMIT 1000; -- Prevent excessive data transfer

-- Set view owner to postgres to enable security definer behavior
DO $$ 
BEGIN
    ALTER VIEW public.leaderboard_public OWNER TO postgres;
EXCEPTION
    WHEN insufficient_privilege THEN
        -- Skip if we don't have permission to change owner
        NULL;
END $$;

-- Create index if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND indexname = 'idx_users_score_privacy'
    ) THEN
        CREATE INDEX idx_users_score_privacy 
        ON public.users(score DESC, privacy_level, created_at)
        WHERE deleted_at IS NULL;
    END IF;
END $$;

-- Explicitly grant access to the view
GRANT SELECT ON public.leaderboard_public TO PUBLIC;
GRANT SELECT ON public.leaderboard_public TO authenticated;
GRANT SELECT ON public.leaderboard_public TO anon;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';