-- 体操競技 試技会スコア管理システム 初期スキーマ
-- 方針:
--   * DB アクセスは全てサーバー側 (service role) 経由。
--   * 全テーブルで RLS を有効化しつつポリシーを一切作らない = anon / authenticated からは全操作拒否。
--     service role は RLS をバイパスするためサーバーからのみ読み書きできる。

set search_path = public;

-- ── 選手 ───────────────────────────────────────────────
create table athletes (
  id            uuid primary key default gen_random_uuid(),
  last_name     text not null,
  first_name    text not null,
  kana          text,
  category      text not null check (category in ('MAG','WAG')),
  affiliation   text,                       -- 所属・学年 (同姓同名の識別に使用)
  birth_mmdd    char(4),                    -- 誕生日4桁 (MMDD) 任意記録。ログインには使用しない
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── 種目マスタ ─────────────────────────────────────────
create table apparatuses (
  id          serial primary key,
  code        text not null,               -- FX, PH, SR, VT, PB, HB, UB, BB
  name_ja     text not null,
  category    text not null check (category in ('MAG','WAG')),
  sort_order  int not null,
  unique (code, category)
);
create index apparatuses_category_idx on apparatuses (category, sort_order);

-- ── 試技会 ─────────────────────────────────────────────
create table competitions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  held_on     date not null,
  venue       text,
  status      text not null default 'draft'
              check (status in ('draft','open','locked','finalized')),
  created_at  timestamptz not null default now()
);
create index competitions_held_on_idx on competitions (held_on);

-- ── 参加者 (エントリー) ────────────────────────────────
create table competition_entries (
  competition_id uuid not null references competitions(id) on delete cascade,
  athlete_id     uuid not null references athletes(id),
  primary key (competition_id, athlete_id)
);

-- ── 試技 (1選手 × 1種目 = 1レコード) ──────────────────
create table routines (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  athlete_id     uuid not null references athletes(id) on delete cascade,
  apparatus_id   int  not null references apparatuses(id),
  d_score        numeric(5,3),                                  -- 選手が入力
  e_score        numeric(5,3),                                  -- 管理者が入力
  nd             numeric(5,3) not null default 0,               -- 常に正値で保存し計算時に減算
  sb             numeric(5,3) not null default 0 check (sb in (0, 0.1)),
  d_updated_at   timestamptz,
  e_updated_at   timestamptz,
  unique (competition_id, athlete_id, apparatus_id)
);
create index routines_competition_athlete_idx on routines (competition_id, athlete_id);
create index routines_competition_apparatus_idx on routines (competition_id, apparatus_id);

-- ── 団体 ───────────────────────────────────────────────
create table teams (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  name           text not null,
  category       text not null check (category in ('MAG','WAG'))
);

create table team_members (
  team_id    uuid not null references teams(id) on delete cascade,
  athlete_id uuid not null references athletes(id) on delete cascade,
  primary key (team_id, athlete_id)
);

-- ── 団体集計ルール (カテゴリごとに可変。ハードコード禁止) ─
create table team_rules (
  category       text primary key check (category in ('MAG','WAG')),
  team_size      int not null,
  counting_count int not null
);

-- ── RLS: 全テーブル有効化・ポリシー無し (= 全拒否) ─────
alter table athletes            enable row level security;
alter table apparatuses         enable row level security;
alter table competitions        enable row level security;
alter table competition_entries enable row level security;
alter table routines            enable row level security;
alter table teams               enable row level security;
alter table team_members        enable row level security;
alter table team_rules          enable row level security;

-- ── エントリー操作を原子的に行う関数 ───────────────────
-- 参加者を追加した時点で、その選手のカテゴリの全種目分 routines を空で自動生成する。
create or replace function add_entry(p_competition uuid, p_athlete uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into competition_entries (competition_id, athlete_id)
  values (p_competition, p_athlete)
  on conflict do nothing;

  insert into routines (competition_id, athlete_id, apparatus_id)
  select p_competition, p_athlete, a.id
  from apparatuses a
  join athletes ath on ath.id = p_athlete
  where a.category = ath.category
  on conflict (competition_id, athlete_id, apparatus_id) do nothing;
end;
$$;

-- 参加者を外す。入力済み (d または e が入っている) の routines は保全し、空の行のみ削除する。
create or replace function remove_entry(p_competition uuid, p_athlete uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from routines
  where competition_id = p_competition
    and athlete_id = p_athlete
    and d_score is null
    and e_score is null;

  delete from competition_entries
  where competition_id = p_competition
    and athlete_id = p_athlete;
end;
$$;

-- ── 集計入力用ビュー ───────────────────────────────────
-- numeric 列を text にキャストして返す (アプリ側で誤差なくミリ整数化するため)。
create view v_routines as
select
  r.id,
  r.competition_id,
  r.athlete_id,
  r.apparatus_id,
  a.code            as apparatus_code,
  a.name_ja         as apparatus_name,
  a.category        as category,
  a.sort_order      as apparatus_sort_order,
  r.d_score::text   as d_score,
  r.e_score::text   as e_score,
  r.nd::text        as nd,
  r.sb::text        as sb,
  r.d_updated_at,
  r.e_updated_at
from routines r
join apparatuses a on a.id = r.apparatus_id;
