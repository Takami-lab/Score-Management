-- 団体の得点推移のため、試技会をまたいで同一チームを識別する「チーム台帳」を追加する。
-- 既存データは一切削除・変更しない (テーブル追加 + NULL 許容カラム追加 + 紐付けのバックフィルのみ)。

create table team_profiles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null check (category in ('MAG','WAG')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (name, category)
);

alter table team_profiles enable row level security;

-- 試技会ごとの teams から台帳を参照する。既存行のために NULL 許容。
alter table teams add column team_profile_id uuid references team_profiles(id);

create index teams_team_profile_idx on teams (team_profile_id);

-- 既存チームを (name, category) で台帳へ登録し、紐付ける。
insert into team_profiles (name, category)
select distinct t.name, t.category
from teams t
on conflict (name, category) do nothing;

update teams t
set team_profile_id = p.id
from team_profiles p
where t.team_profile_id is null
  and p.name = t.name
  and p.category = t.category;
