-- Function to check if a user is valid (not deleted)
CREATE OR REPLACE FUNCTION is_user_valid(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = user_id
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle cleanup when a user is deleted
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update deleted_at timestamp
    NEW.deleted_at = COALESCE(NEW.deleted_at, now());
    
    -- Revoke all active sessions for the user
    DELETE FROM auth.sessions
    WHERE user_id = NEW.id;
    
    -- Mark related data as deleted
    UPDATE health_metrics
    SET updated_at = now()
    WHERE user_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user deletion
DROP TRIGGER IF EXISTS on_user_soft_delete ON public.users;
CREATE TRIGGER on_user_soft_delete
    BEFORE UPDATE OF deleted_at ON public.users
    FOR EACH ROW
    WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
    EXECUTE FUNCTION handle_user_deletion();

-- Update RLS policies to use is_user_valid function
DROP POLICY IF EXISTS "Users can read their own metrics" ON health_metrics;
CREATE POLICY "Users can read their own metrics"
    ON health_metrics FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        AND is_user_valid(auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert their own metrics" ON health_metrics;
CREATE POLICY "Users can insert their own metrics"
    ON health_metrics FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND is_user_valid(auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own metrics" ON health_metrics;
CREATE POLICY "Users can update their own metrics"
    ON health_metrics FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id 
        AND is_user_valid(auth.uid())
    );

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_user_valid TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_valid TO service_role;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';