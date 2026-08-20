-- RECOVERED PRODUCTION MIGRATION HISTORY
-- Read-only archive; do not apply directly or add to the active migration chain.
-- Production version: 20260403013312
-- Production name: remote_schema
drop extension if exists "pg_net";

-- Recovered statement 2
create sequence "public"."company_memberships_id_seq";

-- Recovered statement 3
create sequence "public"."offerte_lijnen_id_seq";

-- Recovered statement 4
create sequence "public"."reminders_id_seq";

-- Recovered statement 5
drop trigger if exists "update_memberships_updated_at" on "public"."company_memberships";

-- Recovered statement 6
drop trigger if exists "update_facturen_updated_at" on "public"."facturen";

-- Recovered statement 7
drop trigger if exists "set_factuur_lijnen_updated_at" on "public"."factuur_lijnen";

-- Recovered statement 8
drop trigger if exists "trigger_sync_legacy_status" on "public"."offertes";

-- Recovered statement 9
drop trigger if exists "update_offertes_updated_at" on "public"."offertes";

-- Recovered statement 10
drop policy "Users can manage their own chats" on "public"."ai_chats";

-- Recovered statement 11
drop policy "Users can manage messages in their chats" on "public"."ai_messages";

-- Recovered statement 12
drop policy "Owners delete memberships" on "public"."company_memberships";

-- Recovered statement 13
drop policy "Owners insert memberships" on "public"."company_memberships";

-- Recovered statement 14
drop policy "Owners update memberships" on "public"."company_memberships";

-- Recovered statement 15
drop policy "Users view own memberships or owned company memberships" on "public"."company_memberships";

-- Recovered statement 16
drop policy "Internal users manage own documents" on "public"."customer_documents";

-- Recovered statement 17
drop policy "Portal users select own documents" on "public"."customer_documents";

-- Recovered statement 18
drop policy "Internal users select company portal users" on "public"."customer_portal_users";

-- Recovered statement 19
drop policy "Portal users select own record" on "public"."customer_portal_users";

-- Recovered statement 20
drop policy "Portal users update own record" on "public"."customer_portal_users";

-- Recovered statement 21
drop policy "Internal users select own customers" on "public"."customers";

-- Recovered statement 22
drop policy "Portal users select own customer" on "public"."customers";

-- Recovered statement 23
drop policy "Allow authenticated insert on document_audit_log" on "public"."document_audit_log";

-- Recovered statement 24
drop policy "Allow authenticated select on document_audit_log" on "public"."document_audit_log";

-- Recovered statement 25
drop policy "Company members can view document sequences" on "public"."document_sequences";

-- Recovered statement 26
drop policy "Documents - interne gebruikers" on "public"."documents";

-- Recovered statement 27
drop policy "Documents - portal users" on "public"."documents";

-- Recovered statement 28
drop policy "Allow authenticated insert on facturen" on "public"."facturen";

-- Recovered statement 29
drop policy "Allow authenticated select on facturen" on "public"."facturen";

-- Recovered statement 30
drop policy "Allow authenticated update on facturen" on "public"."facturen";

-- Recovered statement 31
drop policy "Users can delete factuur lijnen if they can edit the factuur" on "public"."factuur_lijnen";

-- Recovered statement 32
drop policy "Users can insert factuur lijnen if they can edit the factuur" on "public"."factuur_lijnen";

-- Recovered statement 33
drop policy "Users can update factuur lijnen if they can edit the factuur" on "public"."factuur_lijnen";

-- Recovered statement 34
drop policy "Users can view factuur lijnen if they can view the factuur" on "public"."factuur_lijnen";

-- Recovered statement 35
drop policy "Internal users delete own inkomsten" on "public"."inkomsten";

-- Recovered statement 36
drop policy "Internal users insert own inkomsten" on "public"."inkomsten";

-- Recovered statement 37
drop policy "Internal users select own inkomsten" on "public"."inkomsten";

-- Recovered statement 38
drop policy "Internal users update own inkomsten" on "public"."inkomsten";

-- Recovered statement 39
drop policy "Portal users select own inkomsten" on "public"."inkomsten";

-- Recovered statement 40
drop policy "Internal users delete own offertes" on "public"."offertes";

-- Recovered statement 41
drop policy "Internal users insert own offertes" on "public"."offertes";

-- Recovered statement 42
drop policy "Internal users select own offertes" on "public"."offertes";

-- Recovered statement 43
drop policy "Internal users update own offertes" on "public"."offertes";

-- Recovered statement 44
drop policy "Portal users select own offertes" on "public"."offertes";

-- Recovered statement 45
drop policy "Tasks - interne gebruikers" on "public"."tasks";

-- Recovered statement 46
drop policy "Tasks - portal users" on "public"."tasks";

-- Recovered statement 47
drop policy "Allow authenticated select on abonnementen" on "public"."abonnementen";

-- Recovered statement 48
drop policy "Allow authenticated select on afspraken" on "public"."afspraken";

-- Recovered statement 49
drop policy "Allow authenticated select on artikelen" on "public"."artikelen";

-- Recovered statement 50
drop policy "Internal users select own company" on "public"."bedrijven";

-- Recovered statement 51
drop policy "Internal users update own company" on "public"."bedrijven";

-- Recovered statement 52
drop policy "Allow authenticated select on betalingen" on "public"."betalingen";

-- Recovered statement 53
drop policy "Allow authenticated insert on contacten" on "public"."contacten";

-- Recovered statement 54
drop policy "Allow authenticated select on contacten" on "public"."contacten";

-- Recovered statement 55
drop policy "Portal users insert own audit" on "public"."customer_portal_audit_log";

-- Recovered statement 56
drop policy "Allow authenticated insert on deals" on "public"."deals";

-- Recovered statement 57
drop policy "Allow authenticated select on deals" on "public"."deals";

-- Recovered statement 58
drop policy "Allow authenticated insert on projecten" on "public"."projecten";

-- Recovered statement 59
drop policy "Allow authenticated select on projecten" on "public"."projecten";

-- Recovered statement 60
drop policy "Allow authenticated select on timesheets" on "public"."timesheets";

-- Recovered statement 61
drop policy "Allow authenticated select on uitgaven" on "public"."uitgaven";

-- Recovered statement 62
revoke delete on table "public"."document_sequences" from "anon";

-- Recovered statement 63
revoke insert on table "public"."document_sequences" from "anon";

-- Recovered statement 64
revoke references on table "public"."document_sequences" from "anon";

-- Recovered statement 65
revoke select on table "public"."document_sequences" from "anon";

-- Recovered statement 66
revoke trigger on table "public"."document_sequences" from "anon";

-- Recovered statement 67
revoke truncate on table "public"."document_sequences" from "anon";

-- Recovered statement 68
revoke update on table "public"."document_sequences" from "anon";

-- Recovered statement 69
revoke delete on table "public"."document_sequences" from "authenticated";

-- Recovered statement 70
revoke insert on table "public"."document_sequences" from "authenticated";

-- Recovered statement 71
revoke references on table "public"."document_sequences" from "authenticated";

-- Recovered statement 72
revoke select on table "public"."document_sequences" from "authenticated";

-- Recovered statement 73
revoke trigger on table "public"."document_sequences" from "authenticated";

-- Recovered statement 74
revoke truncate on table "public"."document_sequences" from "authenticated";

-- Recovered statement 75
revoke update on table "public"."document_sequences" from "authenticated";

-- Recovered statement 76
revoke delete on table "public"."document_sequences" from "service_role";

-- Recovered statement 77
revoke insert on table "public"."document_sequences" from "service_role";

-- Recovered statement 78
revoke references on table "public"."document_sequences" from "service_role";

-- Recovered statement 79
revoke select on table "public"."document_sequences" from "service_role";

-- Recovered statement 80
revoke trigger on table "public"."document_sequences" from "service_role";

-- Recovered statement 81
revoke truncate on table "public"."document_sequences" from "service_role";

-- Recovered statement 82
revoke update on table "public"."document_sequences" from "service_role";

-- Recovered statement 83
revoke delete on table "public"."factuur_lijnen" from "anon";

-- Recovered statement 84
revoke insert on table "public"."factuur_lijnen" from "anon";

-- Recovered statement 85
revoke references on table "public"."factuur_lijnen" from "anon";

-- Recovered statement 86
revoke select on table "public"."factuur_lijnen" from "anon";

-- Recovered statement 87
revoke trigger on table "public"."factuur_lijnen" from "anon";

-- Recovered statement 88
revoke truncate on table "public"."factuur_lijnen" from "anon";

-- Recovered statement 89
revoke update on table "public"."factuur_lijnen" from "anon";

-- Recovered statement 90
revoke delete on table "public"."factuur_lijnen" from "authenticated";

-- Recovered statement 91
revoke insert on table "public"."factuur_lijnen" from "authenticated";

-- Recovered statement 92
revoke references on table "public"."factuur_lijnen" from "authenticated";

-- Recovered statement 93
revoke select on table "public"."factuur_lijnen" from "authenticated";

-- Recovered statement 94
revoke trigger on table "public"."factuur_lijnen" from "authenticated";

-- Recovered statement 95
revoke truncate on table "public"."factuur_lijnen" from "authenticated";

-- Recovered statement 96
revoke update on table "public"."factuur_lijnen" from "authenticated";

-- Recovered statement 97
revoke delete on table "public"."factuur_lijnen" from "service_role";

-- Recovered statement 98
revoke insert on table "public"."factuur_lijnen" from "service_role";

-- Recovered statement 99
revoke references on table "public"."factuur_lijnen" from "service_role";

-- Recovered statement 100
revoke select on table "public"."factuur_lijnen" from "service_role";

-- Recovered statement 101
revoke trigger on table "public"."factuur_lijnen" from "service_role";

-- Recovered statement 102
revoke truncate on table "public"."factuur_lijnen" from "service_role";

-- Recovered statement 103
revoke update on table "public"."factuur_lijnen" from "service_role";

-- Recovered statement 104
alter table "public"."betalingen" drop constraint "betalingen_factuur_id_fkey";

-- Recovered statement 105
alter table "public"."betalingen" drop constraint "betalingen_offerte_id_fkey";

-- Recovered statement 106
alter table "public"."company_memberships" drop constraint "company_memberships_deactivated_by_fkey";

-- Recovered statement 107
alter table "public"."company_memberships" drop constraint "memberships_user_company_unique";

-- Recovered statement 108
alter table "public"."customer_portal_invitations" drop constraint "invitations_token_length";

-- Recovered statement 109
alter table "public"."customers" drop constraint "customers_email_format";

-- Recovered statement 110
alter table "public"."document_audit_log" drop constraint "chk_audit_action";

-- Recovered statement 111
alter table "public"."document_audit_log" drop constraint "chk_audit_document_type";

-- Recovered statement 112
alter table "public"."document_audit_log" drop constraint "chk_audit_user_type";

-- Recovered statement 113
alter table "public"."document_audit_log" drop constraint "document_audit_log_user_id_fkey";

-- Recovered statement 114
alter table "public"."document_audit_log" drop constraint "uk_audit_document_entry";

-- Recovered statement 115
alter table "public"."document_sequences" drop constraint "document_sequences_company_id_document_type_year_key";

-- Recovered statement 116
alter table "public"."document_sequences" drop constraint "document_sequences_company_id_fkey";

-- Recovered statement 117
alter table "public"."document_sequences" drop constraint "document_sequences_document_type_check";

-- Recovered statement 118
alter table "public"."facturen" drop constraint "facturen_customer_id_fkey";

-- Recovered statement 119
alter table "public"."facturen" drop constraint "facturen_offerte_id_fkey";

-- Recovered statement 120
alter table "public"."facturen" drop constraint "facturen_user_id_fkey";

-- Recovered statement 121
alter table "public"."factuur_lijnen" drop constraint "factuur_lijnen_factuur_id_fkey";

-- Recovered statement 122
alter table "public"."offertes" drop constraint "chk_offerte_status_new";

-- Recovered statement 123
alter table "public"."offertes" drop constraint "offertes_customer_id_fkey";

-- Recovered statement 124
alter table "public"."offertes" drop constraint "offertes_nummer_key";

-- Recovered statement 125
alter table "public"."offertes" drop constraint "offertes_updated_by_fkey";

-- Recovered statement 126
alter table "public"."offertes" drop constraint "offertes_user_id_fkey";

-- Recovered statement 127
alter table "public"."afspraken" drop constraint "afspraken_type_check";

-- Recovered statement 128
alter table "public"."ai_chats" drop constraint "ai_chats_company_id_fkey";

-- Recovered statement 129
alter table "public"."ai_messages" drop constraint "ai_messages_role_check";

-- Recovered statement 130
alter table "public"."offertes" drop constraint "offertes_bedrijf_id_fkey";

-- Recovered statement 131
alter table "public"."offertes" drop constraint "offertes_status_check";

-- Recovered statement 132
drop function if exists "public"."generate_document_number"(p_company_id bigint, p_document_type text, p_prefix text);

-- Recovered statement 133
alter table "public"."document_sequences" drop constraint "document_sequences_pkey";

-- Recovered statement 134
alter table "public"."factuur_lijnen" drop constraint "factuur_lijnen_pkey";

