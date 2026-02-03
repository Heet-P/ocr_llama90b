-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Forms table
create table if not exists forms (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    file_path text not null,
    url text not null,
    file_size integer,
    content_type text,
    status text default 'uploaded', -- uploaded, processing, ready, error
    ocr_data jsonb, -- Stores Doctr/Gemini output
    form_schema jsonb, -- Stores extracted fields and questions
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sessions table (for chat instances)
create table if not exists sessions (
    id uuid primary key default uuid_generate_v4(),
    form_id uuid references forms(id) on delete cascade not null,
    status text default 'active',
    current_field_id text,
    form_data jsonb default '{}'::jsonb, -- collected answers
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table (chat history)
create table if not exists messages (
    id uuid primary key default uuid_generate_v4(),
    session_id uuid references sessions(id) on delete cascade not null,
    role text not null, -- user, assistant
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage bucket policy (simplified for public bucket)
-- Note: User needs to create 'pdf-forms' bucket in Supabase Dashboard manually.
