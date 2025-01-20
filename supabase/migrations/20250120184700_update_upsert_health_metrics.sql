-- Drop existing function first to ensure clean replacement
DROP FUNCTION IF EXISTS public.upsert_health_metrics;

-- Recreate function with correct parameter order
CREATE OR REPLACE FUNCTION public.upsert_health_metrics(
    p_date DATE,                -- Required, no default
    p_user_id UUID,             -- Required, no default
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
        updated_at = now()
    WHERE user_id = p_user_id AND date = p_date
    RETURNING * INTO v_result;

    -- If no record was updated, insert a new one
    IF v_result IS NULL THEN
        INSERT INTO public.health_metrics (
            user_id, date, steps, distance, calories,
            heart_rate, daily_score, created_at, updated_at
        )
        VALUES (
            p_user_id, p_date, p_steps, p_distance, p_calories,
            p_heart_rate, p_daily_score, now(), now()
        )
        RETURNING * INTO v_result;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure PostgREST picks up the changes
NOTIFY pgrst, 'reload schema';