-- ============================================================
-- MIGRATION 005: guru, master_kelas, jurnal_guru
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── TABLE: guru ──────────────────────────────────────────────
create table if not exists public.guru (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now() not null,
  nip           text,
  nama          text not null,
  jk            text check (jk in ('L','P')) not null default 'L',
  no_wa         text,
  foto_url      text,
  status_aktif  boolean default true not null
);

create index if not exists idx_guru_nama on public.guru(nama);
create index if not exists idx_guru_nip  on public.guru(nip);

-- ── TABLE: master_kelas ──────────────────────────────────────
create table if not exists public.master_kelas (
  id              uuid primary key default gen_random_uuid(),
  nama_kelas      text not null,
  tingkat         text not null,
  wali_kelas_id   uuid references public.guru(id) on delete set null,
  tahun_ajaran    text not null default '2025/2026'
);

create index if not exists idx_master_kelas_tingkat on public.master_kelas(tingkat);
create index if not exists idx_master_kelas_ta      on public.master_kelas(tahun_ajaran);

-- ── TABLE: jurnal_guru ───────────────────────────────────────
create table if not exists public.jurnal_guru (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now() not null,
  tanggal         date not null default current_date,
  kelas           text not null,
  mata_pelajaran  text not null,
  nama_guru       text not null,
  materi          text not null,
  keterangan      text
);

create index if not exists idx_jurnal_guru_tanggal on public.jurnal_guru(tanggal);
create index if not exists idx_jurnal_guru_kelas   on public.jurnal_guru(kelas);
create index if not exists idx_jurnal_guru_guru    on public.jurnal_guru(nama_guru);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.guru         enable row level security;
alter table public.master_kelas enable row level security;
alter table public.jurnal_guru  enable row level security;

create policy "auth_all_guru"         on public.guru         for all to authenticated using (true) with check (true);
create policy "auth_all_master_kelas" on public.master_kelas for all to authenticated using (true) with check (true);
create policy "auth_all_jurnal_guru"  on public.jurnal_guru  for all to authenticated using (true) with check (true);

-- Public read for guru & kelas (portal view)
create policy "public_read_guru"         on public.guru         for select to anon using (true);
create policy "public_read_master_kelas" on public.master_kelas for select to anon using (true);
