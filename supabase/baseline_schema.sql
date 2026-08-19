
-- Baseline schema snapshot — captured 2026-08-19 via `supabase db dump --schema public`.
--
-- This is NOT a migration to be replayed — it's a one-time reference dump of the `public`
-- schema (tables, RLS policies, functions) as it existed on this date. It exists because
-- several core tables (profiles, applications, files, education, experience) and their RLS
-- policies were originally created by hand in the Supabase dashboard, before this project had
-- any migration files at all — so `supabase/migrations/` alone cannot rebuild the database from
-- scratch. This file closes that gap. Going forward, schema CHANGES still belong in a new
-- timestamped migration file, not in edits to this file.
--
-- Storage bucket configuration (the `resumes`/`cvs` buckets, private + owner-folder policies)
-- lives in Supabase's internal `storage` schema, which `--schema public` does not capture. That
-- setup is fully covered by `supabase/migrations/20260817120500_storage_private_buckets.sql`
-- instead, so it is intentionally not duplicated here.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."consume_rate_limit"("p_subject" "text", "p_endpoint" "text", "p_window_seconds" integer, "p_max_requests" integer DEFAULT NULL::integer, "p_max_tokens" bigint DEFAULT NULL::bigint, "p_tokens" bigint DEFAULT 0) RETURNS TABLE("allowed" boolean, "requests_used" integer, "tokens_used" bigint, "retry_after_seconds" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  v_window_start timestamptz;
  v_requests integer;
  v_tokens bigint;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits as t
    (subject, endpoint, window_seconds, window_start, request_count, token_count)
  values (p_subject, p_endpoint, p_window_seconds, v_window_start, 1, p_tokens)
  on conflict (subject, endpoint, window_seconds, window_start) do update
    set request_count = t.request_count + 1,
        token_count   = t.token_count + p_tokens,
        updated_at    = now()
  returning t.request_count, t.token_count into v_requests, v_tokens;

  return query select
    ((p_max_requests is null or v_requests <= p_max_requests)
       and (p_max_tokens is null or v_tokens <= p_max_tokens)),
    v_requests,
    v_tokens,
    greatest(1, ceil(extract(epoch from (v_window_start
       + make_interval(secs => p_window_seconds)) - clock_timestamp()))::integer);
end;
$$;


ALTER FUNCTION "public"."consume_rate_limit"("p_subject" "text", "p_endpoint" "text", "p_window_seconds" integer, "p_max_requests" integer, "p_max_tokens" bigint, "p_tokens" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_profile_for_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into profiles (user_id)
  values (new.id);
  return new;
end;
$$;


ALTER FUNCTION "public"."create_profile_for_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text",
    "description" "text",
    "xp" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."api_rate_limits" (
    "subject" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "window_seconds" integer NOT NULL,
    "window_start" timestamp with time zone NOT NULL,
    "request_count" integer DEFAULT 0 NOT NULL,
    "token_count" bigint DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."api_rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "companyName" "text",
    "position" "text",
    "status" "text",
    "applied_at" "date",
    "notes" "text",
    "user_id" "uuid",
    "resume_url" "text",
    "cv_url" "text",
    "jobType" "text" DEFAULT 'internship'::"text",
    "jobUrl" "text",
    "matchScore" integer DEFAULT 85,
    "location" "text"
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."education" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "institution" "text" NOT NULL,
    "degree" "text",
    "field_of_study" "text",
    "gpa" "text",
    "graduation_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."education" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."experience" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "company" "text" NOT NULL,
    "role" "text" NOT NULL,
    "location" "text",
    "description" "text",
    "start_date" "date",
    "end_date" "date",
    "is_current" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."experience" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "file_name" "text",
    "file_url" "text",
    "type" "text",
    "user_id" "uuid",
    "application_id" "uuid",
    "size" bigint,
    "mime_type" "text"
);


ALTER TABLE "public"."files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_listings_cache" (
    "id" "text" DEFAULT 'global'::"text" NOT NULL,
    "payload" "jsonb" NOT NULL,
    "job_count" integer NOT NULL,
    "source_stats" "jsonb",
    "fetched_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "refreshing_until" timestamp with time zone
);


ALTER TABLE "public"."job_listings_cache" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_scores" (
    "user_id" "uuid" NOT NULL,
    "job_id" "text" NOT NULL,
    "resume_sha256" "text",
    "match_percentage" smallint NOT NULL,
    "matched_skills" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "missing_skills" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "reason" "text",
    "model" "text" NOT NULL,
    "scored_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."job_scores" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text",
    "email" "text",
    "xp" integer DEFAULT 0,
    "level" integer DEFAULT 0,
    "streak" integer DEFAULT 0,
    "last_activity" "date",
    "longest_streak" integer DEFAULT 0,
    "onboarding_completed" boolean DEFAULT false,
    "location" "text",
    "skills" "text"[],
    "resume_url" "text",
    "school" "text",
    "school_start_date" "date",
    "grad_date" "date",
    "major" "text",
    "minor" "text",
    "bio" "text",
    "resume_text" "text",
    "resume_text_sha256" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "Profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."api_rate_limits"
    ADD CONSTRAINT "api_rate_limits_pkey" PRIMARY KEY ("subject", "endpoint", "window_seconds", "window_start");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."education"
    ADD CONSTRAINT "education_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."experience"
    ADD CONSTRAINT "experience_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_listings_cache"
    ADD CONSTRAINT "job_listings_cache_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_scores"
    ADD CONSTRAINT "job_scores_pkey" PRIMARY KEY ("user_id", "job_id");



CREATE INDEX "api_rate_limits_sweep_idx" ON "public"."api_rate_limits" USING "btree" ("window_start");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."education"
    ADD CONSTRAINT "education_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."experience"
    ADD CONSTRAINT "experience_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "files_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."files"
    ADD CONSTRAINT "fk_user" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_scores"
    ADD CONSTRAINT "job_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can access own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own applications" ON "public"."applications" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own applications" ON "public"."applications" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own files" ON "public"."files" TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_delete_own" ON "public"."activities" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "activities_insert_own" ON "public"."activities" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "activities_select_own" ON "public"."activities" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "activities_update_own" ON "public"."activities" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."api_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "applications" ON "public"."applications" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."education" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."experience" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."files" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "files" ON "public"."files" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."job_listings_cache" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_scores" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_scores_select_own" ON "public"."job_scores" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."consume_rate_limit"("p_subject" "text", "p_endpoint" "text", "p_window_seconds" integer, "p_max_requests" integer, "p_max_tokens" bigint, "p_tokens" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."consume_rate_limit"("p_subject" "text", "p_endpoint" "text", "p_window_seconds" integer, "p_max_requests" integer, "p_max_tokens" bigint, "p_tokens" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_profile_for_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_profile_for_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_profile_for_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."api_rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."education" TO "service_role";



GRANT ALL ON TABLE "public"."experience" TO "service_role";



GRANT ALL ON TABLE "public"."files" TO "anon";
GRANT ALL ON TABLE "public"."files" TO "authenticated";
GRANT ALL ON TABLE "public"."files" TO "service_role";



GRANT ALL ON TABLE "public"."job_listings_cache" TO "service_role";



GRANT ALL ON TABLE "public"."job_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."job_scores" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







