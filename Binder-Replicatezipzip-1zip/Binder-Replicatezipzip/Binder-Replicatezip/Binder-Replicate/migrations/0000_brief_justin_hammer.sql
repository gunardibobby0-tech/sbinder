CREATE TABLE "budget_line_items" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "category" text NOT NULL,
        "description" text NOT NULL,
        "amount" text NOT NULL,
        "status" text DEFAULT 'estimated',
        "is_auto_calculated" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budgets" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "total_budget" text NOT NULL,
        "currency" text DEFAULT 'USD',
        "contingency" text DEFAULT '10',
        "notes" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "budgets_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "cast" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "role" text NOT NULL,
        "role_type" text NOT NULL,
        "crew_master_id" integer,
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "name" text NOT NULL,
        "role" text NOT NULL,
        "category" text NOT NULL,
        "email" text,
        "phone" text
);
--> statement-breakpoint
CREATE TABLE "crew" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "name" text NOT NULL,
        "title" text NOT NULL,
        "department" text NOT NULL,
        "pricing" text,
        "contact" text,
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crew_assignments" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "event_id" integer,
        "crew_id" integer NOT NULL,
        "actual_person" text,
        "status" text DEFAULT 'pending',
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crew_master" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "title" text NOT NULL,
        "department" text,
        "email" text,
        "phone" text,
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
        "id" serial PRIMARY KEY NOT NULL,
        "document_id" integer NOT NULL,
        "version" integer NOT NULL,
        "content" text NOT NULL,
        "changes_summary" text,
        "edited_by" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "documents" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "type" text NOT NULL,
        "title" text NOT NULL,
        "content" text,
        "status" text DEFAULT 'draft',
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "name" text NOT NULL,
        "category" text NOT NULL,
        "quantity" integer DEFAULT 1,
        "rentalCost" text,
        "notes" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment_assignments" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "event_id" integer NOT NULL,
        "equipment_id" integer NOT NULL,
        "quantity" integer DEFAULT 1,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "title" text NOT NULL,
        "start_time" timestamp NOT NULL,
        "end_time" timestamp NOT NULL,
        "type" text NOT NULL,
        "description" text,
        "latitude" text,
        "longitude" text
);
--> statement-breakpoint
CREATE TABLE "location_gallery" (
        "id" serial PRIMARY KEY NOT NULL,
        "location_id" integer NOT NULL,
        "image_url" text NOT NULL,
        "caption" text,
        "uploaded_by" text,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "locations" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "name" text NOT NULL,
        "address" text,
        "description" text,
        "coordinates" text,
        "permissions" text,
        "notes" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "type" text NOT NULL,
        "status" text DEFAULT 'development',
        "owner_id" text NOT NULL,
        "created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "shot_list" (
        "id" serial PRIMARY KEY NOT NULL,
        "project_id" integer NOT NULL,
        "scene_number" text NOT NULL,
        "description" text NOT NULL,
        "shot_type" text NOT NULL,
        "duration" text,
        "location" text,
        "equipment" text,
        "notes" text,
        "priority" text DEFAULT 'medium',
        "status" text DEFAULT 'planned',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL,
        "openrouter_token" text,
        "preferred_model" text DEFAULT 'meta-llama/llama-3.3-70b-instruct',
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
        "sid" varchar PRIMARY KEY NOT NULL,
        "sess" jsonb NOT NULL,
        "expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" varchar,
        "first_name" varchar,
        "last_name" varchar,
        "profile_image_url" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
        "id" serial PRIMARY KEY NOT NULL,
        "title" text NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
        "id" serial PRIMARY KEY NOT NULL,
        "conversation_id" integer NOT NULL,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");