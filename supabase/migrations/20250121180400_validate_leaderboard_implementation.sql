-- This is a validation script to verify the leaderboard implementation
-- It can be run after applying the main migration to ensure everything is working correctly

DO $$
DECLARE
    view_exists boolean;
    policy_exists boolean;
    index_exists boolean;
    privacy_check boolean;
    constraint_exists boolean;
BEGIN
    -- Check if view exists
    SELECT EXISTS (
        SELECT FROM pg_views
        WHERE viewname = 'leaderboard_public'
    ) INTO view_exists;
    
    ASSERT view_exists = true, 
        'leaderboard_public view does not exist';

    -- Check if RLS policies exist
    SELECT EXISTS (
        SELECT FROM pg_policies
        WHERE policyname = 'Users can update their own privacy'
        AND tablename = 'users'
    ) INTO policy_exists;
    
    ASSERT policy_exists = true, 
        'Privacy update policy does not exist';

    -- Check if required indices exist
    SELECT EXISTS (
        SELECT FROM pg_indexes
        WHERE indexname = 'idx_users_score_privacy'
    ) INTO index_exists;
    
    ASSERT index_exists = true, 
        'Required index idx_users_score_privacy does not exist';

    -- Verify privacy level column configuration
    SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'privacy_level'
        AND data_type = 'text'
        AND is_nullable = 'NO'
        AND column_default = '''private''::text'
    ) INTO privacy_check;
    
    ASSERT privacy_check = true, 
        'Privacy level column configuration is incorrect. Expected: NOT NULL with default ''private''';

    -- Verify privacy level constraint exists
    SELECT EXISTS (
        SELECT FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage cu 
            ON cc.constraint_name = cu.constraint_name
        WHERE cu.table_name = 'users'
        AND cu.column_name = 'privacy_level'
        AND cc.check_clause LIKE '%IN %private%public%friends%'
    ) INTO constraint_exists;

    ASSERT constraint_exists = true,
        'Privacy level check constraint is missing or incorrect';

    -- Test view masking
    ASSERT (
        SELECT COUNT(*) = 0 
        FROM leaderboard_public 
        WHERE score < 0
    ), 'View contains negative scores';

    -- Verify no NULL privacy levels exist
    ASSERT (
        SELECT COUNT(*) = 0
        FROM users
        WHERE privacy_level IS NULL
    ), 'Found NULL values in privacy_level column';

    RAISE NOTICE 'All validation checks passed successfully';
END;
$$;

-- Verify the view returns expected columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leaderboard_public'
ORDER BY ordinal_position;

-- Verify indices are properly created
SELECT 
    schemaname as schema,
    tablename as table,
    indexname as index,
    indexdef as definition
FROM pg_indexes
WHERE tablename = 'users'
ORDER BY indexname;

-- Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Test view performance (explain analyze)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM leaderboard_public
LIMIT 50;