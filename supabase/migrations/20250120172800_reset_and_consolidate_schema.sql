-- Backup existing data (only if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
        CREATE TABLE backup_users AS 
        SELECT 
            id,
            email,
            display_name,
            photo_url,
            device_info,
            permissions_granted,
            last_error,
            last_health_sync::timestamptz,
            created_at::timestamptz,
            updated_at::timestamptz,
            deleted_at::timestamptz,
            score
        FROM public.users;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'health_metrics') THEN
        CREATE TABLE backup_health_metrics AS 
        SELECT 
            id,
            user_id,
            date,
            steps,
            distance,
            calories,
            heart_rate,
            daily_score,
            weekly_score,
            streak_days,
            last_updated::timestamptz,
            created_at::timestamptz,
            updated_at::timestamptz,
            version
        FROM public.health_metrics;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'health_metrics_history') THEN
        CREATE TABLE backup_health_metrics_history AS 
        SELECT 
            id,
            metric_id,
            user_id,
            date,
            steps,
            distance,
            calories,
            heart_rate,
            daily_score,
            weekly_score,
            streak_days,
            version,
            changed_at::timestamptz,
            change_type,
            changed_by,
            device_id,
            source
        FROM public.health_metrics_history;
    END IF;
END $$;

-- Drop existing objects
DROP FUNCTION IF EXISTS public.update_daily_ranks CASCADE;
DROP FUNCTION IF EXISTS public.upsert_health_metrics CASCADE;
DROP TABLE IF EXISTS public.health_metrics_history CASCADE;
DROP TABLE IF EXISTS public.health_metrics CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    device_info JSONB,
    permissions_granted BOOLEAN DEFAULT false,
    last_error TEXT,
    last_health_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    score INT4
);

-- Create health_metrics table
CREATE TABLE public.health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    date DATE NOT NULL,
    steps INT4,
    distance NUMERIC,
    calories INT4,
    heart_rate INT4,
    daily_score INT4,
    weekly_score INT4,
    streak_days INT4,
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INT4 DEFAULT 1,
    CONSTRAINT health_metrics_unique_daily_entry UNIQUE (user_id, date)
);

-- Create health_metrics_history table
CREATE TABLE public.health_metrics_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_id UUID REFERENCES public.health_metrics(id),
    user_id UUID REFERENCES public.users(id),
    date DATE NOT NULL,
    steps INT4,
    distance NUMERIC,
    calories INT4,
    heart_rate INT4,
    daily_score INT4,
    weekly_score INT4,
    streak_days INT4,
    version INT4,
    changed_at TIMESTAMPTZ DEFAULT now(),
    change_type TEXT NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    device_id TEXT,
    source TEXT
);

-- Create achievements table
CREATE TABLE public.achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    achievement_type TEXT NOT NULL,
    achieved_at TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, date DESC);
