-- Create Profiles Table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  role text,
  primary key (id)
);

-- Create Whitelist Table
create table public.whitelist (
  id uuid default gen_random_uuid() primary key,
  email text unique,
  full_name text not null,
  role text not null,
  is_claimed boolean default false,
  user_id uuid references auth.users
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.whitelist enable row level security;

-- RLS Policies for Profiles
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- RLS Policies for Whitelist
create policy "Anyone can read unclaimed whitelist items."
  on whitelist for select
  using ( is_claimed = false );

-- Seed Data (Whitelist)
insert into public.whitelist (full_name, role) values
('Evelin Salles', 'Coord. Geral'),
('Juracy Bahia', 'Presidente'),
('Ramon Carneiro', 'Dir. Financeiro'),
('Ana Karine', 'Estágio ADM'),
('Joaquim Salles', 'Comunicação'),
('Pamella Vianna', 'Coord. Pedagógica'),
('Patrícia Santana', 'Educadora'),
('MAISLA', 'Estágio Pedagógico');
