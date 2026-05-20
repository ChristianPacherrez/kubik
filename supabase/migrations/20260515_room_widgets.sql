-- ============================================================
-- Kubik — Room Widgets (Room Activities Phase)
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Room Notes (sticky notes) ─────────────────────────────────────────────

create table if not exists public.room_notes (
  id          text        primary key default gen_random_uuid()::text,
  room_id     text        not null,
  content     text        not null,
  color       text        not null default 'yellow',
  author_id   text        not null,
  author_name text        not null,
  created_at  timestamptz not null default now()
);

-- Índice para queries por sala
create index if not exists room_notes_room_id_idx on public.room_notes (room_id, created_at desc);

-- ── 2. Room Tasks ─────────────────────────────────────────────────────────────

create table if not exists public.room_tasks (
  id          text        primary key default gen_random_uuid()::text,
  room_id     text        not null,
  text        text        not null,
  done        boolean     not null default false,
  author_id   text        not null,
  author_name text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists room_tasks_room_id_idx on public.room_tasks (room_id, created_at asc);

-- ── 3. Room Links ─────────────────────────────────────────────────────────────

create table if not exists public.room_links (
  id          text        primary key default gen_random_uuid()::text,
  room_id     text        not null,
  url         text        not null,
  title       text        not null,
  author_id   text        not null,
  author_name text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists room_links_room_id_idx on public.room_links (room_id, created_at desc);

-- ── 4. Row Level Security (MVP: acceso abierto) ───────────────────────────────
--
-- Para producción: reemplazar "using (true)" con reglas basadas en
-- el JWT del usuario (e.g. auth.uid() en el author_id).

alter table public.room_notes enable row level security;
alter table public.room_tasks enable row level security;
alter table public.room_links enable row level security;

-- Drop si ya existen (idempotente)
drop policy if exists "kubik_room_notes_all"  on public.room_notes;
drop policy if exists "kubik_room_tasks_all"  on public.room_tasks;
drop policy if exists "kubik_room_links_all"  on public.room_links;

create policy "kubik_room_notes_all"
  on public.room_notes for all
  using (true)
  with check (true);

create policy "kubik_room_tasks_all"
  on public.room_tasks for all
  using (true)
  with check (true);

create policy "kubik_room_links_all"
  on public.room_links for all
  using (true)
  with check (true);

-- ── 5. Habilitar Realtime ─────────────────────────────────────────────────────
--
-- Necesario para que postgres_changes llegue al cliente.
-- Si la tabla ya está en la publication, el comando falla silenciosamente.

do $$
begin
  begin
    alter publication supabase_realtime add table public.room_notes;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.room_tasks;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.room_links;
  exception when others then null;
  end;
end $$;