-- Recovered statement 135
drop index if exists "public"."ai_chats_updated_at_idx";

-- Recovered statement 136
drop index if exists "public"."ai_chats_user_id_idx";

-- Recovered statement 137
drop index if exists "public"."ai_messages_chat_id_idx";

-- Recovered statement 138
drop index if exists "public"."document_sequences_company_id_document_type_year_key";

-- Recovered statement 139
drop index if exists "public"."document_sequences_pkey";

-- Recovered statement 140
drop index if exists "public"."factuur_lijnen_pkey";

-- Recovered statement 141
drop index if exists "public"."idx_audit_created_at";

-- Recovered statement 142
drop index if exists "public"."idx_audit_document_lookup";

-- Recovered statement 143
drop index if exists "public"."idx_audit_log_customer_id";

-- Recovered statement 144
drop index if exists "public"."idx_audit_log_portal_user_id";

-- Recovered statement 145
drop index if exists "public"."idx_company_memberships_custom_permissions";

-- Recovered statement 146
drop index if exists "public"."idx_documents_bedrijf_id";

-- Recovered statement 147
drop index if exists "public"."idx_documents_customer_id";

-- Recovered statement 148
drop index if exists "public"."idx_facturen_customer_id";

-- Recovered statement 149
drop index if exists "public"."idx_factuur_lijnen_factuur_id";

-- Recovered statement 150
drop index if exists "public"."idx_factuur_lijnen_sort_order";

-- Recovered statement 151
drop index if exists "public"."idx_inkomsten_created_at";

-- Recovered statement 152
drop index if exists "public"."idx_invitations_customer_id";

-- Recovered statement 153
drop index if exists "public"."idx_memberships_company_id";

-- Recovered statement 154
drop index if exists "public"."idx_memberships_is_active";

-- Recovered statement 155
drop index if exists "public"."idx_memberships_role";

-- Recovered statement 156
drop index if exists "public"."idx_memberships_user_id";

-- Recovered statement 157
drop index if exists "public"."idx_offertes_bedrijf_id";

-- Recovered statement 158
drop index if exists "public"."idx_offertes_geldig_tot";

-- Recovered statement 159
drop index if exists "public"."idx_offertes_status_new";

-- Recovered statement 160
drop index if exists "public"."idx_offertes_user_id";

-- Recovered statement 161
drop index if exists "public"."idx_portal_users_auth_user_id";

-- Recovered statement 162
drop index if exists "public"."idx_portal_users_company_id";

-- Recovered statement 163
drop index if exists "public"."idx_portal_users_customer_id";

-- Recovered statement 164
drop index if exists "public"."idx_tasks_bedrijf_id";

-- Recovered statement 165
drop index if exists "public"."idx_timesheets_gebruiker";

-- Recovered statement 166
drop index if exists "public"."memberships_user_company_unique";

-- Recovered statement 167
drop index if exists "public"."offertes_nummer_key";

-- Recovered statement 168
drop index if exists "public"."uk_audit_document_entry";

-- Recovered statement 169
drop index if exists "public"."idx_documents_company_id";

-- Recovered statement 170
drop index if exists "public"."idx_offertes_company_status";

-- Recovered statement 171
drop table "public"."document_sequences";

-- Recovered statement 172
drop table "public"."factuur_lijnen";

-- Recovered statement 173
create table "public"."User" (
    "id" text not null default (gen_random_uuid())::text,
    "email" text not null,
    "name" text,
    "role" text default 'user'::text,
    "active" boolean default true,
    "lastLogin" timestamp with time zone,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
      );

-- Recovered statement 174
alter table "public"."User" enable row level security;

-- Recovered statement 175
create table "public"."ai_credit_packages" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" character varying(100) not null,
    "credits" integer not null,
    "price_eur" numeric(10,2) not null,
    "stripe_price_id" text,
    "is_active" boolean not null default true,
    "sort_order" integer not null default 0,
    "created_at" timestamp with time zone not null default now()
      );

-- Recovered statement 176
alter table "public"."ai_credit_packages" enable row level security;

-- Recovered statement 177
create table "public"."company_ai_tokens" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "company_id" bigint not null,
    "provider" character varying(50) not null default 'openai'::character varying,
    "token_name" character varying(255) not null,
    "encrypted_token" text not null,
    "is_active" boolean not null default true,
    "usage_count" integer not null default 0,
    "monthly_limit" integer,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );

-- Recovered statement 178
alter table "public"."company_ai_tokens" enable row level security;

-- Recovered statement 179
create table "public"."company_legal_entities" (
    "id" uuid not null default gen_random_uuid(),
    "bedrijf_id" bigint,
    "legal_name" character varying(255) not null,
    "enterprise_number" character varying(20) not null,
    "vat_number" character varying(20) not null,
    "iban" character varying(34),
    "bic" character varying(11),
    "street" character varying(255),
    "house_number" character varying(20),
    "postal_code" character varying(20),
    "city" character varying(255),
    "country_code" character(2) default 'BE'::bpchar,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

-- Recovered statement 180
alter table "public"."company_legal_entities" enable row level security;

-- Recovered statement 181
create table "public"."invoice_events" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_id" bigint,
    "bedrijf_id" bigint,
    "event_type" character varying(50) not null,
    "payload" jsonb,
    "actor_id" uuid,
    "created_at" timestamp with time zone default now()
      );

-- Recovered statement 182
alter table "public"."invoice_events" enable row level security;

-- Recovered statement 183
create table "public"."invoice_tax_breakdown" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_id" bigint,
    "tax_category" character varying(20) not null,
    "tax_rate" numeric(5,2) not null,
    "taxable_amount" numeric(12,2) not null,
    "tax_amount" numeric(12,2) not null,
    "created_at" timestamp with time zone default now()
      );

-- Recovered statement 184
alter table "public"."invoice_tax_breakdown" enable row level security;

-- Recovered statement 185
create table "public"."offerte_activity_log" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "offerte_id" bigint not null,
    "company_id" bigint not null,
    "actor_type" character varying(20) not null,
    "actor_id" uuid,
    "action" character varying(50) not null,
    "previous_status" character varying(50),
    "new_status" character varying(50),
    "metadata" jsonb default '{}'::jsonb,
    "ip_address" inet,
    "user_agent" text,
    "created_at" timestamp with time zone default now()
      );

-- Recovered statement 186
alter table "public"."offerte_activity_log" enable row level security;

-- Recovered statement 187
create table "public"."offerte_lijnen" (
    "id" bigint not null default nextval('public.offerte_lijnen_id_seq'::regclass),
    "offerte_id" bigint not null,
    "company_id" bigint not null,
    "omschrijving" text not null,
    "aantal" numeric(10,2) not null default 1,
    "eenheid" character varying(20) default 'stuk'::character varying,
    "prijs_per_eenheid" numeric(12,2) not null default 0,
    "btw_percentage" numeric(5,2) not null default 21,
    "subtotaal" numeric(12,2) generated always as ((aantal * prijs_per_eenheid)) stored,
    "btw_bedrag" numeric(12,2) generated always as ((((aantal * prijs_per_eenheid) * btw_percentage) / (100)::numeric)) stored,
    "totaal" numeric(12,2) generated always as (((aantal * prijs_per_eenheid) * ((1)::numeric + (btw_percentage / (100)::numeric)))) stored,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

-- Recovered statement 188
alter table "public"."offerte_lijnen" enable row level security;

-- Recovered statement 189
create table "public"."platform_admins" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "role" character varying(50) not null default 'support_admin'::character varying,
    "created_at" timestamp with time zone not null default now()
      );

-- Recovered statement 190
alter table "public"."platform_admins" enable row level security;

-- Recovered statement 191
create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "avatar_url" text,
    "phone" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

-- Recovered statement 192
alter table "public"."profiles" enable row level security;

-- Recovered statement 193
create table "public"."reminders" (
    "id" bigint not null default nextval('public.reminders_id_seq'::regclass),
    "company_id" bigint not null,
    "user_id" uuid not null,
    "entity_type" character varying(50) not null,
    "entity_id" bigint not null,
    "title" text not null,
    "message" text,
    "reminder_at" timestamp with time zone not null,
    "is_sent" boolean default false,
    "sent_at" timestamp with time zone,
    "email_enabled" boolean default true,
    "in_app_enabled" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );

-- Recovered statement 194
alter table "public"."reminders" enable row level security;

-- Recovered statement 195
alter table "public"."abonnementen" add column "company_id" bigint;

-- Recovered statement 196
alter table "public"."afspraken" add column "project_id" bigint;

-- Recovered statement 197
alter table "public"."ai_chats" add column "is_pinned" boolean default false;

-- Recovered statement 198
alter table "public"."ai_chats" alter column "company_id" set not null;

-- Recovered statement 199
alter table "public"."ai_chats" alter column "created_at" drop not null;

-- Recovered statement 200
alter table "public"."ai_chats" alter column "persona" set default 'Analytisch'::text;

-- Recovered statement 201
alter table "public"."ai_chats" alter column "title" drop default;

-- Recovered statement 202
alter table "public"."ai_chats" alter column "updated_at" drop not null;

-- Recovered statement 203
alter table "public"."ai_credit_transactions" alter column "created_at" set not null;

-- Recovered statement 204
alter table "public"."ai_credit_transactions" alter column "id" set default extensions.uuid_generate_v4();

-- Recovered statement 205
alter table "public"."ai_credit_transactions" alter column "type" set data type character varying(20) using "type"::character varying(20);

-- Recovered statement 206
alter table "public"."ai_messages" add column "metadata" jsonb default '{}'::jsonb;

-- Recovered statement 207
alter table "public"."ai_messages" alter column "content" drop default;

-- Recovered statement 208
alter table "public"."ai_messages" alter column "created_at" drop not null;

-- Recovered statement 209
alter table "public"."bedrijven" add column "last_activity_at" timestamp with time zone default now();

-- Recovered statement 210
alter table "public"."bedrijven" add column "owner_user_id" uuid;

-- Recovered statement 211
alter table "public"."bedrijven" add column "plan" text default 'free'::text;

-- Recovered statement 212
alter table "public"."bedrijven" add column "slug" text;

-- Recovered statement 213
alter table "public"."bedrijven" add column "status" text not null default 'trial'::text;

-- Recovered statement 214
alter table "public"."bedrijven" add column "subscription_status" text default 'trial'::text;

-- Recovered statement 215
alter table "public"."company_ai_credits" drop column "last_usage_at";

-- Recovered statement 216
alter table "public"."company_ai_credits" drop column "total_used";

-- Recovered statement 217
alter table "public"."company_ai_credits" add column "auto_recharge" boolean not null default false;

-- Recovered statement 218
alter table "public"."company_ai_credits" add column "auto_recharge_amount" integer;

-- Recovered statement 219
alter table "public"."company_ai_credits" add column "credits_used" integer not null default 0;

-- Recovered statement 220
alter table "public"."company_ai_credits" add column "low_balance_threshold" integer default 100;

-- Recovered statement 221
alter table "public"."company_ai_credits" alter column "created_at" set not null;

-- Recovered statement 222
alter table "public"."company_ai_credits" alter column "id" set default extensions.uuid_generate_v4();

-- Recovered statement 223
alter table "public"."company_ai_credits" alter column "id" set data type uuid using "id"::uuid;

-- Recovered statement 224
alter table "public"."company_ai_credits" alter column "updated_at" set not null;

-- Recovered statement 225
alter table "public"."company_memberships" drop column "custom_permissions";

-- Recovered statement 226
alter table "public"."company_memberships" drop column "deactivated_at";

-- Recovered statement 227
alter table "public"."company_memberships" drop column "deactivated_by";

-- Recovered statement 228
alter table "public"."company_memberships" add column "joined_at" timestamp with time zone default now();

-- Recovered statement 229
alter table "public"."company_memberships" alter column "activated_at" set default now();

-- Recovered statement 230
alter table "public"."company_memberships" alter column "id" set default nextval('public.company_memberships_id_seq'::regclass);

-- Recovered statement 231
alter table "public"."company_memberships" alter column "id" set data type bigint using "id"::bigint;

-- Recovered statement 232
alter table "public"."company_memberships" alter column "invited_at" drop default;

-- Recovered statement 233
alter table "public"."company_memberships" alter column "is_active" drop not null;

-- Recovered statement 234
alter table "public"."document_audit_log" drop column "action";

-- Recovered statement 235
alter table "public"."document_audit_log" drop column "entry_number";

-- Recovered statement 236
alter table "public"."document_audit_log" drop column "ip_address";

-- Recovered statement 237
alter table "public"."document_audit_log" drop column "previous_state";

-- Recovered statement 238
alter table "public"."document_audit_log" drop column "user_agent";

-- Recovered statement 239
alter table "public"."document_audit_log" add column "actie" character varying(50);

-- Recovered statement 240
alter table "public"."document_audit_log" add column "entry_nummer" integer;

-- Recovered statement 241
alter table "public"."document_audit_log" add column "vorige_state" jsonb;

-- Recovered statement 242
alter table "public"."document_audit_log" alter column "created_at" drop not null;

-- Recovered statement 243
alter table "public"."document_audit_log" alter column "document_id" drop not null;

