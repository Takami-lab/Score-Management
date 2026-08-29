-- 種目表記: 「床」→「ゆか」（男女とも FX）
-- name_ja の表示文字列のみ変更。code は FX のまま、既存データは保持。
update apparatuses set name_ja = 'ゆか' where code = 'FX' and name_ja = '床';