CREATE INDEX idx_health_metrics_history_metric_id ON health_metrics_history(metric_id);
CREATE INDEX idx_health_metrics_history_user_date ON health_metrics_history(user_id, date DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_achievements_user ON achievements(user_id, achievement_type);

-- Create health metrics tracking function
CREATE OR REPLACE FUNCTION public.track_health_metric_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.health_metrics_history (
            metric_id, user_id, date, steps, distance, calories, heart_rate,
            daily_score, weekly_score, streak_days, version, change_type,
            changed_by, device_id, source
        ) VALUES (
            NEW.id, NEW.user_id, NEW.date, NEW.steps, NEW.distance, NEW.calories,
            NEW.heart_rate, NEW.daily_score, NEW.weekly_score, NEW.streak_days,
            1, 'INSERT', auth.uid(),
            current_setting('app.device_id', true),
            current_setting('app.source', true)
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (NEW.steps != OLD.steps OR NEW.distance != OLD.distance OR 
            NEW.calories != OLD.calories OR NEW.heart_rate != OLD.heart_rate OR
            NEW.daily_score != OLD.daily_score OR NEW.weekly_score != OLD.weekly_score OR
            NEW.streak_days != OLD.streak_days) THEN
            
            NEW.version := OLD.version + 1;
            NEW.updated_at := now();
            
            INSERT INTO public.health_metrics_history (
                metric_id, user_id, date, steps, distance, calories, heart_rate,
                daily_score, weekly_score, streak_days, version, change_type,
                changed_by, device_id, source
            ) VALUES (
                NEW.id, NEW.user_id, NEW.date, NEW.steps, NEW.distance, NEW.calories,
                NEW.heart_rate, NEW.daily_score, NEW.weekly_score, NEW.streak_days,
                NEW.version, 'UPDATE', auth.uid(),
                current_setting('app.device_id', true),
                current_setting('app.source', true)
            );
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.health_metrics_history (
            metric_id, user_id, date, steps, distance, calories, heart_rate,
            daily_score, weekly_score, streak_days, version, change_type,
            changed_by, device_id, source
        ) VALUES (
            OLD.id, OLD.user_id, OLD.date, OLD.steps, OLD.distance, OLD.calories,
            OLD.heart_rate, OLD.daily_score, OLD.weekly_score, OLD.streak_days,
            OLD.version, 'DELETE', auth.uid(),
            current_setting('app.device_id', true),
            current_setting('app.source', true)
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for health metric changes
CREATE TRIGGER health_metrics_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.health_metrics
    FOR EACH ROW EXECUTE FUNCTION track_health_metric_changes();

-- Create upsert function with improved error handling
CREATE OR REPLACE FUNCTION public.upsert_health_metrics(
    p_date DATE,
    p_user_id UUID,
    p_calories INT4 DEFAULT 0,
    p_daily_score INT4 DEFAULT 0,
    p_distance NUMERIC DEFAULT 0,
    p_heart_rate INT4 DEFAULT 0,
    p_steps INT4 DEFAULT 0,
    p_device_id TEXT DEFAULT NULL,
    p_source TEXT DEFAULT NULL
)
RETURNS public.health_metrics AS $$
DECLARE
    v_result public.health_metrics;
BEGIN
    -- Validate inputs
    IF p_date IS NULL OR p_user_id IS NULL THEN
        RAISE EXCEPTION 'Date and user_id are required parameters';
    END IF;

    -- Set context for audit trigger
    PERFORM set_config('app.device_id', COALESCE(p_device_id, 'unknown'), true);
    PERFORM set_config('app.source', COALESCE(p_source, 'manual'), true);

    -- Try to update existing record
    UPDATE public.health_metrics
    SET
        steps = p_steps,
        distance = p_distance,
        calories = p_calories,
        heart_rate = p_heart_rate,
        daily_score = p_daily_score,
        updated_at = now(),
        last_updated = now()
    WHERE user_id = p_user_id AND date = p_date
    RETURNING * INTO v_result;

    -- If no record was updated, insert a new one
    IF v_result IS NULL THEN
        INSERT INTO public.health_metrics (
            user_id, date, steps, distance, calories,
            heart_rate, daily_score, created_at, updated_at, last_updated
        )
        VALUES (
            p_user_id, p_date, p_steps, p_distance, p_calories,
            p_heart_rate, p_daily_score, now(), now(), now()
        )
        RETURNING * INTO v_result;
    END IF;

    -- Update user's last_health_sync
    UPDATE public.users
    SET last_health_sync = now()
    WHERE id = p_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create unified RLS policies
CREATE POLICY "Users can manage their own profile"
    ON public.users
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage their own metrics"
    ON public.health_metrics
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own history"
    ON public.health_metrics_history
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own achievements"
    ON public.achievements
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.health_metrics TO authenticated;
GRANT ALL ON public.health_metrics_history TO authenticated;
GRANT ALL ON public.achievements TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_health_metrics TO authenticated;

-- Restore data from backups (only if backup tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'backup_users') THEN
        INSERT INTO public.users SELECT * FROM backup_users;
        DROP TABLE backup_users;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'backup_health_metrics') THEN
        INSERT INTO public.health_metrics SELECT * FROM backup_health_metrics;
        DROP TABLE backup_health_metrics;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'backup_health_metrics_history') THEN
        INSERT INTO public.health_metrics_history SELECT * FROM backup_health_metrics_history;
        DROP TABLE backup_health_metrics_history;
    END IF;
END $$;

-- Ensure PostgREST picks up the changes
NOTIFY pgrst, 'reload schema';