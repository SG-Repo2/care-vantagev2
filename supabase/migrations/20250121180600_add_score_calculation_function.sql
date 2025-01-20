-- Create function to calculate health score consistently on the server
CREATE OR REPLACE FUNCTION calculate_health_score(
  p_steps INTEGER,
  p_distance FLOAT,
  p_calories INTEGER,
  p_heart_rate INTEGER
) RETURNS INTEGER AS $$
DECLARE
  v_steps_score INTEGER;
  v_distance_score INTEGER;
  v_calories_score INTEGER;
  v_heart_rate_score INTEGER;
  v_total_score INTEGER;
BEGIN
  -- Steps score calculation
  IF p_steps >= 10000 THEN
    v_steps_score := 100;
  ELSIF p_steps >= 5000 THEN
    v_steps_score := 50 + ROUND((p_steps - 5000)::FLOAT / 5000 * 50);
  ELSIF p_steps > 0 THEN
    v_steps_score := ROUND((p_steps::FLOAT / 5000) * 50);
  ELSE
    v_steps_score := 0;
  END IF;

  -- Distance score calculation
  IF p_distance >= 8.05 THEN
    v_distance_score := 100;
  ELSIF p_distance >= 4.0 THEN
    v_distance_score := 50 + ROUND((p_distance - 4.0) / 4.05 * 50);
  ELSIF p_distance > 0 THEN
    v_distance_score := ROUND((p_distance / 4.0) * 50);
  ELSE
    v_distance_score := 0;
  END IF;

  -- Calories score calculation
  IF p_calories >= 500 THEN
    v_calories_score := 100;
  ELSIF p_calories >= 300 THEN
    v_calories_score := 50 + ROUND((p_calories - 300)::FLOAT / 200 * 50);
  ELSIF p_calories > 0 THEN
    v_calories_score := ROUND((p_calories::FLOAT / 300) * 50);
  ELSE
    v_calories_score := 0;
  END IF;

  -- Heart rate score calculation
  IF p_heart_rate BETWEEN 60 AND 100 THEN
    v_heart_rate_score := 100;
  ELSE
    v_heart_rate_score := 0;
  END IF;

  -- Calculate weighted average (matching client-side weights)
  v_total_score := ROUND(
    v_steps_score * 0.3 +
    v_distance_score * 0.3 +
    v_calories_score * 0.2 +
    v_heart_rate_score * 0.2
  );

  RETURN v_total_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the upsert_health_metrics function to use the new score calculation
CREATE OR REPLACE FUNCTION upsert_health_metrics(
  p_date DATE,
  p_user_id UUID,
  p_calories INTEGER,
  p_distance FLOAT,
  p_heart_rate INTEGER,
  p_steps INTEGER,
  p_device_id TEXT,
  p_source TEXT
) RETURNS TABLE (
  success BOOLEAN,
  daily_score INTEGER
) AS $$
DECLARE
  v_daily_score INTEGER;
BEGIN
  -- Calculate score using the new function
  v_daily_score := calculate_health_score(
    p_steps,
    p_distance,
    p_calories,
    p_heart_rate
  );

  -- Upsert the health metrics with calculated score
  INSERT INTO health_metrics (
    date,
    user_id,
    calories,
    distance,
    heart_rate,
    steps,
    daily_score,
    device_id,
    source,
    created_at,
    updated_at
  ) VALUES (
    p_date,
    p_user_id,
    p_calories,
    p_distance,
    p_heart_rate,
    p_steps,
    v_daily_score,
    p_device_id,
    p_source,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, date) 
  DO UPDATE SET
    calories = EXCLUDED.calories,
    distance = EXCLUDED.distance,
    heart_rate = EXCLUDED.heart_rate,
    steps = EXCLUDED.steps,
    daily_score = v_daily_score,
    device_id = EXCLUDED.device_id,
    source = EXCLUDED.source,
    updated_at = NOW();

  -- Return success and the calculated score
  RETURN QUERY SELECT 
    TRUE as success,
    v_daily_score as daily_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;