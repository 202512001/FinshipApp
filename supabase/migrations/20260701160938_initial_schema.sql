-- ==========================================================
-- EXTENSIONS
-- ==========================================================

create extension if not exists "pgcrypto";

-- ==========================================================
-- UPDATED_AT FUNCTION
-- ==========================================================

create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- ==========================================================
-- AREAS
-- ==========================================================

create table areas (

    id uuid primary key default gen_random_uuid(),

    name text not null unique,

    created_at timestamptz default now()

);

-- ==========================================================
-- MEMBERS
-- ==========================================================

create table members (

    id uuid primary key default gen_random_uuid(),

    name text not null,

    mobile text not null unique,

    email text,

    gender text
        check (gender in ('Male','Female')),

    area_id uuid
        references areas(id),

    society text,

    building text,

    latitude double precision,

    longitude double precision,

    pin_hash text,

    status text default 'pending'
        check(status in ('pending','approved','blocked')),

    is_admin boolean default false,

    created_at timestamptz default now(),

    updated_at timestamptz default now()

);

create trigger trg_members_updated_at

before update on members

for each row

execute function update_updated_at_column();

-- ==========================================================
-- ADMINS
-- ==========================================================

create table admins (

    id uuid primary key default gen_random_uuid(),

    member_id uuid
        references members(id)
        on delete cascade,

    role text
        check (role in ('main','area'))
        default 'area',

    area_id uuid
        references areas(id),

    gender text
        check (gender in ('Male','Female','All'))
        default 'All',

    created_at timestamptz default now()

);

-- ==========================================================
-- COMMUNITY RECORDS
-- ==========================================================

create table community_records (

    id uuid primary key default gen_random_uuid(),

    area_id uuid
        not null
        references areas(id),

    gender text
        not null
        check (gender in ('Male','Female')),

    name text not null,

    mobile text,

    society text,

    building text,

    visit_count integer
        default 0,

    last_visited_date date,

    notes text,

    extra jsonb
        default '{}'::jsonb,

    is_deleted boolean
        default false,

    created_at timestamptz
        default now(),

    updated_at timestamptz
        default now()

);

create trigger trg_records_updated_at

before update on community_records

for each row

execute function update_updated_at_column();

-- ==========================================================
-- AREA COLUMN DEFINITIONS
-- ==========================================================

create table area_column_defs (

    id uuid primary key default gen_random_uuid(),

    area_id uuid
        references areas(id),

    gender text
        check (gender in ('Male','Female')),

    field_key text not null,

    field_label text not null,

    field_type text
        check (
            field_type in
            ('text','number','date','dropdown')
        ),

    dropdown_options jsonb,

    created_at timestamptz
        default now()

);

-- ==========================================================
-- ALERTS
-- ==========================================================

create table alerts (

    id uuid primary key default gen_random_uuid(),

    sender_id uuid
        not null
        references members(id)
        on delete cascade,

    area_id uuid
        not null
        references areas(id),

    gender text
        not null
        check (gender in ('Male','Female')),

    latitude double precision,

    longitude double precision,

    status text
        default 'active'
        check (status in ('active','grouped','expired','cancelled')),

    created_at timestamptz default now()

);

-- ==========================================================
-- ALERT RESPONSES
-- ==========================================================

create table alert_responses (

    id uuid primary key default gen_random_uuid(),

    alert_id uuid
        references alerts(id)
        on delete cascade,

    member_id uuid
        references members(id)
        on delete cascade,

    accepted_at timestamptz
        default now(),

    unique(alert_id, member_id)

);

-- ==========================================================
-- GROUPS
-- ==========================================================

create table groups (

    id uuid primary key default gen_random_uuid(),

    alert_id uuid
        references alerts(id),

    recommended_record_id uuid
        references community_records(id),

    status text
        default 'active'
        check(status in ('active','completed','cancelled')),

    created_at timestamptz
        default now()

);

-- ==========================================================
-- GROUP MEMBERS
-- ==========================================================

create table group_members (

    id uuid primary key default gen_random_uuid(),

    group_id uuid
        references groups(id)
        on delete cascade,

    member_id uuid
        references members(id)
        on delete cascade,

    joined_at timestamptz
        default now(),

    unique(group_id, member_id)

);

-- ==========================================================
-- VISITS
-- ==========================================================

create table visits (

    id uuid primary key default gen_random_uuid(),

    group_id uuid
        references groups(id)
        on delete set null,

    community_record_id uuid
        not null
        references community_records(id),

    visited_by uuid
        not null
        references members(id),

    visit_date timestamptz
        default now(),

    notes text,

    created_at timestamptz
        default now()

);

-- ==========================================================
-- AUDIT LOGS
-- ==========================================================

create table audit_logs (

    id uuid primary key default gen_random_uuid(),

    member_id uuid
        references members(id),

    action text not null,

    table_name text not null,

    record_id uuid,

    old_data jsonb,

    new_data jsonb,

    created_at timestamptz
        default now()

);

-- ==========================================================
-- APP SETTINGS
-- ==========================================================

create table app_settings (

    id uuid primary key default gen_random_uuid(),

    setting_key text unique not null,

    setting_value text,

    created_at timestamptz
        default now()

);

-- ==========================================================
-- INITIAL DATA
-- ==========================================================

insert into areas(name)
values
('Area A'),
('Area B');

insert into app_settings(setting_key,setting_value)
values
('ADMIN_PASSWORD','WeWill2026');