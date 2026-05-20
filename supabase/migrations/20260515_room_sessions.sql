-- ============================================================
-- Kubik — Live Room Sessions
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── 1. Room Sessions ─────────────────────────────────────────────────────────
--
-- UNIQUE en room_id → una sola sesión activa por sala.
-- Para "terminar" una sesión: DELETE la fila (más simple que status field).

create table if not exists public.room_sessions (
  id           text        primary key default gen_random_uuid()::text,
  room_id      text        not null unique,
  title        text        not null default 'Sesión activa',
  started_by   text        not null,
  started_name text        not null,
  started_at   timestamptz not null default now()
);

create index if not exists room_sessions_room_id_idx
  on public.room_sessions (room_id);

-- ── 2. Session Participants ───────────────────────────────────────────────────
--
-- Clave primaria compuesta (session_id, user_id) → evita duplicados.
-- room_id denormalizado para queries directas sin JOIN.
-- ON DELETE CASCADE → al terminar sesión, participantes se limpian solos.

create table if not exists public.room_session_participants (
  session_id  text        not null references public.room_sessions(id) on delete cascade,
  room_id     text        not null,
  user_id     text        not null,
  user_name   text        not null,
  avatar_url  text,
  joined_at   timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index if not exists rsp_room_id_idx
  on public.room_session_participants (room_id);

create index if not exists rsp_session_id_idx
  on public.room_session_participants (session_id);

-- ── 3. Row Level Security (MVP: acceso abierto) ───────────────────────────────

alter table public.room_sessions             enable row level security;
alter table public.room_session_participants enable row level security;

drop policy if exists "kubik_sessions_all"      on public.room_sessions;
drop policy if exists "kubik_participants_all"   on public.room_session_participants;

create policy "kubik_sessions_all"
  on public.room_sessions for all using (true) with check (true);

create policy "kubik_participants_all"
  on public.room_session_participants for all using (true) with check (true);

-- ── 4. Habilitar Realtime ─────────────────────────────────────────────────────

do $$
begin
  begin
    alter publication supabase_realtime add table public.room_sessions;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.room_session_participants;
  exception when others then null;
  end;
end $$;
