-- 選手が D だけでなく E / SB まで入力できるステータス 'open_de' を追加する。
-- 既存ステータスの値・意味は変更しない。CHECK 制約を広げるだけで、データは一切触らない。

do $$
declare c record;
begin
  -- 列定義から自動生成された status の CHECK 制約を名前に依存せず探して差し替える
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.competitions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table competitions drop constraint %I', c.conname);
  end loop;
end $$;

alter table competitions
  add constraint competitions_status_check
  check (status in ('draft','open','locked','finalized','open_de'));
