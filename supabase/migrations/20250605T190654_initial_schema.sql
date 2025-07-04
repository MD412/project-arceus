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



CREATE TYPE "public"."job_status_enum" AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'timeout'
);


ALTER TYPE "public"."job_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."processing_status_enum" AS ENUM (
    'queued',
    'processing',
    'review_pending',
    'failed',
    'timeout',
    'cancelled'
);


ALTER TYPE "public"."processing_status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enqueue_binder_upload"(
    p_user_id uuid,
    p_storage_path text,
    p_content_hash text,
    p_binder_title text
)
RETURNS TABLE(job_id uuid, upload_id uuid)
LANGUAGE plpgsql
AS $$
DECLARE
    v_upload_id uuid;
    v_job_id uuid;
BEGIN
    -- Insert the new upload record and get its ID
    INSERT INTO public.binder_page_uploads (user_id, storage_path, content_hash, binder_title, processing_status)
    VALUES (p_user_id, p_storage_path, p_content_hash, p_binder_title, 'queued')
    RETURNING id INTO v_upload_id;

    -- Insert a job into the queue for the new upload, including storage_path in the payload
    INSERT INTO public.job_queue (binder_page_upload_id, status, payload)
    VALUES (v_upload_id, 'pending', jsonb_build_object(
        'storage_path', p_storage_path
    ))
    RETURNING id INTO v_job_id;

    -- Return the ID of the created job and upload
    RETURN QUERY SELECT v_job_id, v_upload_id;
END;
$$;


ALTER FUNCTION "public"."enqueue_binder_upload"("p_user_id" "uuid", "p_storage_path" "text", "p_content_hash" character, "p_binder_title" text) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_pipeline_results"("_page_id" "uuid", "_items" "jsonb", "_status" "public"."processing_status_enum" DEFAULT 'review_pending'::"public"."processing_status_enum", "_error" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN;
END;
$$;


ALTER FUNCTION "public"."record_pipeline_results"("_page_id" "uuid", "_items" "jsonb", "_status" "public"."processing_status_enum", "_error" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."binder_page_uploads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "storage_path" "text" NOT NULL,
    "upload_timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content_hash" character(64) NOT NULL,
    "processing_status" "public"."processing_status_enum" DEFAULT 'queued'::"public"."processing_status_enum" NOT NULL
);


ALTER TABLE "public"."binder_page_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text"
);


ALTER TABLE "public"."cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "binder_page_upload_id" "uuid" NOT NULL,
    "status" "public"."job_status_enum" DEFAULT 'pending'::"public"."job_status_enum" NOT NULL,
    "run_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "picked_at" timestamp with time zone,
    "retry_count" smallint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."job_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pipeline_review_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "binder_page_upload_id" "uuid" NOT NULL,
    "tile_index" smallint NOT NULL,
    "user_cropped_image_storage_path" "text" NOT NULL,
    "pipeline_suggested_card_id" "uuid",
    "status" "text" DEFAULT 'pending_review'::"text" NOT NULL,
    "confirmed_card_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pipeline_review_items_tile_index_check" CHECK ((("tile_index" >= 0) AND ("tile_index" <= 8)))
);


ALTER TABLE "public"."pipeline_review_items" OWNER TO "postgres";


ALTER TABLE ONLY "public"."binder_page_uploads"
    ADD CONSTRAINT "binder_page_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_review_items"
    ADD CONSTRAINT "pipeline_review_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pipeline_review_items"
    ADD CONSTRAINT "unique_binder_tile" UNIQUE ("binder_page_upload_id", "tile_index");



CREATE UNIQUE INDEX "idx_binder_page_uploads_user_hash_unique" ON "public"."binder_page_uploads" USING "btree" ("user_id", "content_hash") WHERE ("processing_status" <> 'failed'::"public"."processing_status_enum");



CREATE INDEX "idx_binder_page_uploads_user_id" ON "public"."binder_page_uploads" USING "btree" ("user_id");



CREATE INDEX "idx_job_queue_binder_page_upload_id" ON "public"."job_queue" USING "btree" ("binder_page_upload_id");



