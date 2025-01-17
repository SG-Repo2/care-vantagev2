-- Add soft delete to users table
ALTER TABLE public.users
ADD COLUMN deleted_at timestamptz;

-- Modify RLS policies to check for soft delete
DROP POLICY IF EXISTS "Users can read their own metrics" ON health_metrics;
CREATE POLICY "Users can read their own metrics"
    ON health_metrics FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        AND NOT EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND deleted_at IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Users can insert their own metrics" ON health_metrics;
CREATE POLICY "Users can insert their own metrics"
    ON health_metrics FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND NOT EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND deleted_at IS NOT NULL
        )
    );

DROP POLICY IF EXISTS "Users can update their own metrics" ON health_metrics;
CREATE POLICY "Users can update their own metrics"
    ON health_metrics FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id 
        AND NOT EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND deleted_at IS NOT NULL
        )
    );

-- Add function to soft delete users
CREATE OR REPLACE FUNCTION soft_delete_user(user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.users
    SET deleted_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION soft_delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_user TO service_role;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';