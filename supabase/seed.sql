-- シードデータ: 種目マスタ + 団体ルール
-- 跳馬 (VT) は男女で別レコード。混線させないこと。

insert into apparatuses (code, name_ja, category, sort_order) values
  -- 男子 (MAG)
  ('FX', '床',      'MAG', 1),
  ('PH', 'あん馬',  'MAG', 2),
  ('SR', 'つり輪',  'MAG', 3),
  ('VT', '跳馬',    'MAG', 4),
  ('PB', '平行棒',  'MAG', 5),
  ('HB', '鉄棒',    'MAG', 6),
  -- 女子 (WAG)
  ('VT', '跳馬',          'WAG', 1),
  ('UB', '段違い平行棒',  'WAG', 2),
  ('BB', '平均台',        'WAG', 3),
  ('FX', '床',            'WAG', 4)
on conflict (code, category) do nothing;

insert into team_rules (category, team_size, counting_count) values
  ('MAG', 6, 5),
  ('WAG', 4, 3)
on conflict (category) do update
  set team_size = excluded.team_size,
      counting_count = excluded.counting_count;

-- 初期管理者 (ログイン用。必要に応じて管理画面で追加・無効化する)
insert into admins (name) values ('管理者')
on conflict do nothing;
