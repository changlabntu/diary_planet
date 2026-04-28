-- Diary Planet — initial schema
--
-- Maps the in-memory model from App.jsx / generateCreature.js onto Postgres.
-- Assumes Supabase anonymous auth is enabled; auth.uid() identifies both author and reader.
--
-- Design anchors:
--   * Concealment: author must not see attribute/name/colors/rarity until state='hatched'
--     (today enforced client-side via cat='U' at DiarySheet.jsx:51-54). Here it moves into
--     a DB view + RLS so the server never leaks those fields.
--   * State transitions go through SECURITY DEFINER RPCs. Clients have no direct UPDATE
--     rights on state/reply/hatch columns, so rarity can't be re-rolled and a sent journal
--     can't be double-replied.
--   * Peer pool is cross-user: rpc_draw_journal excludes author_id = auth.uid().

create extension if not exists pgcrypto;

-- ─── Enums ──────────────────────────────────────────────────────────────────
create type monster_state     as enum ('egg', 'sent', 'replied', 'hatched');
create type monster_attribute as enum ('A', 'B', 'C', 'D', 'U');
create type monster_shape     as enum ('gem', 'sphere');
create type monster_rarity    as enum ('common', 'rare');

-- ─── Tables ─────────────────────────────────────────────────────────────────
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

