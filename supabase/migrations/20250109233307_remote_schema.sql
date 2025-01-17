drop trigger if exists "achievement_stats_trigger" on "public"."achievements";

drop trigger if exists "update_health_metrics_updated_at" on "public"."health_metrics";

drop trigger if exists "update_streak_trigger" on "public"."health_metrics";

drop trigger if exists "update_users_updated_at" on "public"."users";

drop policy "System can manage achievements" on "public"."achievements";

drop policy "Users can view their own achievements" on "public"."achievements";

drop policy "Users can insert their own metrics" on "public"."health_metrics";

drop policy "Users can read their own metrics" on "public"."health_metrics";

drop policy "Users can update their own metrics" on "public"."health_metrics";

drop policy "Leaderboard rankings are viewable by everyone" on "public"."leaderboard_rankings";

drop policy "Users can insert their own data" on "public"."users";

drop policy "Users can read their own data" on "public"."users";

drop policy "Users can update their own data" on "public"."users";

revoke delete on table "public"."achievements" from "anon";

revoke insert on table "public"."achievements" from "anon";

revoke references on table "public"."achievements" from "anon";

revoke select on table "public"."achievements" from "anon";

revoke trigger on table "public"."achievements" from "anon";

revoke truncate on table "public"."achievements" from "anon";

revoke update on table "public"."achievements" from "anon";

revoke delete on table "public"."achievements" from "authenticated";

revoke insert on table "public"."achievements" from "authenticated";

revoke references on table "public"."achievements" from "authenticated";

revoke select on table "public"."achievements" from "authenticated";

revoke trigger on table "public"."achievements" from "authenticated";

revoke truncate on table "public"."achievements" from "authenticated";

revoke update on table "public"."achievements" from "authenticated";

revoke delete on table "public"."achievements" from "service_role";

revoke insert on table "public"."achievements" from "service_role";

revoke references on table "public"."achievements" from "service_role";

revoke select on table "public"."achievements" from "service_role";

revoke trigger on table "public"."achievements" from "service_role";

revoke truncate on table "public"."achievements" from "service_role";

revoke update on table "public"."achievements" from "service_role";

revoke delete on table "public"."leaderboard_rankings" from "anon";

revoke insert on table "public"."leaderboard_rankings" from "anon";

revoke references on table "public"."leaderboard_rankings" from "anon";

revoke select on table "public"."leaderboard_rankings" from "anon";

revoke trigger on table "public"."leaderboard_rankings" from "anon";

revoke truncate on table "public"."leaderboard_rankings" from "anon";

revoke update on table "public"."leaderboard_rankings" from "anon";

revoke delete on table "public"."leaderboard_rankings" from "authenticated";

revoke insert on table "public"."leaderboard_rankings" from "authenticated";

revoke references on table "public"."leaderboard_rankings" from "authenticated";

revoke select on table "public"."leaderboard_rankings" from "authenticated";

revoke trigger on table "public"."leaderboard_rankings" from "authenticated";

revoke truncate on table "public"."leaderboard_rankings" from "authenticated";

revoke update on table "public"."leaderboard_rankings" from "authenticated";

revoke delete on table "public"."leaderboard_rankings" from "service_role";

revoke insert on table "public"."leaderboard_rankings" from "service_role";

revoke references on table "public"."leaderboard_rankings" from "service_role";

revoke select on table "public"."leaderboard_rankings" from "service_role";

revoke trigger on table "public"."leaderboard_rankings" from "service_role";

revoke truncate on table "public"."leaderboard_rankings" from "service_role";

revoke update on table "public"."leaderboard_rankings" from "service_role";

revoke delete on table "public"."leaderboards" from "anon";

revoke insert on table "public"."leaderboards" from "anon";

revoke references on table "public"."leaderboards" from "anon";

revoke select on table "public"."leaderboards" from "anon";

revoke trigger on table "public"."leaderboards" from "anon";

revoke truncate on table "public"."leaderboards" from "anon";

revoke update on table "public"."leaderboards" from "anon";

revoke delete on table "public"."leaderboards" from "authenticated";

revoke insert on table "public"."leaderboards" from "authenticated";

revoke references on table "public"."leaderboards" from "authenticated";

revoke select on table "public"."leaderboards" from "authenticated";

revoke trigger on table "public"."leaderboards" from "authenticated";

revoke truncate on table "public"."leaderboards" from "authenticated";

revoke update on table "public"."leaderboards" from "authenticated";

revoke delete on table "public"."leaderboards" from "service_role";

