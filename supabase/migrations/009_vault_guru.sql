-- ============================================================
-- MIGRATION 009: vault_guru (Dedicated Table for Vault)
-- ============================================================

-- Create a dedicated table for credentials to make it more organized and secure
create table if not exists public.vault_guru (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now() not null,
  guru_id       uuid references public.guru(id) on delete cascade not null,
  platform      text not null,
  username      text not null,
  password      text not null,
  keterangan    text
);

-- Indexing for performance
create index if not exists idx_vault_guru_id on public.vault_guru(guru_id);
create index if not exists idx_vault_platform on public.vault_guru(platform);

-- Enable RLS
alter table public.vault_guru enable row level security;

-- Policies
create policy "auth_all_vault" on public.vault_guru 
  for all to authenticated 
  using (true) 
  with check (true);

-- Clean up old JSONB column from guru table (optional, but recommended for clean schema)
-- ALTER TABLE public.guru DROP COLUMN IF EXISTS kredensial;