-- Recovered statement 244
alter table "public"."document_audit_log" alter column "document_type" drop not null;

-- Recovered statement 245
alter table "public"."document_audit_log" alter column "new_state" drop not null;

-- Recovered statement 246
alter table "public"."document_audit_log" alter column "user_id" set data type text using "user_id"::text;

-- Recovered statement 247
alter table "public"."document_audit_log" alter column "user_type" drop default;

-- Recovered statement 248
alter table "public"."document_audit_log" alter column "user_type" drop not null;

-- Recovered statement 249
alter table "public"."facturen" drop column "customer_id";

-- Recovered statement 250
alter table "public"."facturen" drop column "last_reminder_sent_at";

-- Recovered statement 251
alter table "public"."facturen" drop column "notities";

-- Recovered statement 252
alter table "public"."facturen" drop column "omschrijving";

-- Recovered statement 253
alter table "public"."facturen" drop column "paid_at";

-- Recovered statement 254
alter table "public"."facturen" drop column "reminder_count";

-- Recovered statement 255
alter table "public"."facturen" drop column "sent_at";

-- Recovered statement 256
alter table "public"."facturen" drop column "user_id";

-- Recovered statement 257
alter table "public"."facturen" drop column "versie_nummer";

-- Recovered statement 258
alter table "public"."facturen" add column "betaald_op" timestamp with time zone;

-- Recovered statement 259
alter table "public"."facturen" add column "created_by" uuid;

-- Recovered statement 260
alter table "public"."facturen" add column "notes" text;

-- Recovered statement 261
alter table "public"."facturen" add column "updated_by" uuid;

-- Recovered statement 262
alter table "public"."facturen" alter column "created_at" drop not null;

-- Recovered statement 263
alter table "public"."facturen" alter column "updated_at" drop not null;

-- Recovered statement 264
alter table "public"."inkomsten" add column "compliance_status" character varying(50) default 'pending'::character varying;

-- Recovered statement 265
alter table "public"."inkomsten" add column "currency" character(3) default 'EUR'::bpchar;

-- Recovered statement 266
alter table "public"."inkomsten" add column "due_date" date;

-- Recovered statement 267
alter table "public"."inkomsten" add column "external_provider_id" character varying(255);

-- Recovered statement 268
alter table "public"."inkomsten" add column "external_provider_status" character varying(100);

-- Recovered statement 269
alter table "public"."inkomsten" add column "failure_reason" text;

-- Recovered statement 270
alter table "public"."inkomsten" add column "internal_status" character varying(50) default 'draft'::character varying;

-- Recovered statement 271
alter table "public"."inkomsten" add column "invoice_type" character varying(20) default 'commercial_invoice'::character varying;

-- Recovered statement 272
alter table "public"."inkomsten" add column "language" character(2) default 'nl'::bpchar;

-- Recovered statement 273
alter table "public"."inkomsten" add column "nummer" character varying(50);

-- Recovered statement 274
alter table "public"."inkomsten" add column "sent_at" timestamp with time zone;

-- Recovered statement 275
alter table "public"."offertes" alter column "bedrag" drop not null;

-- Recovered statement 276
alter table "public"."offertes" alter column "datum" drop not null;

-- Recovered statement 277
alter table "public"."offertes" alter column "geldig_tot" drop not null;

-- Recovered statement 278
alter table "public"."offertes" alter column "klant" drop not null;

-- Recovered statement 279
alter table "public"."offertes" alter column "klant" set data type text using "klant"::text;

-- Recovered statement 280
alter table "public"."offertes" alter column "nummer" drop not null;

-- Recovered statement 281
alter table "public"."offertes" alter column "status" set default 'Openstaand'::character varying;

-- Recovered statement 282
alter table "public"."offertes" alter column "status" drop not null;

-- Recovered statement 283
alter table "public"."offertes" alter column "status_new" drop default;

-- Recovered statement 284
alter table "public"."projecten" add column "customer_id" bigint;

-- Recovered statement 285
alter sequence "public"."company_memberships_id_seq" owned by "public"."company_memberships"."id";

-- Recovered statement 286
alter sequence "public"."offerte_lijnen_id_seq" owned by "public"."offerte_lijnen"."id";

-- Recovered statement 287
alter sequence "public"."reminders_id_seq" owned by "public"."reminders"."id";

-- Recovered statement 288
drop sequence if exists "public"."company_ai_credits_id_seq";

-- Recovered statement 289
drop sequence if exists "public"."factuur_lijnen_id_seq";

-- Recovered statement 290
CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);

-- Recovered statement 291
CREATE UNIQUE INDEX "User_pkey" ON public."User" USING btree (id);

-- Recovered statement 292
CREATE UNIQUE INDEX ai_credit_packages_pkey ON public.ai_credit_packages USING btree (id);

-- Recovered statement 293
CREATE UNIQUE INDEX company_ai_tokens_pkey ON public.company_ai_tokens USING btree (id);

-- Recovered statement 294
CREATE UNIQUE INDEX company_legal_entities_bedrijf_id_key ON public.company_legal_entities USING btree (bedrijf_id);

-- Recovered statement 295
CREATE UNIQUE INDEX company_legal_entities_pkey ON public.company_legal_entities USING btree (id);

-- Recovered statement 296
CREATE UNIQUE INDEX company_memberships_user_id_company_id_key ON public.company_memberships USING btree (user_id, company_id);

-- Recovered statement 297
CREATE INDEX documents_company_id_idx ON public.documents USING btree (company_id);

-- Recovered statement 298
CREATE INDEX idx_abonnementen_company_id ON public.abonnementen USING btree (company_id);

-- Recovered statement 299
CREATE INDEX idx_abonnementen_user_id ON public.abonnementen USING btree (user_id);

-- Recovered statement 300
CREATE INDEX idx_afspraken_assigned_to ON public.afspraken USING btree (assigned_to);

-- Recovered statement 301
CREATE INDEX idx_afspraken_company_start ON public.afspraken USING btree (bedrijf_id, start_tijd);

-- Recovered statement 302
CREATE INDEX idx_afspraken_contact_id ON public.afspraken USING btree (contact_id);

-- Recovered statement 303
CREATE INDEX idx_afspraken_project_id ON public.afspraken USING btree (project_id);

-- Recovered statement 304
CREATE INDEX idx_afspraken_user_id ON public.afspraken USING btree (user_id);

-- Recovered statement 305
CREATE INDEX idx_ai_chats_company_id ON public.ai_chats USING btree (company_id);

-- Recovered statement 306
CREATE INDEX idx_ai_chats_user ON public.ai_chats USING btree (user_id);

-- Recovered statement 307
CREATE INDEX idx_ai_credit_transactions_company_id ON public.ai_credit_transactions USING btree (company_id, created_at DESC);

-- Recovered statement 308
CREATE INDEX idx_ai_messages_chat ON public.ai_messages USING btree (chat_id);

-- Recovered statement 309
CREATE INDEX idx_artikelen_user_id ON public.artikelen USING btree (user_id);

-- Recovered statement 310
CREATE INDEX idx_bedrijven_user_id ON public.bedrijven USING btree (user_id);

-- Recovered statement 311
CREATE INDEX idx_betalingen_bedrijf_id ON public.betalingen USING btree (bedrijf_id);

-- Recovered statement 312
CREATE INDEX idx_betalingen_offerte_id ON public.betalingen USING btree (offerte_id);

-- Recovered statement 313
CREATE INDEX idx_betalingen_user_id ON public.betalingen USING btree (user_id);

-- Recovered statement 314
CREATE INDEX idx_company_ai_credits_company_id ON public.company_ai_credits USING btree (company_id);

-- Recovered statement 315
CREATE INDEX idx_company_ai_tokens_company_id ON public.company_ai_tokens USING btree (company_id);

-- Recovered statement 316
CREATE INDEX idx_company_ai_tokens_is_active ON public.company_ai_tokens USING btree (is_active);

-- Recovered statement 317
CREATE INDEX idx_company_ai_tokens_provider ON public.company_ai_tokens USING btree (provider);

-- Recovered statement 318
CREATE INDEX idx_company_memberships_company_id ON public.company_memberships USING btree (company_id);

-- Recovered statement 319
CREATE INDEX idx_company_memberships_invited_by ON public.company_memberships USING btree (invited_by);

-- Recovered statement 320
CREATE INDEX idx_company_memberships_role ON public.company_memberships USING btree (company_id, role);

-- Recovered statement 321
CREATE INDEX idx_company_memberships_user_id ON public.company_memberships USING btree (user_id);

-- Recovered statement 322
CREATE INDEX idx_contacten_bedrijf_id ON public.contacten USING btree (bedrijf_id);

-- Recovered statement 323
CREATE INDEX idx_contacten_company ON public.contacten USING btree (bedrijf_id);

-- Recovered statement 324
CREATE INDEX idx_contacten_user_id ON public.contacten USING btree (user_id);

-- Recovered statement 325
CREATE INDEX idx_customer_documents_company_id ON public.customer_documents USING btree (company_id);

-- Recovered statement 326
CREATE INDEX idx_customer_documents_customer_id ON public.customer_documents USING btree (customer_id);

-- Recovered statement 327
CREATE INDEX idx_customer_portal_audit_log_company_id ON public.customer_portal_audit_log USING btree (company_id);

-- Recovered statement 328
CREATE INDEX idx_customer_portal_audit_log_customer_id ON public.customer_portal_audit_log USING btree (customer_id);

-- Recovered statement 329
CREATE INDEX idx_customer_portal_audit_log_portal_user_id ON public.customer_portal_audit_log USING btree (portal_user_id);

-- Recovered statement 330
CREATE INDEX idx_customer_portal_invitations_company_id ON public.customer_portal_invitations USING btree (company_id);

-- Recovered statement 331
CREATE INDEX idx_customer_portal_invitations_customer_id ON public.customer_portal_invitations USING btree (customer_id);

-- Recovered statement 332
CREATE INDEX idx_customer_portal_invitations_invited_by ON public.customer_portal_invitations USING btree (invited_by);

-- Recovered statement 333
CREATE INDEX idx_customer_portal_users_auth_user_id ON public.customer_portal_users USING btree (auth_user_id);

-- Recovered statement 334
CREATE INDEX idx_customer_portal_users_company_id ON public.customer_portal_users USING btree (company_id);

-- Recovered statement 335
CREATE INDEX idx_customer_portal_users_customer_id ON public.customer_portal_users USING btree (customer_id);

-- Recovered statement 336
CREATE INDEX idx_customers_created_by ON public.customers USING btree (created_by);

-- Recovered statement 337
CREATE INDEX idx_deals_contact_id ON public.deals USING btree (contact_id);

-- Recovered statement 338
CREATE INDEX idx_deals_user_id ON public.deals USING btree (user_id);

-- Recovered statement 339
CREATE INDEX idx_documents_company_id_fk ON public.documents USING btree (company_id);

-- Recovered statement 340
CREATE INDEX idx_facturen_company_status ON public.facturen USING btree (bedrijf_id, status);

-- Recovered statement 341
CREATE INDEX idx_facturen_created_by ON public.facturen USING btree (created_by);

-- Recovered statement 342
CREATE INDEX idx_facturen_updated_by ON public.facturen USING btree (updated_by);

-- Recovered statement 343
CREATE INDEX idx_inkomsten_company_datum ON public.inkomsten USING btree (bedrijf_id, datum DESC);

-- Recovered statement 344
CREATE INDEX idx_inkomsten_contact_id ON public.inkomsten USING btree (contact_id);

-- Recovered statement 345
CREATE INDEX idx_inkomsten_nummer ON public.inkomsten USING btree (nummer);

-- Recovered statement 346
CREATE INDEX idx_invoice_events_bedrijf ON public.invoice_events USING btree (bedrijf_id);

-- Recovered statement 347
CREATE INDEX idx_invoice_events_invoice ON public.invoice_events USING btree (invoice_id);

-- Recovered statement 348
CREATE INDEX idx_legal_entities_bedrijf ON public.company_legal_entities USING btree (bedrijf_id);

-- Recovered statement 349
CREATE INDEX idx_offerte_activity_company_id ON public.offerte_activity_log USING btree (company_id);

-- Recovered statement 350
CREATE INDEX idx_offerte_activity_created_at ON public.offerte_activity_log USING btree (created_at DESC);

-- Recovered statement 351
CREATE INDEX idx_offerte_activity_offerte_id ON public.offerte_activity_log USING btree (offerte_id);

-- Recovered statement 352
CREATE INDEX idx_offerte_lijnen_company_id ON public.offerte_lijnen USING btree (company_id);

-- Recovered statement 353
CREATE INDEX idx_offerte_lijnen_offerte_id ON public.offerte_lijnen USING btree (offerte_id);

-- Recovered statement 354
CREATE INDEX idx_offertes_company_id ON public.offertes USING btree (bedrijf_id);

-- Recovered statement 355
CREATE INDEX idx_offertes_datum ON public.offertes USING btree (datum);

-- Recovered statement 356
CREATE INDEX idx_platform_admins_role ON public.platform_admins USING btree (role);

-- Recovered statement 357
CREATE INDEX idx_platform_admins_user_id ON public.platform_admins USING btree (user_id);