revoke insert on table "public"."leaderboards" from "service_role";

revoke references on table "public"."leaderboards" from "service_role";

revoke select on table "public"."leaderboards" from "service_role";

revoke trigger on table "public"."leaderboards" from "service_role";

revoke truncate on table "public"."leaderboards" from "service_role";

revoke update on table "public"."leaderboards" from "service_role";

alter table "public"."achievements" drop constraint "achievements_user_id_fkey";

alter table "public"."health_metrics" drop constraint "chk_calories_non_negative";

alter table "public"."health_metrics" drop constraint "chk_distance_non_negative";

alter table "public"."health_metrics" drop constraint "chk_heartrate_non_negative";

alter table "public"."health_metrics" drop constraint "chk_steps_non_negative";

alter table "public"."leaderboard_rankings" drop constraint "leaderboard_rankings_leaderboard_id_fkey";

alter table "public"."leaderboard_rankings" drop constraint "leaderboard_rankings_period_type_check";

alter table "public"."leaderboard_rankings" drop constraint "leaderboard_rankings_user_id_fkey";

alter table "public"."users" drop constraint "users_email_key";

alter table "public"."health_metrics" drop constraint "health_metrics_user_id_fkey";

alter table "public"."users" drop constraint "users_id_fkey";

alter table "public"."achievements" drop constraint "achievements_pkey";

alter table "public"."leaderboard_rankings" drop constraint "leaderboard_rankings_pkey";

alter table "public"."leaderboards" drop constraint "leaderboards_pkey";

drop index if exists "public"."achievements_pkey";

drop index if exists "public"."idx_achievements_user";

drop index if exists "public"."idx_leaderboard_rankings_user_leaderboard";

drop index if exists "public"."idx_leaderboard_rankings_user_period";

drop index if exists "public"."leaderboard_rankings_pkey";

drop index if exists "public"."leaderboards_pkey";

drop index if exists "public"."users_email_key";

drop index if exists "public"."idx_health_metrics_user_date";

drop table "public"."achievements";

drop table "public"."leaderboard_rankings";

drop table "public"."leaderboards";

alter table "public"."health_metrics" drop column "heartrate";

alter table "public"."health_metrics" drop column "rank";

alter table "public"."health_metrics" drop column "score";

alter table "public"."health_metrics" add column "heart_rate" integer;

alter table "public"."health_metrics" add column "score" integer generated always as (((((COALESCE(LEAST((((steps)::double precision / (10000)::double precision) * (25)::double precision), (25)::double precision), (0)::double precision))::integer + (COALESCE(LEAST(((distance / (8)::numeric) * (25)::numeric), (25)::numeric), (0)::numeric))::integer) + (COALESCE(LEAST((((calories)::double precision / (2500)::double precision) * (25)::double precision), (25)::double precision), (0)::double precision))::integer) +
CASE
    WHEN (heart_rate IS NOT NULL) THEN 25
    ELSE 0
END)) stored;

alter table "public"."health_metrics" alter column "created_at" set default now();

alter table "public"."health_metrics" alter column "created_at" drop not null;

alter table "public"."health_metrics" alter column "date" drop not null;

alter table "public"."health_metrics" alter column "distance" drop not null;

alter table "public"."health_metrics" alter column "id" set default gen_random_uuid();

alter table "public"."health_metrics" alter column "steps" drop not null;

alter table "public"."health_metrics" alter column "updated_at" set default now();

alter table "public"."health_metrics" alter column "updated_at" drop not null;

alter table "public"."health_metrics" alter column "user_id" drop not null;

alter table "public"."users" drop column "achievement_points";

alter table "public"."users" drop column "current_streak";

alter table "public"."users" drop column "longest_streak";

alter table "public"."users" drop column "privacy_settings";

alter table "public"."users" drop column "total_achievements";

alter table "public"."users" alter column "created_at" set default now();

alter table "public"."users" alter column "created_at" drop not null;

alter table "public"."users" alter column "email" drop not null;

alter table "public"."users" alter column "settings" drop default;

alter table "public"."users" alter column "updated_at" set default now();

alter table "public"."users" alter column "updated_at" drop not null;

CREATE INDEX idx_health_metrics_score ON public.health_metrics USING btree (score DESC);

CREATE INDEX idx_health_metrics_user_date ON public.health_metrics USING btree (user_id, date DESC);

