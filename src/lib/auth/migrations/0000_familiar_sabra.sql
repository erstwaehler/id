CREATE TYPE "public"."audit_result" AS ENUM('success', 'failure');--> statement-breakpoint
CREATE TABLE "account_deletion_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text,
	"cancellation_token" text,
	"scheduled_at" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb,
	"scopes" jsonb DEFAULT '[]'::jsonb,
	"rate_limit" integer DEFAULT 1000,
	"last_used_at" timestamp,
	"last_used_ip" text,
	"expires_at" timestamp,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"trace_id" text,
	"span_id" text,
	"result" "audit_result" DEFAULT 'success' NOT NULL,
	"error_message" text,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_export_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"download_url" text,
	"download_token" text,
	"expires_at" timestamp,
	"completed_at" timestamp,
	"downloaded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oidc_authorization_code" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"redirect_uri" text NOT NULL,
	"scope" text NOT NULL,
	"state" text,
	"nonce" text,
	"code_challenge" text,
	"code_challenge_method" text,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oidc_authorization_code_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "oidc_client" (
	"id" text PRIMARY KEY NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_hash" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"homepage_url" text,
	"terms_url" text,
	"privacy_url" text,
	"contact_email" text,
	"redirect_uris" jsonb DEFAULT '[]'::jsonb,
	"post_logout_redirect_uris" jsonb DEFAULT '[]'::jsonb,
	"allowed_scopes" jsonb DEFAULT '[]'::jsonb,
	"grant_types" jsonb DEFAULT '["authorization_code","refresh_token"]'::jsonb,
	"response_types" jsonb DEFAULT '["code"]'::jsonb,
	"token_endpoint_auth_method" text DEFAULT 'client_secret_basic',
	"access_token_ttl" integer DEFAULT 3600,
	"refresh_token_ttl" integer DEFAULT 2592000,
	"id_token_ttl" integer DEFAULT 3600,
	"require_pkce" boolean DEFAULT true NOT NULL,
	"require_consent" boolean DEFAULT true NOT NULL,
	"first_party" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "oidc_client_client_id_unique" UNIQUE("client_id")
);
--> statement-breakpoint
CREATE TABLE "oidc_consent" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"granted_scopes" jsonb DEFAULT '[]'::jsonb,
	"denied_scopes" jsonb DEFAULT '[]'::jsonb,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oidc_token" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"token_hash" text NOT NULL,
	"client_id" text NOT NULL,
	"user_id" text NOT NULL,
	"scope" text NOT NULL,
	"audience" text,
	"expires_at" timestamp NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plugin_setting" (
	"id" text PRIMARY KEY NOT NULL,
	"plugin_id" text NOT NULL,
	"user_id" text NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"domain" text,
	"oidc_provider_id" text,
	"oidc_issuer" text,
	"oidc_client_id" text,
	"oidc_client_secret" text,
	"oidc_scopes" text DEFAULT 'openid email profile',
	"logo_url" text,
	"primary_color" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"student_count" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_school" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"school_id" text NOT NULL,
	"student_id" text,
	"department" text,
	"graduation_year" integer,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"verification_method" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "betterauth"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "betterauth"."passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "betterauth"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "betterauth"."two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "betterauth"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"role" text,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"first_name" text,
	"last_name" text,
	"display_name" text,
	"bio" text,
	"school" text,
	"locale" text DEFAULT 'de',
	"last_login_method" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "betterauth"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_deletion_request" ADD CONSTRAINT "account_deletion_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_export_request" ADD CONSTRAINT "data_export_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oidc_authorization_code" ADD CONSTRAINT "oidc_authorization_code_client_id_oidc_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oidc_client"("client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oidc_authorization_code" ADD CONSTRAINT "oidc_authorization_code_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oidc_consent" ADD CONSTRAINT "oidc_consent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oidc_consent" ADD CONSTRAINT "oidc_consent_client_id_oidc_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oidc_client"("client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oidc_token" ADD CONSTRAINT "oidc_token_client_id_oidc_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oidc_client"("client_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oidc_token" ADD CONSTRAINT "oidc_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plugin_setting" ADD CONSTRAINT "plugin_setting_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_school" ADD CONSTRAINT "user_school_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_school" ADD CONSTRAINT "user_school_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "betterauth"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "betterauth"."passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "betterauth"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "betterauth"."two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "betterauth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_deletion_user_id_idx" ON "account_deletion_request" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_deletion_status_idx" ON "account_deletion_request" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "account_deletion_token_idx" ON "account_deletion_request" USING btree ("cancellation_token");--> statement-breakpoint
CREATE INDEX "account_deletion_scheduled_idx" ON "account_deletion_request" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "api_key_user_id_idx" ON "api_key" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "api_key_prefix_idx" ON "api_key" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "api_key_enabled_idx" ON "api_key" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_log" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "audit_log_trace_id_idx" ON "audit_log" USING btree ("trace_id");--> statement-breakpoint
CREATE INDEX "data_export_user_id_idx" ON "data_export_request" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "data_export_status_idx" ON "data_export_request" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "data_export_token_idx" ON "data_export_request" USING btree ("download_token");--> statement-breakpoint
CREATE UNIQUE INDEX "oidc_auth_code_code_idx" ON "oidc_authorization_code" USING btree ("code");--> statement-breakpoint
CREATE INDEX "oidc_auth_code_user_id_idx" ON "oidc_authorization_code" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oidc_auth_code_client_id_idx" ON "oidc_authorization_code" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oidc_auth_code_expires_idx" ON "oidc_authorization_code" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "oidc_client_client_id_idx" ON "oidc_client" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oidc_client_enabled_idx" ON "oidc_client" USING btree ("enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "oidc_consent_unique_idx" ON "oidc_consent" USING btree ("user_id","client_id");--> statement-breakpoint
CREATE INDEX "oidc_consent_user_id_idx" ON "oidc_consent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oidc_consent_client_id_idx" ON "oidc_consent" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oidc_token_hash_idx" ON "oidc_token" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "oidc_token_user_id_idx" ON "oidc_token" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "oidc_token_client_id_idx" ON "oidc_token" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "oidc_token_type_idx" ON "oidc_token" USING btree ("type");--> statement-breakpoint
CREATE INDEX "oidc_token_expires_idx" ON "oidc_token" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "plugin_setting_unique_idx" ON "plugin_setting" USING btree ("plugin_id","user_id");--> statement-breakpoint
CREATE INDEX "plugin_setting_user_id_idx" ON "plugin_setting" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "plugin_setting_plugin_id_idx" ON "plugin_setting" USING btree ("plugin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "school_short_name_idx" ON "school" USING btree ("short_name");--> statement-breakpoint
CREATE INDEX "school_enabled_idx" ON "school" USING btree ("enabled");--> statement-breakpoint
CREATE INDEX "two_factor_user_id_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_school_unique_idx" ON "user_school" USING btree ("user_id","school_id");--> statement-breakpoint
CREATE INDEX "user_school_user_id_idx" ON "user_school" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_school_school_id_idx" ON "user_school" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "user_school_verified_idx" ON "user_school" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "betterauth"."account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "betterauth"."passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "betterauth"."passkey" USING btree ("credential_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "betterauth"."session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "betterauth"."two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "betterauth"."two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "betterauth"."verification" USING btree ("identifier");