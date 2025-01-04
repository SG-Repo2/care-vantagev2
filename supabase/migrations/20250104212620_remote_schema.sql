create type "public"."achievement_type" as enum ('daily_goal', 'weekly_goal', 'monthly_goal', 'streak', 'rank_improvement', 'competition_win');

drop policy "Users can insert their own health metrics" on "public"."health_metrics";

drop policy "Users can read public health metrics" on "public"."health_metrics";

drop policy "Users can update their own health metrics" on "public"."health_metrics";

drop policy "Users can insert their own profile" on "public"."users";

drop policy "Users can read all profiles" on "public"."users";

drop policy "Users can update their own profile" on "public"."users";

alter table "public"."health_metrics" drop constraint "health_metrics_user_id_fkey";

alter table "public"."users" drop constraint "users_id_fkey";

drop function if exists "public"."get_recent_health_metrics"(days_ago integer);

drop index if exists "public"."idx_health_metrics_date";

drop index if exists "public"."idx_health_metrics_date_score_range";

drop index if exists "public"."idx_health_metrics_score";

drop index if exists "public"."idx_health_metrics_user_id";

drop index if exists "public"."idx_users_email";

drop index if exists "public"."idx_users_privacy_level";

create table "public"."achievements" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "type" achievement_type not null,
    "title" character varying(100) not null,
    "description" text,
    "points" integer default 0,
    "earned_at" timestamp with time zone default now()
);


alter table "public"."achievements" enable row level security;

create table "public"."leaderboard_rankings" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid,
    "rank" integer not null,
    "score" integer not null,
    "streak_days" integer default 0,
    "period_type" character varying(10) not null,
    "start_date" date not null,
    "end_date" date not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."leaderboard_rankings" enable row level security;

alter table "public"."health_metrics" add column "rank" integer;

alter table "public"."health_metrics" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."health_metrics" alter column "created_at" set not null;

alter table "public"."health_metrics" alter column "distance" drop default;

alter table "public"."health_metrics" alter column "id" set default uuid_generate_v4();

alter table "public"."health_metrics" alter column "score" drop default;

alter table "public"."health_metrics" alter column "steps" drop default;

alter table "public"."health_metrics" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."health_metrics" alter column "updated_at" set not null;

alter table "public"."users" add column "achievement_points" integer default 0;

alter table "public"."users" add column "current_streak" integer default 0;

alter table "public"."users" add column "longest_streak" integer default 0;

alter table "public"."users" add column "total_achievements" integer default 0;

alter table "public"."users" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."users" alter column "created_at" set not null;

alter table "public"."users" alter column "settings" set default '{"privacyLevel": "private", "notifications": true, "measurementSystem": "metric"}'::jsonb;

alter table "public"."users" alter column "updated_at" set default timezone('utc'::text, now());

alter table "public"."users" alter column "updated_at" set not null;

CREATE UNIQUE INDEX achievements_pkey ON public.achievements USING btree (id);

CREATE INDEX idx_achievements_user ON public.achievements USING btree (user_id);

CREATE INDEX idx_health_metrics_user_date ON public.health_metrics USING btree (user_id, date);

CREATE INDEX idx_leaderboard_rankings_user_period ON public.leaderboard_rankings USING btree (user_id, period_type, start_date);

CREATE UNIQUE INDEX leaderboard_rankings_pkey ON public.leaderboard_rankings USING btree (id);

alter table "public"."achievements" add constraint "achievements_pkey" PRIMARY KEY using index "achievements_pkey";

alter table "public"."leaderboard_rankings" add constraint "leaderboard_rankings_pkey" PRIMARY KEY using index "leaderboard_rankings_pkey";

alter table "public"."achievements" add constraint "achievements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."achievements" validate constraint "achievements_user_id_fkey";

alter table "public"."leaderboard_rankings" add constraint "leaderboard_rankings_period_type_check" CHECK (((period_type)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying])::text[]))) not valid;

alter table "public"."leaderboard_rankings" validate constraint "leaderboard_rankings_period_type_check";

alter table "public"."leaderboard_rankings" add constraint "leaderboard_rankings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."leaderboard_rankings" validate constraint "leaderboard_rankings_user_id_fkey";

