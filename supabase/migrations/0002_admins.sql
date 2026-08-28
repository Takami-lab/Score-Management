-- 管理者も選手と同様「名簿から選択」方式でログインする。
-- 認証は全員共通の合言葉パスワード (アプリ側の ADMIN_SHARED_PASSWORD / 既定 09548)。
-- Supabase Auth は使用しない。

create table admins (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table admins enable row level security;