CREATE INDEX "idx_job_queue_status_run_at" ON "public"."job_queue" USING "btree" ("status", "run_at");



CREATE INDEX "idx_pipeline_review_items_binder_id" ON "public"."pipeline_review_items" USING "btree" ("binder_page_upload_id");



CREATE INDEX "idx_pipeline_review_items_status" ON "public"."pipeline_review_items" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "on_job_queue_updated" BEFORE UPDATE ON "public"."job_queue" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_pipeline_review_items_updated" BEFORE UPDATE ON "public"."pipeline_review_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."binder_page_uploads"
    ADD CONSTRAINT "binder_page_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_queue"
    ADD CONSTRAINT "job_queue_binder_page_upload_id_fkey" FOREIGN KEY ("binder_page_upload_id") REFERENCES "public"."binder_page_uploads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_review_items"
    ADD CONSTRAINT "pipeline_review_items_binder_page_upload_id_fkey" FOREIGN KEY ("binder_page_upload_id") REFERENCES "public"."binder_page_uploads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pipeline_review_items"
    ADD CONSTRAINT "pipeline_review_items_confirmed_card_id_fkey" FOREIGN KEY ("confirmed_card_id") REFERENCES "public"."cards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."pipeline_review_items"
    ADD CONSTRAINT "pipeline_review_items_pipeline_suggested_card_id_fkey" FOREIGN KEY ("pipeline_suggested_card_id") REFERENCES "public"."cards"("id") ON DELETE SET NULL;



CREATE POLICY "Users can insert their own binder page uploads" ON "public"."binder_page_uploads" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own binder page uploads" ON "public"."binder_page_uploads" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own pipeline review items" ON "public"."pipeline_review_items" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."binder_page_uploads" "bpu"
  WHERE (("bpu"."id" = "pipeline_review_items"."binder_page_upload_id") AND ("bpu"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."binder_page_uploads" "bpu"
  WHERE (("bpu"."id" = "pipeline_review_items"."binder_page_upload_id") AND ("bpu"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own binder page uploads" ON "public"."binder_page_uploads" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own pipeline review items" ON "public"."pipeline_review_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."binder_page_uploads" "bpu"
  WHERE (("bpu"."id" = "pipeline_review_items"."binder_page_upload_id") AND ("bpu"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."binder_page_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pipeline_review_items" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TYPE "public"."job_status_enum" TO "authenticated";



GRANT ALL ON TYPE "public"."processing_status_enum" TO "authenticated";



GRANT ALL ON FUNCTION "public"."enqueue_binder_upload"("p_user_id" "uuid", "p_storage_path" "text", "p_content_hash" character, "p_binder_title" text) TO "anon";
GRANT ALL ON FUNCTION "public"."enqueue_binder_upload"("p_user_id" "uuid", "p_storage_path" "text", "p_content_hash" character, "p_binder_title" text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."enqueue_binder_upload"("p_user_id" "uuid", "p_storage_path" "text", "p_content_hash" character, "p_binder_title" text) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_pipeline_results"("_page_id" "uuid", "_items" "jsonb", "_status" "public"."processing_status_enum", "_error" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_pipeline_results"("_page_id" "uuid", "_items" "jsonb", "_status" "public"."processing_status_enum", "_error" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_pipeline_results"("_page_id" "uuid", "_items" "jsonb", "_status" "public"."processing_status_enum", "_error" "text") TO "service_role";



GRANT ALL ON TABLE "public"."binder_page_uploads" TO "anon";
GRANT ALL ON TABLE "public"."binder_page_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."binder_page_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."cards" TO "anon";
GRANT ALL ON TABLE "public"."cards" TO "authenticated";
GRANT ALL ON TABLE "public"."cards" TO "service_role";



GRANT ALL ON TABLE "public"."job_queue" TO "anon";
GRANT ALL ON TABLE "public"."job_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."job_queue" TO "service_role";



GRANT ALL ON TABLE "public"."pipeline_review_items" TO "anon";
GRANT ALL ON TABLE "public"."pipeline_review_items" TO "authenticated";
GRANT ALL ON TABLE "public"."pipeline_review_items" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
