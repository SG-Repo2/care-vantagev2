-- Create function to check if auth user exists
CREATE OR REPLACE FUNCTION public.check_auth_user_exists(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = user_id
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_auth_user_exists(uuid) TO authenticated;

-- Create trigger to ensure auth user exists before profile creation
CREATE OR REPLACE FUNCTION public.ensure_auth_user_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = NEW.id
    ) THEN
        RAISE EXCEPTION 'Auth user must exist before creating profile'
            USING HINT = 'Wait for auth record to propagate',
                  ERRCODE = '23503';
    END IF;
    RETURN NEW;
END;
$$;

-- Add trigger to users table
DROP TRIGGER IF EXISTS ensure_auth_user_exists_trigger ON public.users;
CREATE TRIGGER ensure_auth_user_exists_trigger
    BEFORE INSERT OR UPDATE
    ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_auth_user_exists();

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema'; 