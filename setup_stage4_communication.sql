-- --------------------------------------------------------
-- STAGE 4: COMMUNICATION MODULE
-- --------------------------------------------------------

-- 1. Communication Assets (Galeria)
create table public.communication_assets (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  image_url text not null,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  linked_demand_id uuid references public.demands(id) on delete set null
);

-- 2. Internal Drive Structure
create table public.communication_folders (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    parent_id uuid references public.communication_folders(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users(id) default auth.uid()
);

create table public.communication_files (
    id uuid default gen_random_uuid() primary key,
    folder_id uuid references public.communication_folders(id) on delete cascade,
    file_url text not null,
    name text not null,
    size_bytes bigint,
    mime_type text,
    uploaded_by uuid references auth.users(id) default auth.uid(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Enable RLS
alter table public.communication_assets enable row level security;
alter table public.communication_folders enable row level security;
alter table public.communication_files enable row level security;

-- 4. RLS Policies
-- Access allowed for: 'Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro'

-- Helper policy for assets
create policy "Communication Assets: Full Access"
  on public.communication_assets for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro')
    )
  );

-- Helper policy for folders
create policy "Communication Folders: Full Access"
  on public.communication_folders for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro')
    )
  );

-- Helper policy for files
create policy "Communication Files: Full Access"
  on public.communication_files for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro')
    )
  );

-- 5. Storage Buckets
-- Note: Buckets might need manual creation if SQL extension is not available/configured, but we try.
insert into storage.buckets (id, name, public)
values ('communication_media', 'communication_media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('communication_files', 'communication_files', false) -- Private files
on conflict (id) do nothing;

-- 6. Storage Policies (Standard logic for these roles)
-- Media Bucket
create policy "Media Bucket: Select" on storage.objects for select
using ( bucket_id = 'communication_media' ); -- Public read for media usually okay, or restrict if strict

create policy "Media Bucket: Insert" on storage.objects for insert
with check (
    bucket_id = 'communication_media' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro')
    )
);

create policy "Media Bucket: Delete" on storage.objects for delete
using (
    bucket_id = 'communication_media' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro')
    )
);

-- Files Bucket (Internal Drive)
create policy "Files Bucket: Select" on storage.objects for select
using (
    bucket_id = 'communication_files' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro')
    )
);

create policy "Files Bucket: Insert" on storage.objects for insert
with check (
    bucket_id = 'communication_files' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro')
    )
);

create policy "Files Bucket: Delete" on storage.objects for delete
using (
    bucket_id = 'communication_files' AND
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro')
    )
);