-- Recovered statement 358
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

-- Recovered statement 359
CREATE INDEX idx_projecten_user_id ON public.projecten USING btree (user_id);

-- Recovered statement 360
CREATE INDEX idx_reminders_company_id ON public.reminders USING btree (company_id);

-- Recovered statement 361
CREATE INDEX idx_reminders_entity ON public.reminders USING btree (entity_type, entity_id);

-- Recovered statement 362
CREATE INDEX idx_reminders_pending ON public.reminders USING btree (user_id, reminder_at) WHERE (is_sent = false);

-- Recovered statement 363
CREATE INDEX idx_reminders_reminder_at ON public.reminders USING btree (reminder_at) WHERE (is_sent = false);

-- Recovered statement 364
CREATE INDEX idx_reminders_user_id ON public.reminders USING btree (user_id);

-- Recovered statement 365
CREATE INDEX idx_reminders_user_sent ON public.reminders USING btree (user_id, is_sent);

-- Recovered statement 366
CREATE INDEX idx_tasks_assigned_due ON public.tasks USING btree (assigned_to, due_date);

-- Recovered statement 367
CREATE INDEX idx_tasks_company_status ON public.tasks USING btree (company_id, status);

-- Recovered statement 368
CREATE INDEX idx_tasks_created_by ON public.tasks USING btree (created_by);

-- Recovered statement 369
CREATE INDEX idx_tasks_customer_id ON public.tasks USING btree (customer_id);

-- Recovered statement 370
CREATE INDEX idx_tax_breakdown_invoice ON public.invoice_tax_breakdown USING btree (invoice_id);

-- Recovered statement 371
CREATE INDEX idx_timesheets_contact_id ON public.timesheets USING btree (contact_id);

-- Recovered statement 372
CREATE INDEX idx_timesheets_gebruiker_id ON public.timesheets USING btree (gebruiker_id);

-- Recovered statement 373
CREATE INDEX idx_timesheets_project_id ON public.timesheets USING btree (project_id);

-- Recovered statement 374
CREATE INDEX idx_timesheets_user_id ON public.timesheets USING btree (user_id);

-- Recovered statement 375
CREATE INDEX idx_uitgaven_bedrijf_id ON public.uitgaven USING btree (bedrijf_id);

-- Recovered statement 376
CREATE INDEX idx_uitgaven_user_id ON public.uitgaven USING btree (user_id);

-- Recovered statement 377
CREATE UNIQUE INDEX invoice_events_pkey ON public.invoice_events USING btree (id);

-- Recovered statement 378
CREATE UNIQUE INDEX invoice_tax_breakdown_pkey ON public.invoice_tax_breakdown USING btree (id);

-- Recovered statement 379
CREATE UNIQUE INDEX offerte_activity_log_pkey ON public.offerte_activity_log USING btree (id);

-- Recovered statement 380
CREATE UNIQUE INDEX offerte_lijnen_pkey ON public.offerte_lijnen USING btree (id);

-- Recovered statement 381
CREATE UNIQUE INDEX platform_admins_pkey ON public.platform_admins USING btree (id);

-- Recovered statement 382
CREATE UNIQUE INDEX platform_admins_user_id_key ON public.platform_admins USING btree (user_id);

-- Recovered statement 383
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

-- Recovered statement 384
CREATE UNIQUE INDEX reminders_pkey ON public.reminders USING btree (id);

-- Recovered statement 385
CREATE INDEX idx_documents_company_id ON public.documents USING btree (company_id);

-- Recovered statement 386
CREATE INDEX idx_offertes_company_status ON public.offertes USING btree (bedrijf_id, status);

-- Recovered statement 387
alter table "public"."User" add constraint "User_pkey" PRIMARY KEY using index "User_pkey";

-- Recovered statement 388
alter table "public"."ai_credit_packages" add constraint "ai_credit_packages_pkey" PRIMARY KEY using index "ai_credit_packages_pkey";

-- Recovered statement 389
alter table "public"."company_ai_tokens" add constraint "company_ai_tokens_pkey" PRIMARY KEY using index "company_ai_tokens_pkey";

-- Recovered statement 390
alter table "public"."company_legal_entities" add constraint "company_legal_entities_pkey" PRIMARY KEY using index "company_legal_entities_pkey";

-- Recovered statement 391
alter table "public"."invoice_events" add constraint "invoice_events_pkey" PRIMARY KEY using index "invoice_events_pkey";

-- Recovered statement 392
alter table "public"."invoice_tax_breakdown" add constraint "invoice_tax_breakdown_pkey" PRIMARY KEY using index "invoice_tax_breakdown_pkey";

-- Recovered statement 393
alter table "public"."offerte_activity_log" add constraint "offerte_activity_log_pkey" PRIMARY KEY using index "offerte_activity_log_pkey";

-- Recovered statement 394
alter table "public"."offerte_lijnen" add constraint "offerte_lijnen_pkey" PRIMARY KEY using index "offerte_lijnen_pkey";

-- Recovered statement 395
alter table "public"."platform_admins" add constraint "platform_admins_pkey" PRIMARY KEY using index "platform_admins_pkey";

-- Recovered statement 396
alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

-- Recovered statement 397
alter table "public"."reminders" add constraint "reminders_pkey" PRIMARY KEY using index "reminders_pkey";

-- Recovered statement 398
alter table "public"."User" add constraint "User_email_key" UNIQUE using index "User_email_key";

-- Recovered statement 399
alter table "public"."abonnementen" add constraint "abonnementen_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.bedrijven(id) ON DELETE CASCADE not valid;

-- Recovered statement 400
alter table "public"."abonnementen" validate constraint "abonnementen_company_id_fkey";

-- Recovered statement 401
alter table "public"."afspraken" add constraint "afspraken_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projecten(id) ON DELETE SET NULL not valid;

-- Recovered statement 402
alter table "public"."afspraken" validate constraint "afspraken_project_id_fkey";

-- Recovered statement 403
alter table "public"."bedrijven" add constraint "bedrijven_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

-- Recovered statement 404
alter table "public"."bedrijven" validate constraint "bedrijven_owner_user_id_fkey";

-- Recovered statement 405
alter table "public"."bedrijven" add constraint "bedrijven_plan_check" CHECK ((plan = ANY (ARRAY['free'::text, 'starter'::text, 'professional'::text, 'enterprise'::text]))) not valid;

-- Recovered statement 406
alter table "public"."bedrijven" validate constraint "bedrijven_plan_check";

-- Recovered statement 407
alter table "public"."bedrijven" add constraint "bedrijven_status_check" CHECK ((status = ANY (ARRAY['trial'::text, 'active'::text, 'past_due'::text, 'suspended'::text, 'cancelled'::text]))) not valid;

-- Recovered statement 408
alter table "public"."bedrijven" validate constraint "bedrijven_status_check";

-- Recovered statement 409
alter table "public"."bedrijven" add constraint "bedrijven_subscription_status_check" CHECK ((subscription_status = ANY (ARRAY['active'::text, 'trial'::text, 'past_due'::text, 'canceled'::text, 'unpaid'::text]))) not valid;

-- Recovered statement 410
alter table "public"."bedrijven" validate constraint "bedrijven_subscription_status_check";

-- Recovered statement 411
alter table "public"."company_ai_tokens" add constraint "company_ai_tokens_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.bedrijven(id) ON DELETE CASCADE not valid;

-- Recovered statement 412
alter table "public"."company_ai_tokens" validate constraint "company_ai_tokens_company_id_fkey";

-- Recovered statement 413
alter table "public"."company_ai_tokens" add constraint "company_ai_tokens_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT not valid;

-- Recovered statement 414
alter table "public"."company_ai_tokens" validate constraint "company_ai_tokens_created_by_fkey";

-- Recovered statement 415
alter table "public"."company_ai_tokens" add constraint "company_ai_tokens_provider_check" CHECK (((provider)::text = ANY ((ARRAY['openai'::character varying, 'anthropic'::character varying, 'gemini'::character varying])::text[]))) not valid;

-- Recovered statement 416
alter table "public"."company_ai_tokens" validate constraint "company_ai_tokens_provider_check";

-- Recovered statement 417
alter table "public"."company_legal_entities" add constraint "company_legal_entities_bedrijf_id_fkey" FOREIGN KEY (bedrijf_id) REFERENCES public.bedrijven(id) ON DELETE CASCADE not valid;

-- Recovered statement 418
alter table "public"."company_legal_entities" validate constraint "company_legal_entities_bedrijf_id_fkey";

-- Recovered statement 419
alter table "public"."company_legal_entities" add constraint "company_legal_entities_bedrijf_id_key" UNIQUE using index "company_legal_entities_bedrijf_id_key";

-- Recovered statement 420
alter table "public"."company_memberships" add constraint "company_memberships_user_id_company_id_key" UNIQUE using index "company_memberships_user_id_company_id_key";

-- Recovered statement 421
alter table "public"."facturen" add constraint "facturen_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

-- Recovered statement 422
alter table "public"."facturen" validate constraint "facturen_created_by_fkey";

-- Recovered statement 423
alter table "public"."facturen" add constraint "facturen_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES auth.users(id) not valid;

-- Recovered statement 424
alter table "public"."facturen" validate constraint "facturen_updated_by_fkey";

-- Recovered statement 425
alter table "public"."invoice_events" add constraint "invoice_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES auth.users(id) not valid;

-- Recovered statement 426
alter table "public"."invoice_events" validate constraint "invoice_events_actor_id_fkey";

-- Recovered statement 427
alter table "public"."invoice_events" add constraint "invoice_events_bedrijf_id_fkey" FOREIGN KEY (bedrijf_id) REFERENCES public.bedrijven(id) ON DELETE CASCADE not valid;

-- Recovered statement 428
alter table "public"."invoice_events" validate constraint "invoice_events_bedrijf_id_fkey";

-- Recovered statement 429
alter table "public"."invoice_events" add constraint "invoice_events_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.inkomsten(id) ON DELETE CASCADE not valid;

-- Recovered statement 430
alter table "public"."invoice_events" validate constraint "invoice_events_invoice_id_fkey";

-- Recovered statement 431
alter table "public"."invoice_tax_breakdown" add constraint "invoice_tax_breakdown_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.inkomsten(id) ON DELETE CASCADE not valid;

-- Recovered statement 432
alter table "public"."invoice_tax_breakdown" validate constraint "invoice_tax_breakdown_invoice_id_fkey";

-- Recovered statement 433
alter table "public"."offerte_activity_log" add constraint "offerte_activity_log_actor_type_check" CHECK (((actor_type)::text = ANY ((ARRAY['staff'::character varying, 'customer'::character varying, 'system'::character varying])::text[]))) not valid;

-- Recovered statement 434
alter table "public"."offerte_activity_log" validate constraint "offerte_activity_log_actor_type_check";

-- Recovered statement 435
alter table "public"."offerte_activity_log" add constraint "offerte_activity_log_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.bedrijven(id) not valid;

-- Recovered statement 436
alter table "public"."offerte_activity_log" validate constraint "offerte_activity_log_company_id_fkey";

-- Recovered statement 437
alter table "public"."offerte_lijnen" add constraint "offerte_lijnen_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.bedrijven(id) ON DELETE CASCADE not valid;

-- Recovered statement 438
alter table "public"."offerte_lijnen" validate constraint "offerte_lijnen_company_id_fkey";

-- Recovered statement 439
alter table "public"."platform_admins" add constraint "platform_admins_role_check" CHECK (((role)::text = ANY ((ARRAY['super_admin'::character varying, 'support_admin'::character varying])::text[]))) not valid;

-- Recovered statement 440
alter table "public"."platform_admins" validate constraint "platform_admins_role_check";

-- Recovered statement 441
alter table "public"."platform_admins" add constraint "platform_admins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

-- Recovered statement 442
alter table "public"."platform_admins" validate constraint "platform_admins_user_id_fkey";

-- Recovered statement 443
alter table "public"."platform_admins" add constraint "platform_admins_user_id_key" UNIQUE using index "platform_admins_user_id_key";

-- Recovered statement 444
alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

-- Recovered statement 445
alter table "public"."profiles" validate constraint "profiles_id_fkey";

-- Recovered statement 446
alter table "public"."reminders" add constraint "reminders_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.bedrijven(id) ON DELETE CASCADE not valid;

-- Recovered statement 447
alter table "public"."reminders" validate constraint "reminders_company_id_fkey";

-- Recovered statement 448
alter table "public"."reminders" add constraint "reminders_entity_type_check" CHECK (((entity_type)::text = ANY ((ARRAY['afspraak'::character varying, 'task'::character varying])::text[]))) not valid;

-- Recovered statement 449
alter table "public"."reminders" validate constraint "reminders_entity_type_check";

-- Recovered statement 450
alter table "public"."reminders" add constraint "reminders_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

-- Recovered statement 451
alter table "public"."reminders" validate constraint "reminders_user_id_fkey";

-- Recovered statement 452
alter table "public"."afspraken" add constraint "afspraken_type_check" CHECK (((type)::text = ANY ((ARRAY['meeting'::character varying, 'call'::character varying, 'site_visit'::character varying, 'internal'::character varying, 'other'::character varying])::text[]))) not valid;

