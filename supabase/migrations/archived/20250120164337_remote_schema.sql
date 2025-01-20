drop policy "Users can insert their own profile" on "public"."users";

revoke delete on table "public"."health_metrics" from "service_role";

revoke insert on table "public"."health_metrics" from "service_role";

revoke references on table "public"."health_metrics" from "service_role";

revoke select on table "public"."health_metrics" from "service_role";

revoke trigger on table "public"."health_metrics" from "service_role";

revoke truncate on table "public"."health_metrics" from "service_role";

revoke update on table "public"."health_metrics" from "service_role";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

alter table "public"."users" drop column "last_health_sync";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_daily_ranks(target_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update daily_score based on ranking
  WITH ranked_metrics AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY daily_score DESC) as rank_position
    FROM health_metrics
    WHERE date = target_date
  )
  UPDATE health_metrics hm
  SET daily_score = 100 - LEAST((rm.rank_position - 1) * 5, 100)  -- Score decreases by 5 for each rank, minimum 0
  FROM ranked_metrics rm
  WHERE hm.id = rm.id
    AND hm.date = target_date;
END;
$function$
;