alter table "public"."health_metrics" add constraint "health_metrics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."health_metrics" validate constraint "health_metrics_user_id_fkey";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) not valid;

alter table "public"."users" validate constraint "users_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.random_between(min_val integer, max_val integer)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
BEGIN
   RETURN floor(random() * (max_val - min_val + 1) + min_val);
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

CREATE OR REPLACE FUNCTION public.update_user_achievement_stats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE users
  SET 
    total_achievements = (
      SELECT COUNT(*) 
      FROM achievements 
      WHERE user_id = NEW.user_id
    ),
    achievement_points = (
      SELECT COALESCE(SUM(points), 0) 
      FROM achievements 
      WHERE user_id = NEW.user_id
    )
  WHERE id = NEW.user_id;
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."achievements" to "anon";

grant insert on table "public"."achievements" to "anon";

grant references on table "public"."achievements" to "anon";

grant select on table "public"."achievements" to "anon";

grant trigger on table "public"."achievements" to "anon";

grant truncate on table "public"."achievements" to "anon";

grant update on table "public"."achievements" to "anon";

grant delete on table "public"."achievements" to "authenticated";

grant insert on table "public"."achievements" to "authenticated";

grant references on table "public"."achievements" to "authenticated";

grant select on table "public"."achievements" to "authenticated";

grant trigger on table "public"."achievements" to "authenticated";

grant truncate on table "public"."achievements" to "authenticated";

grant update on table "public"."achievements" to "authenticated";

grant delete on table "public"."achievements" to "service_role";

grant insert on table "public"."achievements" to "service_role";

grant references on table "public"."achievements" to "service_role";

grant select on table "public"."achievements" to "service_role";

grant trigger on table "public"."achievements" to "service_role";

grant truncate on table "public"."achievements" to "service_role";

grant update on table "public"."achievements" to "service_role";

grant delete on table "public"."leaderboard_rankings" to "anon";

grant insert on table "public"."leaderboard_rankings" to "anon";

grant references on table "public"."leaderboard_rankings" to "anon";

grant select on table "public"."leaderboard_rankings" to "anon";

grant trigger on table "public"."leaderboard_rankings" to "anon";

grant truncate on table "public"."leaderboard_rankings" to "anon";

grant update on table "public"."leaderboard_rankings" to "anon";

grant delete on table "public"."leaderboard_rankings" to "authenticated";

grant insert on table "public"."leaderboard_rankings" to "authenticated";

grant references on table "public"."leaderboard_rankings" to "authenticated";

grant select on table "public"."leaderboard_rankings" to "authenticated";

grant trigger on table "public"."leaderboard_rankings" to "authenticated";

grant truncate on table "public"."leaderboard_rankings" to "authenticated";

grant update on table "public"."leaderboard_rankings" to "authenticated";

grant delete on table "public"."leaderboard_rankings" to "service_role";

grant insert on table "public"."leaderboard_rankings" to "service_role";

grant references on table "public"."leaderboard_rankings" to "service_role";

grant select on table "public"."leaderboard_rankings" to "service_role";

grant trigger on table "public"."leaderboard_rankings" to "service_role";

grant truncate on table "public"."leaderboard_rankings" to "service_role";

grant update on table "public"."leaderboard_rankings" to "service_role";

create policy "System can manage achievements"
on "public"."achievements"
as permissive
for all
to public
using (true)
with check (true);


create policy "Users can view their own achievements"
on "public"."achievements"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can insert their own metrics"
on "public"."health_metrics"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can read their own metrics"
on "public"."health_metrics"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can update their own metrics"
on "public"."health_metrics"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Leaderboard rankings are viewable by everyone"
on "public"."leaderboard_rankings"
as permissive
for select
to public
using (true);


create policy "Users can read their own data"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Users can update their own data"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id));


CREATE TRIGGER achievement_stats_trigger AFTER INSERT OR DELETE OR UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION update_user_achievement_stats();

CREATE TRIGGER update_streak_trigger AFTER INSERT ON public.health_metrics FOR EACH ROW EXECUTE FUNCTION update_user_streak();