-- Recovered statement 453
alter table "public"."afspraken" validate constraint "afspraken_type_check";

-- Recovered statement 454
alter table "public"."ai_chats" add constraint "ai_chats_company_id_fkey" FOREIGN KEY (company_id) REFERENCES public.bedrijven(id) ON DELETE CASCADE not valid;

-- Recovered statement 455
alter table "public"."ai_chats" validate constraint "ai_chats_company_id_fkey";

-- Recovered statement 456
alter table "public"."ai_messages" add constraint "ai_messages_role_check" CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text]))) not valid;

-- Recovered statement 457
alter table "public"."ai_messages" validate constraint "ai_messages_role_check";

-- Recovered statement 458
alter table "public"."offertes" add constraint "offertes_bedrijf_id_fkey" FOREIGN KEY (bedrijf_id) REFERENCES public.bedrijven(id) not valid;

-- Recovered statement 459
alter table "public"."offertes" validate constraint "offertes_bedrijf_id_fkey";

-- Recovered statement 460
alter table "public"."offertes" add constraint "offertes_status_check" CHECK (true) not valid;

-- Recovered statement 461
alter table "public"."offertes" validate constraint "offertes_status_check";

-- Recovered statement 462
set check_function_bodies = off;

-- Recovered statement 463
CREATE OR REPLACE FUNCTION public.auth_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
    RETURN (SELECT auth.uid());
END;
$function$;

-- Recovered statement 464
CREATE OR REPLACE FUNCTION public.calculate_days_overdue(p_vervaldatum date)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN GREATEST(0, CURRENT_DATE - p_vervaldatum);
END;
$function$;

-- Recovered statement 465
CREATE OR REPLACE FUNCTION public.calculate_factuur_total_paid(p_factuur_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(bedrag) FROM betalingen WHERE factuur_id = p_factuur_id),
        0
    );
END;
$function$;