create table diaries (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references auth.users(id) on delete cascade,
  content     text not null,
  mood_score  int  not null check (mood_score between 1 and 5),
  emotions    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index diaries_author_created_idx on diaries(author_id, created_at desc);

create table monsters (
  id            uuid primary key default gen_random_uuid(),
  diary_id      uuid not null unique references diaries(id) on delete cascade,
  author_id     uuid not null references auth.users(id) on delete cascade,
  state         monster_state not null default 'egg',

  -- Hidden from author until hatched. Populated by reader at reply, or by hatch RPC.
  attribute     monster_attribute not null default 'U',
  name          text,
  color         text,
  torso_color   text,
  rarity        monster_rarity,

  gift          text,
  gift_shape    monster_shape,
  reply_comment text,
  reader_id     uuid references auth.users(id) on delete set null,
  replied_at    timestamptz,
  sent_at       timestamptz,
  hatched_at    timestamptz,

  pat_count     int  not null default 0,
  is_displayed  bool not null default false,
  starred       bool not null default false,

  created_at    timestamptz not null default now()
);
create index monsters_author_state_idx on monsters(author_id, state);
-- Used by rpc_draw_journal to scan the readable pool efficiently.
create index monsters_sent_pool_idx on monsters(state, created_at) where state = 'sent';

-- Tracks which readers have drawn which journals. Lets rpc_draw_journal
-- avoid handing the same reader the same journal back-to-back.
create table reader_draws (
  reader_id  uuid not null references auth.users(id) on delete cascade,
  monster_id uuid not null references monsters(id)    on delete cascade,
  drawn_at   timestamptz not null default now(),
  primary key (reader_id, monster_id)
);

-- ─── Author-facing projection ───────────────────────────────────────────────
-- Nulls out identity fields until the egg hatches. The client reads this view
-- for its own monsters instead of the base table, so concealment survives
-- even if the client code forgets to force cat='U'.
create view monsters_author_view with (security_invoker = true) as
select
  id, diary_id, author_id, state,
  case when state = 'hatched' then attribute else 'U'::monster_attribute end as attribute,
  case when state = 'hatched' then name        end as name,
  case when state = 'hatched' then color       end as color,
  case when state = 'hatched' then torso_color end as torso_color,
  case when state = 'hatched' then rarity      end as rarity,
  -- gift/shape/comment are reader-authored content; author sees them once replied.
  case when state in ('replied','hatched') then gift       end as gift,
  case when state in ('replied','hatched') then gift_shape end as gift_shape,
  case when state in ('replied','hatched') then reply_comment end as reply_comment,
  replied_at, sent_at, hatched_at,
  pat_count, is_displayed, starred, created_at
from monsters;

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table profiles       enable row level security;
alter table diaries        enable row level security;
alter table monsters       enable row level security;
alter table reader_draws   enable row level security;

-- profiles: each user reads/writes their own row.
create policy profiles_self_read  on profiles for select using (id = auth.uid());
create policy profiles_self_write on profiles for insert with check (id = auth.uid());
create policy profiles_self_upd   on profiles for update using (id = auth.uid());

-- diaries:
--   * Author: full read on own diaries. No direct insert/update — goes through rpc_write_diary.
--   * Reader: can read a diary only if its paired monster is currently 'sent' and not theirs.
create policy diaries_author_read on diaries for select
  using (author_id = auth.uid());

create policy diaries_reader_read on diaries for select
  using (
    author_id <> auth.uid()
    and exists (
      select 1 from monsters m
      where m.diary_id = diaries.id
        and m.state   = 'sent'
        and m.author_id <> auth.uid()
    )
  );

-- monsters:
--   * Author: reads own rows. The client is expected to read monsters_author_view instead,
--     but the base row is available for admin/debug and for the hatched case.
--   * Reader: no direct read. rpc_draw_journal returns the projection they're allowed to see.
create policy monsters_author_read on monsters for select
  using (author_id = auth.uid());

-- No insert/update/delete policies on diaries or monsters: all mutations go through RPCs below.

-- reader_draws: reader reads own rows only; writes happen inside rpc_draw_journal.
create policy reader_draws_self_read on reader_draws for select
  using (reader_id = auth.uid());

-- ─── Helpers ────────────────────────────────────────────────────────────────
-- Deterministic rand in [0,1) seeded by text. Mirrors seededRand(`diary-${id}-gift-${virtue}`)
-- from generateCreature.js so name selection and rarity roll stay reproducible.
create or replace function seeded_rand(seed text, salt int)
returns double precision language sql immutable as $$
  select ((hashtext(seed || ':' || salt)::bigint + 2147483648) % 2147483647)::double precision
         / 2147483647.0;
$$;

-- ─── RPCs ───────────────────────────────────────────────────────────────────

-- Write a diary + create the paired egg atomically. Returns the new diary id.
create or replace function rpc_write_diary(
  p_content    text,
  p_mood_score int,
  p_emotions   jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_diary_id uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_content is null or length(btrim(p_content)) = 0 then
    raise exception 'content required';
  end if;
  if p_mood_score not between 1 and 5 then
    raise exception 'mood_score out of range';
  end if;

  insert into diaries (author_id, content, mood_score, emotions)
  values (v_uid, p_content, p_mood_score, coalesce(p_emotions, '[]'::jsonb))
  returning id into v_diary_id;

  insert into monsters (diary_id, author_id, state)
  values (v_diary_id, v_uid, 'egg');

  return v_diary_id;
end $$;

-- egg → sent. Author-only, idempotent on already-sent.
create or replace function rpc_send_journal(p_diary_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  update monsters
     set state = 'sent', sent_at = now()
   where diary_id = p_diary_id
     and author_id = v_uid
     and state = 'egg';
  if not found then
    raise exception 'no egg to send for diary %', p_diary_id;
  end if;
end $$;

-- Draw a random sent journal for the current reader, excluding their own and (optionally)
-- one they just looked at. Returns the diary projection + monster_id.
-- Does NOT lock or consume the journal — many readers could be looking at the same one.
-- The actual reply is a conditional UPDATE, so whoever writes first wins.
create or replace function rpc_draw_journal(p_exclude_monster_id uuid default null)
returns table (
  monster_id uuid,
  diary_id   uuid,
  content    text,
  mood_score int,
  emotions   jsonb,
  created_at timestamptz
)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  return query
  with candidates as (
    select m.id as monster_id, d.id as diary_id, d.content, d.mood_score,
           d.emotions, d.created_at
      from monsters m
      join diaries  d on d.id = m.diary_id
     where m.state = 'sent'
       and m.author_id <> v_uid
       and (p_exclude_monster_id is null or m.id <> p_exclude_monster_id)
  )
  select * from candidates
   order by random()
   limit 1;

  -- Record the draw (outside the return query so we see the id we returned).
  insert into reader_draws (reader_id, monster_id)
  select v_uid, monster_id
    from (
      select m.id as monster_id
        from monsters m
       where m.state = 'sent'
         and m.author_id <> v_uid
         and (p_exclude_monster_id is null or m.id <> p_exclude_monster_id)
       order by random() limit 1
    ) t
  on conflict do nothing;
end $$;

-- sent → replied. Reader attaches cat/virtue/shape/comment. First writer wins.
create or replace function rpc_reply_journal(
  p_monster_id uuid,
  p_cat        monster_attribute,
  p_virtue     text,
  p_shape      monster_shape,
  p_comment    text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_author uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_cat in ('U') then raise exception 'invalid attribute for reply'; end if;

  select author_id into v_author from monsters where id = p_monster_id;
  if v_author is null then raise exception 'monster not found'; end if;
  if v_author = v_uid then raise exception 'cannot reply to own journal'; end if;

  update monsters
     set state         = 'replied',
         attribute     = p_cat,
         gift          = p_virtue,
         gift_shape    = p_shape,
         reply_comment = nullif(btrim(coalesce(p_comment, '')), ''),
         reader_id     = v_uid,
         replied_at    = now()
   where id = p_monster_id
     and state = 'sent';

  if not found then
    raise exception 'journal already replied or not sendable';
  end if;
end $$;

-- replied → hatched. Author-only. Generates name/color/rarity server-side using the
-- same deterministic seed as generateCreature.hatchMonster. Returns the revealed row.
create or replace function rpc_hatch(p_diary_id uuid)
returns monsters
language plpgsql security definer set search_path = public as $$
declare
  v_uid        uuid := auth.uid();
  v_monster    monsters;
  v_diary      diaries;
  v_name       text;
  v_color      text;
  v_torso      text;
  v_rarity     monster_rarity;
  v_mood       int;
  v_emotions_n int;
  v_r1 double precision; v_r2 double precision; v_r3 double precision;
  v_names      text[] := array[
    'Lumie','Pippa','Zorb','Nix','Mox','Fen','Biscuit','Pogo',
    'Tulu','Wobb','Kiri','Bop','Mim','Dex','Yoli','Grub',
    'Flan','Noodle','Pebble','Tato','Sprite','Gus','Mochi','Quill'
  ];
  v_hi text; v_mid text; v_lo text;
  v_seed text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select * into v_monster from monsters where diary_id = p_diary_id for update;
  if v_monster.id is null then raise exception 'monster not found'; end if;
  if v_monster.author_id <> v_uid then raise exception 'not your monster'; end if;
  if v_monster.state <> 'replied' then raise exception 'monster not ready to hatch'; end if;

  select * into v_diary from diaries where id = p_diary_id;

  -- Attribute-keyed color tiers, mirroring ATTRIBUTES in theme.js.
  case v_monster.attribute
    when 'A' then v_hi:='#CECBF6'; v_mid:='#7F77DD'; v_lo:='#3C3489';
    when 'B' then v_hi:='#F4C0D1'; v_mid:='#D4537E'; v_lo:='#72243E';
    when 'C' then v_hi:='#9FE1CB'; v_mid:='#1D9E75'; v_lo:='#085041';
    when 'D' then v_hi:='#FAC775'; v_mid:='#BA7517'; v_lo:='#633806';
    else          v_hi:='#FFFFFF'; v_mid:='#E5E5E5'; v_lo:='#8A8A8A';
  end case;

  v_seed := 'diary-' || p_diary_id::text || '-gift-' || coalesce(v_monster.gift, '');
  v_r1 := seeded_rand(v_seed, 1);
  v_r2 := seeded_rand(v_seed, 2);
  v_r3 := seeded_rand(v_seed, 3);

  v_name  := v_names[1 + floor(v_r1 * array_length(v_names, 1))::int];
  v_mood  := v_diary.mood_score;
  v_color := case when v_mood >= 4 then v_hi when v_mood <= 2 then v_lo else v_mid end;
  v_torso := case when v_r2 > 0.5 then v_hi else v_mid end;

  v_emotions_n := coalesce(jsonb_array_length(v_diary.emotions), 0);
  v_rarity := case
    when v_mood = 5 and v_emotions_n >= 3 and v_r3 > 0.7 then 'rare'::monster_rarity
    else 'common'::monster_rarity
  end;

  update monsters
     set state       = 'hatched',
         name        = v_name,
         color       = v_color,
         torso_color = v_torso,
         rarity      = v_rarity,
         hatched_at  = now()
   where id = v_monster.id
   returning * into v_monster;

  return v_monster;
end $$;

-- Deploy / recall. Enforces MAX_DEPLOYED = 7 from theme.js.
create or replace function rpc_set_display(p_monster_id uuid, p_displayed boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_count int;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  if p_displayed then
    select count(*) into v_count
      from monsters
     where author_id = v_uid and is_displayed = true and id <> p_monster_id;
    if v_count >= 7 then raise exception 'planet full'; end if;
  end if;

  update monsters
     set is_displayed = p_displayed
   where id = p_monster_id
     and author_id = v_uid
     and state = 'hatched';
  if not found then raise exception 'not a hatched monster of yours'; end if;
end $$;

create or replace function rpc_set_starred(p_monster_id uuid, p_starred boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  update monsters
     set starred = p_starred
   where id = p_monster_id
     and author_id = v_uid
     and state = 'hatched';
  if not found then raise exception 'not a hatched monster of yours'; end if;
end $$;

-- ─── Grants ─────────────────────────────────────────────────────────────────
-- Clients talk through the RPCs and the author view; block direct table DML.
revoke all on diaries, monsters, reader_draws from anon, authenticated;
grant  select on monsters_author_view to authenticated;
grant  select on diaries              to authenticated;   -- RLS narrows further
grant  select on monsters             to authenticated;   -- RLS narrows to own rows

grant execute on function rpc_write_diary(text,int,jsonb)                                 to authenticated;
grant execute on function rpc_send_journal(uuid)                                          to authenticated;
grant execute on function rpc_draw_journal(uuid)                                          to authenticated;
grant execute on function rpc_reply_journal(uuid, monster_attribute, text, monster_shape, text) to authenticated;
grant execute on function rpc_hatch(uuid)                                                 to authenticated;
grant execute on function rpc_set_display(uuid, boolean)                                  to authenticated;
grant execute on function rpc_set_starred(uuid, boolean)                                  to authenticated;
