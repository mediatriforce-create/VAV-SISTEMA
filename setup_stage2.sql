-- Create Banks Table
create table public.banks (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed Initial Banks
insert into public.banks (name) values 
('Banco 1'), 
('Banco 2'), 
('Banco 3');

-- Create Financial Entries Table
create table public.financial_entries (
  id uuid default gen_random_uuid() primary key,
  bank_id uuid references public.banks(id) not null,
  type text check (type in ('entrada', 'saida')) not null,
  description text not null,
  category text not null,
  amount numeric(12, 2) not null,
  entry_date date not null,
  responsible_id uuid references public.profiles(id),
  attachment_url text, -- Store the path in storage
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.banks enable row level security;
alter table public.financial_entries enable row level security;

-- RLS Policies for Banks (Readable by everyone, but let's restrict if needed. For now, read-only for all auth users is fine for dropdowns)
create policy "Banks are viewable by authenticated users."
  on banks for select
  using ( auth.role() = 'authenticated' );

-- RLS Logic for Financial Entries (Strict Access)
-- Allowed Roles: 'Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Estágio ADM'
-- We check the user's profile role.

-- Create a helper function to check permission (optional but cleaner, doing inline for simplicity first)

create policy "Financial Entries: Full Access for Admins"
  on financial_entries
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Estágio ADM')
    )
  );

-- Storage Bucket for Financial Docs
-- Note: Buckets are usually created via API or Dashboard, but we can try SQL extension if available.
-- Fallback: User might need to create 'financial_docs' bucket manually if this script fails on bucket creation.
insert into storage.buckets (id, name, public) 
values ('financial_docs', 'financial_docs', false)
on conflict (id) do nothing;

-- Storage Policies
create policy "Financial Docs: Admin View"
  on storage.objects for select
  using (
    bucket_id = 'financial_docs'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Estágio ADM')
    )
  );

create policy "Financial Docs: Admin Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'financial_docs'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Estágio ADM')
    )
  );

create policy "Financial Docs: Admin Delete"
  on storage.objects for delete
  using (
    bucket_id = 'financial_docs'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('Coord. Geral', 'Presidente', 'Dir. Financeiro', 'Estágio ADM')
    )
  );