-- Recovered statement 466
CREATE OR REPLACE FUNCTION public.check_quota(p_company_id bigint, quota_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
  current_plan TEXT;
BEGIN
  -- Haal huidig plan op
  SELECT plan INTO current_plan FROM bedrijven WHERE id = p_company_id;
  
  -- Haal limiet op
  max_allowed := (get_plan_limits(current_plan)->>quota_key)::INTEGER;
  
  -- Tel huidige records
  CASE quota_key
    WHEN 'max_users'     THEN SELECT COUNT(*) INTO current_count FROM company_memberships WHERE company_id = p_company_id AND is_active = true;
    WHEN 'max_customers' THEN SELECT COUNT(*) INTO current_count FROM customers WHERE company_id = p_company_id;
    WHEN 'max_deals'     THEN SELECT COUNT(*) INTO current_count FROM deals WHERE company_id = p_company_id;
    ELSE RETURN FALSE;
  END CASE;
  
  RETURN current_count < max_allowed;
END;
$function$;

-- Recovered statement 467
CREATE OR REPLACE FUNCTION public.generate_storage_signed_url(p_bucket text, p_path text, p_expiry_seconds integer DEFAULT 3600)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_company_id UUID;
    v_user_role TEXT;
BEGIN
    -- Get context
    v_company_id := current_setting('app.current_company_id', true)::UUID;
    v_user_role := current_setting('app.current_user_role', true);
    
    -- Log access
    INSERT INTO public.audit_log (
        company_id,
        action,
        entity_type,
        metadata,
        user_id,
        user_role
    ) VALUES (
        v_company_id,
        'view',
        'storage_document',
        jsonb_build_object('bucket', p_bucket, 'path', p_path),
        auth.uid(),
        v_user_role
    );
    
    -- Return URL configuration (actual URL generated by Edge Function)
    RETURN jsonb_build_object(
        'bucket', p_bucket,
        'path', p_path,
        'expires_in', p_expiry_seconds,
        'generated_at', now()
    );
END;
$function$;

-- Recovered statement 468
CREATE OR REPLACE FUNCTION public.get_invoice_storage_path(p_invoice_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_company_id UUID;
    v_number TEXT;
BEGIN
    SELECT company_id, number INTO v_company_id, v_number
    FROM public.invoices
    WHERE id = p_invoice_id;
    
    RETURN 'invoices/' || v_company_id || '/' || p_invoice_id || '/' || v_number || '.pdf';
END;
$function$;

-- Recovered statement 469
CREATE OR REPLACE FUNCTION public.get_next_audit_entry_number(p_document_type character varying, p_document_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_next_number INTEGER;
BEGIN
    SELECT COALESCE(MAX(entry_number), 0) + 1
    INTO v_next_number
    FROM document_audit_log
    WHERE document_type = p_document_type
    AND document_id = p_document_id;
    
    RETURN v_next_number;
END;
$function$;

-- Recovered statement 470
CREATE OR REPLACE FUNCTION public.get_next_audit_entry_number(table_name character varying, record_id bigint)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(entry_number), 0) + 1
  INTO next_num
  FROM audit_log
  WHERE table_name = $1 AND record_id = $2;
  RETURN next_num;
EXCEPTION WHEN OTHERS THEN
  RETURN 1;
END;
$function$;

-- Recovered statement 471
CREATE OR REPLACE FUNCTION public.get_plan_limits(plan_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN CASE plan_name
    WHEN 'free'         THEN '{"max_users": 1, "max_customers": 10, "max_deals": 5, "max_documents": 50}'::JSONB
    WHEN 'starter'      THEN '{"max_users": 3, "max_customers": 100, "max_deals": 50, "max_documents": 500}'::JSONB
    WHEN 'professional' THEN '{"max_users": 10, "max_customers": 1000, "max_deals": 500, "max_documents": 5000}'::JSONB
    WHEN 'enterprise'   THEN '{"max_users": 9999, "max_customers": 99999, "max_deals": 99999, "max_documents": 99999}'::JSONB
    ELSE '{"max_users": 1, "max_customers": 5, "max_deals": 2, "max_documents": 10}'::JSONB
  END;
END;
$function$;

-- Recovered statement 472
CREATE OR REPLACE FUNCTION public.get_project_file_storage_path(p_project_id uuid, p_filename text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_company_id UUID;
BEGIN
    SELECT company_id INTO v_company_id
    FROM public.projects
    WHERE id = p_project_id;
    
    RETURN 'project-files/' || v_company_id || '/' || p_project_id || '/' || p_filename;
END;
$function$;

-- Recovered statement 473
CREATE OR REPLACE FUNCTION public.get_quotation_storage_path(p_quotation_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_company_id UUID;
    v_number TEXT;
BEGIN
    SELECT company_id, number INTO v_company_id, v_number
    FROM public.quotations
    WHERE id = p_quotation_id;
    
    RETURN 'quotations/' || v_company_id || '/' || p_quotation_id || '/' || v_number || '.pdf';
END;
$function$;

-- Recovered statement 474
CREATE OR REPLACE FUNCTION public.handle_new_bedrijf()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.company_einvoicing_settings (bedrijf_id, is_enabled, provider_id, environment)
  VALUES (NEW.id, FALSE, 'PEPPOL_ACCESS_POINT', 'sandbox');
  RETURN NEW;
END;
$function$;

-- Recovered statement 475
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, avatar_url)
      VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
      )
      ON CONFLICT (id) DO UPDATE
      SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();
      RETURN NEW;
    END;
    $function$;

-- Recovered statement 476
CREATE OR REPLACE FUNCTION public.is_platform_admin(p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.platform_admins
    WHERE user_id = p_user_id
  );
END;
$function$;

-- Recovered statement 477
CREATE OR REPLACE FUNCTION public.log_document_download(p_document_id uuid, p_download_method text DEFAULT 'portal'::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_company_id UUID;
    v_customer_id UUID;
BEGIN
    -- Get document info
    SELECT company_id, entity_id INTO v_company_id, v_customer_id
    FROM public.documents
    WHERE id = p_document_id;
    
    -- Update download count
    UPDATE public.documents
    SET 
        download_count = download_count + 1,
        last_downloaded_at = now()
    WHERE id = p_document_id;
    
    -- Log in audit
    INSERT INTO public.audit_log (
        company_id,
        action,
        entity_type,
        entity_id,
        user_id,
        metadata
    ) VALUES (
        v_company_id,
        'download',
        'document',
        p_document_id,
        auth.uid(),
        jsonb_build_object(
            'method', p_download_method,
            'customer_id', v_customer_id
        )
    );
END;
$function$;

-- Recovered statement 478
create or replace view "public"."pending_reminders" as  SELECT id,
    company_id,
    user_id,
    entity_type,
    entity_id,
    title,
    message,
    reminder_at,
    is_sent,
    sent_at,
    email_enabled,
    in_app_enabled,
    created_at,
    updated_at
   FROM public.reminders r
  WHERE ((is_sent = false) AND (reminder_at <= now()));

-- Recovered statement 479
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

-- Recovered statement 480
CREATE OR REPLACE FUNCTION public.sync_offerte_totals_from_lijnen()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Update the parent offerte with calculated totals
    UPDATE offertes
    SET 
        bedrag = COALESCE((
            SELECT SUM(subtotaal) 
            FROM offerte_lijnen 
            WHERE offerte_id = COALESCE(NEW.offerte_id, OLD.offerte_id)
        ), 0),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.offerte_id, OLD.offerte_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recovered statement 481
CREATE OR REPLACE FUNCTION public.trigger_audit_document_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_entry_number INTEGER;
    v_action VARCHAR(50);
    v_previous_state JSONB;
    v_new_state JSONB;
    v_user_id UUID;
    v_user_type VARCHAR(50);
BEGIN
    -- Get current user from session variables or auth.uid()
    v_user_id := COALESCE(
        current_setting('app.current_user_id', true)::UUID,
        auth.uid()
    );
    
    v_user_type := COALESCE(
        current_setting('app.current_user_type', true),
        CASE WHEN auth.uid() IS NOT NULL THEN 'staff' ELSE 'system' END
    );
    
    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        v_previous_state := NULL;
        v_new_state := to_jsonb(NEW);
        
        -- Get next entry number
        v_entry_number := get_next_audit_entry_number(
            TG_TABLE_NAME::VARCHAR(50),
            NEW.id
        );
        
        -- Insert audit log entry
        INSERT INTO document_audit_log (
            document_type, document_id, entry_number, action,
            previous_state, new_state, user_id, user_type,
            metadata
        ) VALUES (
            TG_TABLE_NAME::VARCHAR(50),
            NEW.id,
            v_entry_number,
            v_action,
            v_previous_state,
            v_new_state,
            v_user_id,
            v_user_type,
            jsonb_build_object('trigger_operation', TG_OP)
        );
        
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if status changed
        IF TG_TABLE_NAME = 'offertes' AND OLD.status_new IS DISTINCT FROM NEW.status_new THEN
            v_action := 'state_changed';
            v_previous_state := jsonb_build_object('status', OLD.status_new);
            v_new_state := jsonb_build_object('status', NEW.status_new);
            
            -- Get next entry number
            v_entry_number := get_next_audit_entry_number(
                TG_TABLE_NAME::VARCHAR(50),
                NEW.id
            );
            
            -- Insert audit log entry
            INSERT INTO document_audit_log (
                document_type, document_id, entry_number, action,
                previous_state, new_state, user_id, user_type,
                metadata
            ) VALUES (
                TG_TABLE_NAME::VARCHAR(50),
                NEW.id,
                v_entry_number,
                v_action,
                v_previous_state,
                v_new_state,
                v_user_id,
                v_user_type,
                jsonb_build_object(
                    'trigger_operation', TG_OP,
                    'old_status', OLD.status_new,
                    'new_status', NEW.status_new
                )
            );
            
        ELSIF TG_TABLE_NAME = 'facturen' AND OLD.status IS DISTINCT FROM NEW.status THEN
            v_action := 'state_changed';
            v_previous_state := jsonb_build_object('status', OLD.status);
            v_new_state := jsonb_build_object('status', NEW.status);
            
            -- Get next entry number
            v_entry_number := get_next_audit_entry_number(
                TG_TABLE_NAME::VARCHAR(50),
                NEW.id
            );
            
            -- Insert audit log entry
            INSERT INTO document_audit_log (
                document_type, document_id, entry_number, action,
                previous_state, new_state, user_id, user_type,
                metadata
            ) VALUES (
                TG_TABLE_NAME::VARCHAR(50),
                NEW.id,
                v_entry_number,
                v_action,
                v_previous_state,
                v_new_state,
                v_user_id,
                v_user_type,
                jsonb_build_object(
                    'trigger_operation', TG_OP,
                    'old_status', OLD.status,
                    'new_status', NEW.status
                )
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$function$;

-- Recovered statement 482
CREATE OR REPLACE FUNCTION public.trigger_update_factuur_payment_state()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_factuur_id UUID;
    v_current_status VARCHAR(50);
    v_totaal_bedrag DECIMAL(12, 2);
    v_total_paid DECIMAL(12, 2);
    v_new_status VARCHAR(50);
BEGIN
    -- Determine which factuur to update
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        v_factuur_id := NEW.factuur_id;
    ELSIF TG_OP = 'DELETE' THEN
        v_factuur_id := OLD.factuur_id;
    END IF;
    
    -- Get current factuur data
    SELECT status, totaal_bedrag
    INTO v_current_status, v_totaal_bedrag
    FROM facturen
    WHERE id = v_factuur_id;
    
    -- Skip if factuur is already paid or cancelled
    IF v_current_status IN ('betaald', 'geannuleerd') THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Calculate total paid
    v_total_paid := calculate_factuur_total_paid(v_factuur_id);
    
    -- Determine new status
    IF v_total_paid >= v_totaal_bedrag THEN
        v_new_status := 'betaald';
    ELSIF v_total_paid > 0 THEN
        v_new_status := 'deels_betaald';
    ELSE
        -- No payments, don't change status
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Update factuur status
    UPDATE facturen
    SET 
        status = v_new_status,
        betaald_op = CASE 
            WHEN v_new_status = 'betaald' THEN NOW()
            ELSE betaald_op
        END,
        updated_at = NOW()
    WHERE id = v_factuur_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recovered statement 483
CREATE OR REPLACE FUNCTION public.trigger_validate_factuur_state()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Only validate if status is changing
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Validate the transition
        IF NOT validate_factuur_state_transition(OLD.status, NEW.status) THEN
            RAISE EXCEPTION 'Invalid factuur state transition from % to %', OLD.status, NEW.status
                USING ERRCODE = 'invalid_transaction_state';
        END IF;
        
        -- Update timestamp fields based on new state
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Recovered statement 484
CREATE OR REPLACE FUNCTION public.trigger_validate_offerte_state()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Only validate if status_new is changing
    IF OLD.status_new IS DISTINCT FROM NEW.status_new THEN
        -- Validate the transition
        IF NOT validate_offerte_state_transition(OLD.status_new, NEW.status_new) THEN
            RAISE EXCEPTION 'Invalid offerte state transition from % to %', OLD.status_new, NEW.status_new
                USING ERRCODE = 'invalid_transaction_state';
        END IF;
        
        -- Update timestamp fields based on new state
        NEW.updated_at = NOW();
        
        CASE NEW.status_new
            WHEN 'verzonden' THEN
                NEW.sent_at = COALESCE(NEW.sent_at, NOW());
            WHEN 'bekeken' THEN
                NEW.viewed_at = COALESCE(NEW.viewed_at, NOW());
            WHEN 'geaccepteerd' THEN
                NEW.accepted_at = COALESCE(NEW.accepted_at, NOW());
            WHEN 'afgewezen' THEN
                NEW.rejected_at = COALESCE(NEW.rejected_at, NOW());
            WHEN 'verlopen' THEN
                NEW.expired_at = COALESCE(NEW.expired_at, NOW());
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Recovered statement 485
CREATE OR REPLACE FUNCTION public.update_company_memberships_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Recovered statement 486
CREATE OR REPLACE FUNCTION public.update_facturen_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Recovered statement 487
CREATE OR REPLACE FUNCTION public.update_offerte_lijnen_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Recovered statement 488
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Recovered statement 489
CREATE OR REPLACE FUNCTION public.update_reminders_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Recovered statement 490
CREATE OR REPLACE FUNCTION public.validate_factuur_state_transition(p_current_status character varying, p_new_status character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_terminal_states VARCHAR(50)[] := ARRAY['betaald', 'geannuleerd'];
BEGIN
    -- Check if current status is terminal (immutable)
    IF p_current_status = ANY(v_terminal_states) THEN
        RETURN FALSE;
    END IF;
    
    -- Validate allowed transitions
    RETURN CASE p_current_status
        WHEN 'concept' THEN
            p_new_status IN ('verzonden', 'geannuleerd')
        WHEN 'verzonden' THEN
            p_new_status IN ('openstaand', 'geannuleerd')
        WHEN 'openstaand' THEN
            p_new_status IN ('deels_betaald', 'betaald', 'herinnering_verzonden')
        WHEN 'deels_betaald' THEN
            p_new_status IN ('betaald', 'herinnering_verzonden')
        WHEN 'herinnering_verzonden' THEN
            p_new_status IN ('deels_betaald', 'betaald', 'achterstallig')
        WHEN 'achterstallig' THEN
            p_new_status IN ('deels_betaald', 'betaald')
        ELSE
            FALSE
    END CASE;
END;
$function$;

-- Recovered statement 491
CREATE OR REPLACE FUNCTION public.validate_offerte_state_transition(p_current_status character varying, p_new_status character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_terminal_states VARCHAR(50)[] := ARRAY['geaccepteerd', 'afgewezen', 'verlopen'];
BEGIN
    -- Check if current status is terminal (immutable)
    IF p_current_status = ANY(v_terminal_states) THEN
        RETURN FALSE;
    END IF;
    
    -- Validate allowed transitions
    RETURN CASE p_current_status
        WHEN 'concept' THEN
            p_new_status IN ('verzonden')
        WHEN 'verzonden' THEN
            p_new_status IN ('bekeken', 'geaccepteerd', 'afgewezen', 'verlopen')
        WHEN 'bekeken' THEN
            p_new_status IN ('geaccepteerd', 'afgewezen', 'verlopen')
        ELSE
            FALSE
    END CASE;
END;
$function$;

-- Recovered statement 492
CREATE OR REPLACE FUNCTION public.sync_legacy_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.status = CASE NEW.status_new
        WHEN 'concept' THEN 'concept'
        WHEN 'verzonden' THEN 'verstuurd'
        WHEN 'bekeken' THEN 'verstuurd'
        WHEN 'geaccepteerd' THEN 'geaccepteerd'
        WHEN 'afgewezen' THEN 'geweigerd'
        WHEN 'verlopen' THEN 'geweigerd'
        ELSE NEW.status
    END;
    RETURN NEW;
END;
$function$;

-- Recovered statement 493
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Recovered statement 494
grant delete on table "public"."User" to "anon";

-- Recovered statement 495
grant insert on table "public"."User" to "anon";

-- Recovered statement 496
grant references on table "public"."User" to "anon";

-- Recovered statement 497
grant select on table "public"."User" to "anon";

-- Recovered statement 498
grant trigger on table "public"."User" to "anon";

-- Recovered statement 499
grant truncate on table "public"."User" to "anon";

-- Recovered statement 500
grant update on table "public"."User" to "anon";

-- Recovered statement 501
grant delete on table "public"."User" to "authenticated";

-- Recovered statement 502
grant insert on table "public"."User" to "authenticated";

-- Recovered statement 503
grant references on table "public"."User" to "authenticated";

-- Recovered statement 504
grant select on table "public"."User" to "authenticated";

-- Recovered statement 505
grant trigger on table "public"."User" to "authenticated";

-- Recovered statement 506
grant truncate on table "public"."User" to "authenticated";

-- Recovered statement 507
grant update on table "public"."User" to "authenticated";

-- Recovered statement 508
grant delete on table "public"."User" to "service_role";

-- Recovered statement 509
grant insert on table "public"."User" to "service_role";

-- Recovered statement 510
grant references on table "public"."User" to "service_role";

-- Recovered statement 511
grant select on table "public"."User" to "service_role";

-- Recovered statement 512
grant trigger on table "public"."User" to "service_role";

-- Recovered statement 513
grant truncate on table "public"."User" to "service_role";

-- Recovered statement 514
grant update on table "public"."User" to "service_role";

-- Recovered statement 515
grant delete on table "public"."ai_credit_packages" to "anon";

-- Recovered statement 516
grant insert on table "public"."ai_credit_packages" to "anon";

-- Recovered statement 517
grant references on table "public"."ai_credit_packages" to "anon";

-- Recovered statement 518
grant select on table "public"."ai_credit_packages" to "anon";

-- Recovered statement 519
grant trigger on table "public"."ai_credit_packages" to "anon";

-- Recovered statement 520
grant truncate on table "public"."ai_credit_packages" to "anon";

-- Recovered statement 521
grant update on table "public"."ai_credit_packages" to "anon";

-- Recovered statement 522
grant delete on table "public"."ai_credit_packages" to "authenticated";

-- Recovered statement 523
grant insert on table "public"."ai_credit_packages" to "authenticated";

-- Recovered statement 524
grant references on table "public"."ai_credit_packages" to "authenticated";

-- Recovered statement 525
grant select on table "public"."ai_credit_packages" to "authenticated";

-- Recovered statement 526
grant trigger on table "public"."ai_credit_packages" to "authenticated";

-- Recovered statement 527
grant truncate on table "public"."ai_credit_packages" to "authenticated";

-- Recovered statement 528
grant update on table "public"."ai_credit_packages" to "authenticated";

-- Recovered statement 529
grant delete on table "public"."ai_credit_packages" to "service_role";

-- Recovered statement 530
grant insert on table "public"."ai_credit_packages" to "service_role";

-- Recovered statement 531
grant references on table "public"."ai_credit_packages" to "service_role";

-- Recovered statement 532
grant select on table "public"."ai_credit_packages" to "service_role";

-- Recovered statement 533
grant trigger on table "public"."ai_credit_packages" to "service_role";

-- Recovered statement 534
grant truncate on table "public"."ai_credit_packages" to "service_role";

-- Recovered statement 535
grant update on table "public"."ai_credit_packages" to "service_role";

-- Recovered statement 536
grant delete on table "public"."company_ai_tokens" to "anon";

-- Recovered statement 537
grant insert on table "public"."company_ai_tokens" to "anon";

-- Recovered statement 538
grant references on table "public"."company_ai_tokens" to "anon";

-- Recovered statement 539
grant select on table "public"."company_ai_tokens" to "anon";

-- Recovered statement 540
grant trigger on table "public"."company_ai_tokens" to "anon";

-- Recovered statement 541
grant truncate on table "public"."company_ai_tokens" to "anon";

-- Recovered statement 542
grant update on table "public"."company_ai_tokens" to "anon";

-- Recovered statement 543
grant delete on table "public"."company_ai_tokens" to "authenticated";

-- Recovered statement 544
grant insert on table "public"."company_ai_tokens" to "authenticated";

-- Recovered statement 545
grant references on table "public"."company_ai_tokens" to "authenticated";

-- Recovered statement 546
grant select on table "public"."company_ai_tokens" to "authenticated";

-- Recovered statement 547
grant trigger on table "public"."company_ai_tokens" to "authenticated";

-- Recovered statement 548
grant truncate on table "public"."company_ai_tokens" to "authenticated";

-- Recovered statement 549
grant update on table "public"."company_ai_tokens" to "authenticated";

-- Recovered statement 550
grant delete on table "public"."company_ai_tokens" to "service_role";

-- Recovered statement 551
grant insert on table "public"."company_ai_tokens" to "service_role";

-- Recovered statement 552
grant references on table "public"."company_ai_tokens" to "service_role";

-- Recovered statement 553
grant select on table "public"."company_ai_tokens" to "service_role";

-- Recovered statement 554
grant trigger on table "public"."company_ai_tokens" to "service_role";

-- Recovered statement 555
grant truncate on table "public"."company_ai_tokens" to "service_role";

-- Recovered statement 556
grant update on table "public"."company_ai_tokens" to "service_role";

-- Recovered statement 557
grant delete on table "public"."company_legal_entities" to "anon";

-- Recovered statement 558
grant insert on table "public"."company_legal_entities" to "anon";

-- Recovered statement 559
grant references on table "public"."company_legal_entities" to "anon";

-- Recovered statement 560
grant select on table "public"."company_legal_entities" to "anon";

-- Recovered statement 561
grant trigger on table "public"."company_legal_entities" to "anon";

-- Recovered statement 562
grant truncate on table "public"."company_legal_entities" to "anon";

-- Recovered statement 563
grant update on table "public"."company_legal_entities" to "anon";

-- Recovered statement 564
grant delete on table "public"."company_legal_entities" to "authenticated";

-- Recovered statement 565
grant insert on table "public"."company_legal_entities" to "authenticated";

-- Recovered statement 566
grant references on table "public"."company_legal_entities" to "authenticated";

-- Recovered statement 567
grant select on table "public"."company_legal_entities" to "authenticated";

-- Recovered statement 568
grant trigger on table "public"."company_legal_entities" to "authenticated";

-- Recovered statement 569
grant truncate on table "public"."company_legal_entities" to "authenticated";

-- Recovered statement 570
grant update on table "public"."company_legal_entities" to "authenticated";

-- Recovered statement 571
grant delete on table "public"."company_legal_entities" to "service_role";

-- Recovered statement 572
grant insert on table "public"."company_legal_entities" to "service_role";

-- Recovered statement 573
grant references on table "public"."company_legal_entities" to "service_role";

-- Recovered statement 574
grant select on table "public"."company_legal_entities" to "service_role";

-- Recovered statement 575
grant trigger on table "public"."company_legal_entities" to "service_role";

-- Recovered statement 576
grant truncate on table "public"."company_legal_entities" to "service_role";

-- Recovered statement 577
grant update on table "public"."company_legal_entities" to "service_role";

-- Recovered statement 578
grant delete on table "public"."invoice_events" to "anon";

-- Recovered statement 579
grant insert on table "public"."invoice_events" to "anon";

-- Recovered statement 580
grant references on table "public"."invoice_events" to "anon";

-- Recovered statement 581
grant select on table "public"."invoice_events" to "anon";

-- Recovered statement 582
grant trigger on table "public"."invoice_events" to "anon";

-- Recovered statement 583
grant truncate on table "public"."invoice_events" to "anon";

-- Recovered statement 584
grant update on table "public"."invoice_events" to "anon";

-- Recovered statement 585
grant delete on table "public"."invoice_events" to "authenticated";

-- Recovered statement 586
grant insert on table "public"."invoice_events" to "authenticated";

-- Recovered statement 587
grant references on table "public"."invoice_events" to "authenticated";

-- Recovered statement 588
grant select on table "public"."invoice_events" to "authenticated";

-- Recovered statement 589
grant trigger on table "public"."invoice_events" to "authenticated";

-- Recovered statement 590
grant truncate on table "public"."invoice_events" to "authenticated";

-- Recovered statement 591
grant update on table "public"."invoice_events" to "authenticated";

-- Recovered statement 592
grant delete on table "public"."invoice_events" to "service_role";

-- Recovered statement 593
grant insert on table "public"."invoice_events" to "service_role";

-- Recovered statement 594
grant references on table "public"."invoice_events" to "service_role";

-- Recovered statement 595
grant select on table "public"."invoice_events" to "service_role";

-- Recovered statement 596
grant trigger on table "public"."invoice_events" to "service_role";

-- Recovered statement 597
grant truncate on table "public"."invoice_events" to "service_role";

-- Recovered statement 598
grant update on table "public"."invoice_events" to "service_role";

-- Recovered statement 599
grant delete on table "public"."invoice_tax_breakdown" to "anon";

-- Recovered statement 600
grant insert on table "public"."invoice_tax_breakdown" to "anon";

-- Recovered statement 601
grant references on table "public"."invoice_tax_breakdown" to "anon";

-- Recovered statement 602
grant select on table "public"."invoice_tax_breakdown" to "anon";

-- Recovered statement 603
grant trigger on table "public"."invoice_tax_breakdown" to "anon";

-- Recovered statement 604
grant truncate on table "public"."invoice_tax_breakdown" to "anon";

-- Recovered statement 605
grant update on table "public"."invoice_tax_breakdown" to "anon";

-- Recovered statement 606
grant delete on table "public"."invoice_tax_breakdown" to "authenticated";

-- Recovered statement 607
grant insert on table "public"."invoice_tax_breakdown" to "authenticated";

-- Recovered statement 608
grant references on table "public"."invoice_tax_breakdown" to "authenticated";

-- Recovered statement 609
grant select on table "public"."invoice_tax_breakdown" to "authenticated";

-- Recovered statement 610
grant trigger on table "public"."invoice_tax_breakdown" to "authenticated";

-- Recovered statement 611
grant truncate on table "public"."invoice_tax_breakdown" to "authenticated";

-- Recovered statement 612
grant update on table "public"."invoice_tax_breakdown" to "authenticated";

-- Recovered statement 613
grant delete on table "public"."invoice_tax_breakdown" to "service_role";

-- Recovered statement 614
grant insert on table "public"."invoice_tax_breakdown" to "service_role";

-- Recovered statement 615
grant references on table "public"."invoice_tax_breakdown" to "service_role";

-- Recovered statement 616
grant select on table "public"."invoice_tax_breakdown" to "service_role";

-- Recovered statement 617
grant trigger on table "public"."invoice_tax_breakdown" to "service_role";

-- Recovered statement 618
grant truncate on table "public"."invoice_tax_breakdown" to "service_role";

-- Recovered statement 619
grant update on table "public"."invoice_tax_breakdown" to "service_role";

-- Recovered statement 620
grant delete on table "public"."offerte_activity_log" to "anon";

-- Recovered statement 621
grant insert on table "public"."offerte_activity_log" to "anon";

-- Recovered statement 622
grant references on table "public"."offerte_activity_log" to "anon";

-- Recovered statement 623
grant select on table "public"."offerte_activity_log" to "anon";

-- Recovered statement 624
grant trigger on table "public"."offerte_activity_log" to "anon";

-- Recovered statement 625
grant truncate on table "public"."offerte_activity_log" to "anon";

-- Recovered statement 626
grant update on table "public"."offerte_activity_log" to "anon";

-- Recovered statement 627
grant delete on table "public"."offerte_activity_log" to "authenticated";

-- Recovered statement 628
grant insert on table "public"."offerte_activity_log" to "authenticated";

-- Recovered statement 629
grant references on table "public"."offerte_activity_log" to "authenticated";

-- Recovered statement 630
grant select on table "public"."offerte_activity_log" to "authenticated";

-- Recovered statement 631
grant trigger on table "public"."offerte_activity_log" to "authenticated";

-- Recovered statement 632
grant truncate on table "public"."offerte_activity_log" to "authenticated";

-- Recovered statement 633
grant update on table "public"."offerte_activity_log" to "authenticated";

-- Recovered statement 634
grant delete on table "public"."offerte_activity_log" to "service_role";

-- Recovered statement 635
grant insert on table "public"."offerte_activity_log" to "service_role";

-- Recovered statement 636
grant references on table "public"."offerte_activity_log" to "service_role";

-- Recovered statement 637
grant select on table "public"."offerte_activity_log" to "service_role";

-- Recovered statement 638
grant trigger on table "public"."offerte_activity_log" to "service_role";

-- Recovered statement 639
grant truncate on table "public"."offerte_activity_log" to "service_role";

-- Recovered statement 640
grant update on table "public"."offerte_activity_log" to "service_role";

-- Recovered statement 641
grant delete on table "public"."offerte_lijnen" to "anon";

-- Recovered statement 642
grant insert on table "public"."offerte_lijnen" to "anon";

-- Recovered statement 643
grant references on table "public"."offerte_lijnen" to "anon";

-- Recovered statement 644
grant select on table "public"."offerte_lijnen" to "anon";

-- Recovered statement 645
grant trigger on table "public"."offerte_lijnen" to "anon";

-- Recovered statement 646
grant truncate on table "public"."offerte_lijnen" to "anon";

-- Recovered statement 647
grant update on table "public"."offerte_lijnen" to "anon";

-- Recovered statement 648
grant delete on table "public"."offerte_lijnen" to "authenticated";

-- Recovered statement 649
grant insert on table "public"."offerte_lijnen" to "authenticated";

-- Recovered statement 650
grant references on table "public"."offerte_lijnen" to "authenticated";

-- Recovered statement 651
grant select on table "public"."offerte_lijnen" to "authenticated";

-- Recovered statement 652
grant trigger on table "public"."offerte_lijnen" to "authenticated";

-- Recovered statement 653
grant truncate on table "public"."offerte_lijnen" to "authenticated";

-- Recovered statement 654
grant update on table "public"."offerte_lijnen" to "authenticated";

-- Recovered statement 655
grant delete on table "public"."offerte_lijnen" to "service_role";

-- Recovered statement 656
grant insert on table "public"."offerte_lijnen" to "service_role";

-- Recovered statement 657
grant references on table "public"."offerte_lijnen" to "service_role";

-- Recovered statement 658
grant select on table "public"."offerte_lijnen" to "service_role";

-- Recovered statement 659
grant trigger on table "public"."offerte_lijnen" to "service_role";

-- Recovered statement 660
grant truncate on table "public"."offerte_lijnen" to "service_role";

-- Recovered statement 661
grant update on table "public"."offerte_lijnen" to "service_role";

-- Recovered statement 662
grant delete on table "public"."platform_admins" to "anon";

-- Recovered statement 663
grant insert on table "public"."platform_admins" to "anon";

-- Recovered statement 664
grant references on table "public"."platform_admins" to "anon";

-- Recovered statement 665
grant select on table "public"."platform_admins" to "anon";

-- Recovered statement 666
grant trigger on table "public"."platform_admins" to "anon";

-- Recovered statement 667
grant truncate on table "public"."platform_admins" to "anon";

-- Recovered statement 668
grant update on table "public"."platform_admins" to "anon";

-- Recovered statement 669
grant delete on table "public"."platform_admins" to "authenticated";

-- Recovered statement 670
grant insert on table "public"."platform_admins" to "authenticated";

-- Recovered statement 671
grant references on table "public"."platform_admins" to "authenticated";

-- Recovered statement 672
grant select on table "public"."platform_admins" to "authenticated";

-- Recovered statement 673
grant trigger on table "public"."platform_admins" to "authenticated";

-- Recovered statement 674
grant truncate on table "public"."platform_admins" to "authenticated";

-- Recovered statement 675
grant update on table "public"."platform_admins" to "authenticated";

-- Recovered statement 676
grant delete on table "public"."platform_admins" to "service_role";

-- Recovered statement 677
grant insert on table "public"."platform_admins" to "service_role";

-- Recovered statement 678
grant references on table "public"."platform_admins" to "service_role";

-- Recovered statement 679
grant select on table "public"."platform_admins" to "service_role";

-- Recovered statement 680
grant trigger on table "public"."platform_admins" to "service_role";

-- Recovered statement 681
grant truncate on table "public"."platform_admins" to "service_role";

-- Recovered statement 682
grant update on table "public"."platform_admins" to "service_role";

-- Recovered statement 683
grant delete on table "public"."profiles" to "anon";

-- Recovered statement 684
grant insert on table "public"."profiles" to "anon";

-- Recovered statement 685
grant references on table "public"."profiles" to "anon";

-- Recovered statement 686
grant select on table "public"."profiles" to "anon";

-- Recovered statement 687
grant trigger on table "public"."profiles" to "anon";

-- Recovered statement 688
grant truncate on table "public"."profiles" to "anon";

-- Recovered statement 689
grant update on table "public"."profiles" to "anon";

-- Recovered statement 690
grant delete on table "public"."profiles" to "authenticated";

-- Recovered statement 691
grant insert on table "public"."profiles" to "authenticated";

-- Recovered statement 692
grant references on table "public"."profiles" to "authenticated";

-- Recovered statement 693
grant select on table "public"."profiles" to "authenticated";

-- Recovered statement 694
grant trigger on table "public"."profiles" to "authenticated";

-- Recovered statement 695
grant truncate on table "public"."profiles" to "authenticated";

-- Recovered statement 696
grant update on table "public"."profiles" to "authenticated";

-- Recovered statement 697
grant delete on table "public"."profiles" to "service_role";

-- Recovered statement 698
grant insert on table "public"."profiles" to "service_role";

-- Recovered statement 699
grant references on table "public"."profiles" to "service_role";

-- Recovered statement 700
grant select on table "public"."profiles" to "service_role";

-- Recovered statement 701
grant trigger on table "public"."profiles" to "service_role";

-- Recovered statement 702
grant truncate on table "public"."profiles" to "service_role";

-- Recovered statement 703
grant update on table "public"."profiles" to "service_role";

-- Recovered statement 704
grant delete on table "public"."reminders" to "anon";

-- Recovered statement 705
grant insert on table "public"."reminders" to "anon";

-- Recovered statement 706
grant references on table "public"."reminders" to "anon";

-- Recovered statement 707
grant select on table "public"."reminders" to "anon";

-- Recovered statement 708
grant trigger on table "public"."reminders" to "anon";

-- Recovered statement 709
grant truncate on table "public"."reminders" to "anon";

-- Recovered statement 710
grant update on table "public"."reminders" to "anon";

-- Recovered statement 711
grant delete on table "public"."reminders" to "authenticated";

-- Recovered statement 712
grant insert on table "public"."reminders" to "authenticated";

-- Recovered statement 713
grant references on table "public"."reminders" to "authenticated";

-- Recovered statement 714
grant select on table "public"."reminders" to "authenticated";

-- Recovered statement 715
grant trigger on table "public"."reminders" to "authenticated";

-- Recovered statement 716
grant truncate on table "public"."reminders" to "authenticated";

-- Recovered statement 717
grant update on table "public"."reminders" to "authenticated";

-- Recovered statement 718
grant delete on table "public"."reminders" to "service_role";

-- Recovered statement 719
grant insert on table "public"."reminders" to "service_role";

-- Recovered statement 720
grant references on table "public"."reminders" to "service_role";

-- Recovered statement 721
grant select on table "public"."reminders" to "service_role";

-- Recovered statement 722
grant trigger on table "public"."reminders" to "service_role";

-- Recovered statement 723
grant truncate on table "public"."reminders" to "service_role";

-- Recovered statement 724
grant update on table "public"."reminders" to "service_role";

-- Recovered statement 725
create policy "Service role can manage all users"
  on "public"."User"
  as permissive
  for all
  to service_role
using (true)
with check (true);

-- Recovered statement 726
create policy "Users can only update own profile"
  on "public"."User"
  as permissive
  for update
  to authenticated
using (((public.auth_user_id())::text = id));

-- Recovered statement 727
create policy "Users can only view own profile"
  on "public"."User"
  as permissive
  for select
  to authenticated
using (((public.auth_user_id())::text = id));

-- Recovered statement 728
create policy "Gebruikers kunnen eigen chats aanmaken"
  on "public"."ai_chats"
  as permissive
  for insert
  to authenticated
with check ((public.auth_user_id() = user_id));

-- Recovered statement 729
create policy "Gebruikers kunnen eigen chats updaten"
  on "public"."ai_chats"
  as permissive
  for update
  to authenticated
using ((public.auth_user_id() = user_id));

-- Recovered statement 730
create policy "Gebruikers kunnen eigen chats verwijderen"
  on "public"."ai_chats"
  as permissive
  for delete
  to authenticated
using ((public.auth_user_id() = user_id));

-- Recovered statement 731
create policy "Gebruikers kunnen hun eigen chats zien"
  on "public"."ai_chats"
  as permissive
  for select
  to authenticated
using ((public.auth_user_id() = user_id));

-- Recovered statement 732
create policy "Berichten kunnen worden toegevoegd aan eigen chats"
  on "public"."ai_messages"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.ai_chats
  WHERE ((ai_chats.id = ai_messages.chat_id) AND (ai_chats.user_id = public.auth_user_id())))));

-- Recovered statement 733
create policy "Berichten zijn zichtbaar via de chat eigenaar"
  on "public"."ai_messages"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.ai_chats
  WHERE ((ai_chats.id = ai_messages.chat_id) AND (ai_chats.user_id = public.auth_user_id())))));

-- Recovered statement 734
create policy "Allow authenticated access to company_legal_entities"
  on "public"."company_legal_entities"
  as permissive
  for all
  to authenticated
using (true);

-- Recovered statement 735
create policy "Company owners can delete memberships"
  on "public"."company_memberships"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = company_memberships.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 736
create policy "Company owners can insert memberships"
  on "public"."company_memberships"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = company_memberships.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 737
create policy "Company owners can update memberships"
  on "public"."company_memberships"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = company_memberships.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 738
create policy "Users can view own memberships"
  on "public"."company_memberships"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));