alter table "public"."health_metrics" add constraint "health_metrics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."health_metrics" validate constraint "health_metrics_user_id_fkey";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."users" validate constraint "users_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_daily_leaderboard(target_date date)
 RETURNS TABLE(user_id uuid, score integer, user_info jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        hm.user_id,
        hm.score,
        jsonb_build_object(
            'display_name', u.display_name,
            'photo_url', u.photo_url,
            'settings', u.settings
        ) as user_info
    FROM health_metrics hm
    JOIN users u ON u.id = hm.user_id
    WHERE 
        hm.date = target_date
        AND (
            (u.settings->>'privacyLevel')::text = 'public'
            OR hm.user_id = auth.uid()
        )
    ORDER BY hm.score DESC
    LIMIT 100;  -- Limit to top 100 for performance
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_daily_leaderboard(target_date text)
 RETURNS TABLE(user_id uuid, steps integer, distance numeric, score integer, users jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        hm.user_id,
        hm.steps,
        hm.distance,
        hm.score,
        jsonb_build_object(
            'display_name', u.display_name,
            'photo_url', u.photo_url,
            'settings', u.settings
        ) as users
    FROM health_metrics hm
    JOIN users u ON u.id = hm.user_id
    WHERE 
        hm.date = target_date::date
        AND (
            -- Include only public profiles and the requesting user's data
            (u.settings->>'privacyLevel')::text = 'public'
            OR hm.user_id = auth.uid()
        )
    ORDER BY hm.score DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(start_date date, end_date date)
 RETURNS TABLE(user_id uuid, total_score bigint, user_info jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        hm.user_id,
        SUM(hm.score)::BIGINT as total_score,
        jsonb_build_object(
            'display_name', u.display_name,
            'photo_url', u.photo_url,
            'settings', u.settings
        ) as user_info
    FROM health_metrics hm
    JOIN users u ON u.id = hm.user_id
    WHERE 
        hm.date BETWEEN start_date AND end_date
        AND (
            (u.settings->>'privacyLevel')::text = 'public'
            OR hm.user_id = auth.uid()
        )
    GROUP BY 
        hm.user_id,
        u.display_name,
        u.photo_url,
        u.settings
    ORDER BY total_score DESC
    LIMIT 100;  -- Limit to top 100 for performance
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(start_date text, end_date text)
 RETURNS TABLE(user_id uuid, steps bigint, distance numeric, score bigint, users jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        hm.user_id,
        SUM(hm.steps)::BIGINT as steps,
        SUM(hm.distance)::NUMERIC as distance,
        SUM(hm.score)::BIGINT as score,
        jsonb_build_object(
            'display_name', u.display_name,
            'photo_url', u.photo_url,
            'settings', u.settings
        ) as users
    FROM health_metrics hm
    JOIN users u ON u.id = hm.user_id
    WHERE 
        hm.date BETWEEN start_date::date AND end_date::date
        AND (
            -- Include only public profiles and the requesting user's data
            (u.settings->>'privacyLevel')::text = 'public'
            OR hm.user_id = auth.uid()
        )
    GROUP BY 
        hm.user_id,
        u.display_name,
        u.photo_url,
        u.settings
    ORDER BY SUM(hm.score) DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_daily_ranks(target_date date)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  with ranked_metrics as (
    select
      id,
      row_number() over (order by score desc) as new_rank
    from health_metrics
    where date = target_date
  )
  update health_metrics hm
  set rank = rm.new_rank
  from ranked_metrics rm
  where hm.id = rm.id
    and hm.date = target_date;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_streak()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  streak_count INT;
BEGIN
  -- Check if user had metrics yesterday
  SELECT current_streak 
  INTO streak_count 
  FROM users 
  WHERE id = NEW.user_id;
  
  IF EXISTS (
    SELECT 1 
    FROM health_metrics 
    WHERE user_id = NEW.user_id 
    AND date = yesterday_date
  ) THEN
    -- Continue streak
    streak_count := streak_count + 1;
  ELSE
    -- Reset streak
    streak_count := 1;
  END IF;
  
  -- Update user streaks
  UPDATE users 
  SET 
    current_streak = streak_count,
    longest_streak = GREATEST(longest_streak, streak_count)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$function$
;

create policy "Users can manage own health metrics"
on "public"."health_metrics"
as permissive
for all
to public
using ((auth.uid() = user_id));


create policy "Enable insert for authenticated users only"
on "public"."users"
as permissive
for insert
to authenticated
with check ((id = auth.uid()));


create policy "Users can read own data"
on "public"."users"
as permissive
for all
to public
using ((auth.uid() = id));



