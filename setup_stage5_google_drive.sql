-- --------------------------------------------------------
-- STAGE 5: ADVANCED COMMUNICATION & GOOGLE DRIVE
-- --------------------------------------------------------

-- 1. Communication Posts (Instagram Style)
-- Supports Feed (post), Stories (story), Reels (reel), and Institutional Photos (institutional)
create type public.communication_post_type as enum ('post', 'story', 'reel', 'institutional');
create type public.communication_year_category as enum ('1_ANO', '2_ANO', '3_ANO', 'PNAB');

create table public.communication_posts (
  id uuid default gen_random_uuid() primary key,
  type public.communication_post_type not null,
  title text not null, -- Caption or Title
  description text,
  media_url text not null, -- URL in Supabase or Google Drive
  drive_file_id text, -- ID in Google Drive if applicable
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  linked_demand_id uuid references public.demands(id) on delete set null,
  
  -- Institutional specific
  year_category public.communication_year_category,
  is_pnab boolean default false
);

-- 2. Google Drive Configuration
-- Store single ONG account credentials safely
create table public.google_drive_config (
    id uuid default gen_random_uuid() primary key,
    refresh_token text not null, -- Should be encrypted via pgcrypto or app logic (we'll rely on RLS/App logic for now)
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_by uuid references auth.users(id) default auth.uid()
);

-- 3. Enable RLS
alter table public.communication_posts enable row level security;
alter table public.google_drive_config enable row level security;

-- 4. RLS Policies

-- POSTS: Full access for Communication Team & Admins
create policy "Communication Posts: Full Access"
  on public.communication_posts for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro')
    )
  );

-- CONFIG: Strict access. Only Admin/Coord/Communication can INSERT/UPDATE.
-- READ is restricted to ensure tokens don't leak to frontend? 
-- Ideally only server-side service role reads this, but RLS applies to clients.
-- We will restrict SELECT to these roles too, but app should fetch server-side.

create policy "Google Config: Full Access"
  on public.google_drive_config for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Comunicação', 'Coord. Geral', 'Presidente', 'Dir. Financeiro')
    )
  );

-- 5. Bucket for general media (if not using 'communication_media' from Stage 4)
-- We can reuse 'communication_media' for posts/stories/reels.