-- Recovered statement 739
create policy "Internal users can delete customer documents"
  on "public"."customer_documents"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = customer_documents.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 740
create policy "Internal users can insert customer documents"
  on "public"."customer_documents"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = customer_documents.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 741
create policy "Internal users can update customer documents"
  on "public"."customer_documents"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = customer_documents.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 742
create policy "Users can view customer documents"
  on "public"."customer_documents"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = customer_documents.company_id) AND (cm.user_id = ( SELECT auth.uid() AS uid)) AND (cm.is_active = true)))) OR ((is_visible_in_portal = true) AND (customer_id IN ( SELECT customer_portal_users.customer_id
   FROM public.customer_portal_users
  WHERE ((customer_portal_users.auth_user_id = ( SELECT auth.uid() AS uid)) AND (customer_portal_users.is_active = true)))))));

-- Recovered statement 743
create policy "Service role manage audit log"
  on "public"."customer_portal_audit_log"
  as permissive
  for all
  to service_role
using (true)
with check (true);

-- Recovered statement 744
create policy "Service role manage invitations"
  on "public"."customer_portal_invitations"
  as permissive
  for all
  to service_role
using (true)
with check (true);

-- Recovered statement 745
create policy "Internal users can delete portal users"
  on "public"."customer_portal_users"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = customer_portal_users.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 746
create policy "Internal users can insert portal users"
  on "public"."customer_portal_users"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = customer_portal_users.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = ANY ((ARRAY['admin'::character varying, 'finance'::character varying])::text[]))))));

-- Recovered statement 747
create policy "Internal users can update portal users"
  on "public"."customer_portal_users"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = customer_portal_users.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = ANY ((ARRAY['admin'::character varying, 'finance'::character varying])::text[]))))));

-- Recovered statement 748
create policy "Service role manage portal users"
  on "public"."customer_portal_users"
  as permissive
  for all
  to service_role
using (true)
with check (true);

-- Recovered statement 749
create policy "Users can view portal users"
  on "public"."customer_portal_users"
  as permissive
  for select
  to authenticated
using (((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = customer_portal_users.company_id) AND (cm.user_id = ( SELECT auth.uid() AS uid)) AND (cm.is_active = true)))) OR (auth_user_id = ( SELECT auth.uid() AS uid))));

-- Recovered statement 750
create policy "Users can view customers"
  on "public"."customers"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = customers.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 751
create policy "Internal users can delete documents"
  on "public"."documents"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = documents.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 752
create policy "Internal users can insert documents"
  on "public"."documents"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = documents.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 753
create policy "Internal users can update documents"
  on "public"."documents"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = documents.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 754
create policy "Users can view documents"
  on "public"."documents"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = documents.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 755
create policy "Internal users can delete facturen"
  on "public"."facturen"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = facturen.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 756
create policy "Internal users can insert facturen"
  on "public"."facturen"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = facturen.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 757
create policy "Internal users can update facturen"
  on "public"."facturen"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = facturen.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 758
create policy "Users can view facturen"
  on "public"."facturen"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = facturen.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 759
create policy "Internal users can delete inkomsten"
  on "public"."inkomsten"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = inkomsten.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 760
create policy "Internal users can insert inkomsten"
  on "public"."inkomsten"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = inkomsten.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 761
create policy "Internal users can update inkomsten"
  on "public"."inkomsten"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = inkomsten.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 762
create policy "Users can view inkomsten"
  on "public"."inkomsten"
  as permissive
  for select
  to authenticated
using (((customer_id IN ( SELECT customer_portal_users.customer_id
   FROM public.customer_portal_users
  WHERE ((customer_portal_users.auth_user_id = ( SELECT auth.uid() AS uid)) AND (customer_portal_users.is_active = true)))) OR (EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = inkomsten.bedrijf_id) AND (cm.user_id = ( SELECT auth.uid() AS uid)) AND (cm.is_active = true))))));

-- Recovered statement 763
create policy "Allow authenticated access to invoice_events"
  on "public"."invoice_events"
  as permissive
  for all
  to authenticated
using (true);

-- Recovered statement 764
create policy "Allow authenticated access to invoice_tax_breakdown"
  on "public"."invoice_tax_breakdown"
  as permissive
  for all
  to authenticated
using (true);

-- Recovered statement 765
create policy "Company members can view activity log"
  on "public"."offerte_activity_log"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = offerte_activity_log.company_id) AND (cm.user_id = auth.uid()) AND (cm.is_active = true)))));

-- Recovered statement 766
create policy "offerte_lijnen_company_isolation"
  on "public"."offerte_lijnen"
  as permissive
  for all
  to public
using ((company_id IN ( SELECT company_memberships.company_id
   FROM public.company_memberships
  WHERE ((company_memberships.user_id = auth.uid()) AND (company_memberships.is_active = true)))));

-- Recovered statement 767
create policy "Internal users can delete offertes"
  on "public"."offertes"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = offertes.bedrijf_id) AND (cm.user_id = auth.uid()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 768
create policy "Internal users can insert offertes"
  on "public"."offertes"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = offertes.bedrijf_id) AND (cm.user_id = auth.uid()) AND (cm.is_active = true)))));

-- Recovered statement 769
create policy "Internal users can update offertes"
  on "public"."offertes"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = offertes.bedrijf_id) AND (cm.user_id = auth.uid()) AND (cm.is_active = true)))));

-- Recovered statement 770
create policy "Users can view offertes"
  on "public"."offertes"
  as permissive
  for select
  to authenticated
using (((customer_id IN ( SELECT customer_portal_users.customer_id
   FROM public.customer_portal_users
  WHERE ((customer_portal_users.auth_user_id = ( SELECT auth.uid() AS uid)) AND (customer_portal_users.is_active = true)))) OR (EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = offertes.bedrijf_id) AND (cm.user_id = ( SELECT auth.uid() AS uid)) AND (cm.is_active = true))))));

-- Recovered statement 771
create policy "Platform admins see own role"
  on "public"."platform_admins"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));

-- Recovered statement 772
create policy "Profiles are viewable by authenticated users"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (true);

-- Recovered statement 773
create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((public.auth_user_id() = id))
with check ((public.auth_user_id() = id));

-- Recovered statement 774
create policy "Internal users can delete projecten"
  on "public"."projecten"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = projecten.bedrijf_id) AND (cm.user_id = auth.uid()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 775
create policy "Internal users can update projecten"
  on "public"."projecten"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = projecten.bedrijf_id) AND (cm.user_id = auth.uid()) AND (cm.is_active = true)))));

-- Recovered statement 776
create policy "Portal users can view own projecten"
  on "public"."projecten"
  as permissive
  for select
  to public
using ((customer_id IN ( SELECT customer_portal_users.customer_id
   FROM public.customer_portal_users
  WHERE ((customer_portal_users.auth_user_id = auth.uid()) AND (customer_portal_users.is_active = true)))));

-- Recovered statement 777
create policy "Users can create own reminders"
  on "public"."reminders"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = reminders.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 778
create policy "Users can delete own reminders"
  on "public"."reminders"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = reminders.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 779
create policy "Users can update own reminders"
  on "public"."reminders"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = reminders.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 780
create policy "Users can view own reminders"
  on "public"."reminders"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = reminders.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 781
create policy "Internal users can delete tasks"
  on "public"."tasks"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = tasks.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 782
create policy "Internal users can insert tasks"
  on "public"."tasks"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = tasks.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 783
create policy "Internal users can update tasks"
  on "public"."tasks"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = tasks.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 784
create policy "Users can view tasks"
  on "public"."tasks"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = tasks.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 785
create policy "Allow authenticated select on abonnementen"
  on "public"."abonnementen"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = abonnementen.company_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 786
create policy "Allow authenticated select on afspraken"
  on "public"."afspraken"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = afspraken.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 787
create policy "Allow authenticated select on artikelen"
  on "public"."artikelen"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = artikelen.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 788
create policy "Internal users select own company"
  on "public"."bedrijven"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = bedrijven.id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 789
create policy "Internal users update own company"
  on "public"."bedrijven"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = bedrijven.id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true) AND ((cm.role)::text = 'admin'::text)))));

-- Recovered statement 790
create policy "Allow authenticated select on betalingen"
  on "public"."betalingen"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = betalingen.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 791
create policy "Allow authenticated insert on contacten"
  on "public"."contacten"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = contacten.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 792
create policy "Allow authenticated select on contacten"
  on "public"."contacten"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = contacten.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 793
create policy "Portal users insert own audit"
  on "public"."customer_portal_audit_log"
  as permissive
  for insert
  to authenticated
with check ((public.auth_user_id() = portal_user_id));

-- Recovered statement 794
create policy "Allow authenticated insert on deals"
  on "public"."deals"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = deals.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 795
create policy "Allow authenticated select on deals"
  on "public"."deals"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = deals.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 796
create policy "Allow authenticated insert on projecten"
  on "public"."projecten"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = projecten.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 797
create policy "Allow authenticated select on projecten"
  on "public"."projecten"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = projecten.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 798
create policy "Allow authenticated select on timesheets"
  on "public"."timesheets"
  as permissive
  for select
  to authenticated
using ((public.auth_user_id() = user_id));

-- Recovered statement 799
create policy "Allow authenticated select on uitgaven"
  on "public"."uitgaven"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.company_memberships cm
  WHERE ((cm.company_id = uitgaven.bedrijf_id) AND (cm.user_id = public.auth_user_id()) AND (cm.is_active = true)))));

-- Recovered statement 800
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON public."User" FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recovered statement 801
CREATE TRIGGER on_bedrijf_created AFTER INSERT ON public.bedrijven FOR EACH ROW EXECUTE FUNCTION public.handle_new_bedrijf();

-- Recovered statement 802
CREATE TRIGGER trigger_update_factuur_payment_state AFTER INSERT OR DELETE OR UPDATE ON public.betalingen FOR EACH ROW EXECUTE FUNCTION public.trigger_update_factuur_payment_state();

-- Recovered statement 803
CREATE TRIGGER trigger_company_memberships_updated_at BEFORE UPDATE ON public.company_memberships FOR EACH ROW EXECUTE FUNCTION public.update_company_memberships_updated_at();

-- Recovered statement 804
CREATE TRIGGER trigger_audit_factuur_change AFTER INSERT OR UPDATE ON public.facturen FOR EACH ROW EXECUTE FUNCTION public.trigger_audit_document_change();

-- Recovered statement 805
CREATE TRIGGER trigger_facturen_updated_at BEFORE UPDATE ON public.facturen FOR EACH ROW EXECUTE FUNCTION public.update_facturen_updated_at();

-- Recovered statement 806
CREATE TRIGGER trigger_validate_factuur_state BEFORE UPDATE ON public.facturen FOR EACH ROW EXECUTE FUNCTION public.trigger_validate_factuur_state();

-- Recovered statement 807
CREATE TRIGGER trigger_offerte_lijnen_updated_at BEFORE UPDATE ON public.offerte_lijnen FOR EACH ROW EXECUTE FUNCTION public.update_offerte_lijnen_updated_at();

-- Recovered statement 808
CREATE TRIGGER trigger_sync_offerte_totals AFTER INSERT OR DELETE OR UPDATE ON public.offerte_lijnen FOR EACH ROW EXECUTE FUNCTION public.sync_offerte_totals_from_lijnen();

-- Recovered statement 809
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();

-- Recovered statement 810
CREATE TRIGGER trigger_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.update_reminders_updated_at();

-- Recovered statement 811
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

