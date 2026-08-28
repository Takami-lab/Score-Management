# 試技会スコア管理システム

体操競技の試技会でスコア（D / E / ND / SB）を記録し、個人総合・種目別・団体の順位を算出・CSV 出力する Web アプリ。

- **管理者**: 試技会の作成・参加者設定・ステータス管理・E/ND/SB 入力・団体編成・全結果閲覧
- **選手**: 名簿から自分を選んでログイン → 自分の D スコア入力・全結果閲覧
- 管理者・選手とも「名簿から選択」してログイン。管理者は共通パスワード（既定 `09548`）を併用。

## 技術スタック

Next.js 16 (App Router) / TypeScript / Tailwind CSS v4 / Supabase (PostgreSQL) / Vitest

### 設計上の制約

- DB アクセスは**すべてサーバー側**（Server Components / Server Actions / Route Handler）から `service_role` キーで行う
- 全テーブルで **RLS 有効・ポリシー無し**（= service role 以外は全操作拒否）。anon キーはクライアントに配布しない
- スコア計算は整数ミリポイント（値 ×1000）で行い浮動小数点誤差を排除。純関数 `src/lib/scoring/*` にまとめ Vitest でテスト
- タイムゾーンは Asia/Tokyo 固定

## セットアップ

### 前提

- Node.js 20+
- Docker Desktop（`supabase start` に必要）

### 手順

```bash
npm install

# ローカル Supabase を起動（初回は数分）
npx supabase start
```

`supabase start` の出力に表示される `API URL` / `service_role key` を
`.env.local` にコピーする（既定のデモキーと一致する場合は変更不要）。

```bash
# マイグレーション + シード（種目マスタ・団体ルール・初期管理者「管理者」）を適用
npx supabase db reset

# 開発サーバー
npm run dev
```

- 管理者: http://localhost:3000/admin/login （一覧から選択 + 共通パスワード。既定 `09548`、`ADMIN_SHARED_PASSWORD` で変更可）
- 選手: http://localhost:3000/athlete/login （先に管理者が選手を名簿登録し、試技会を `open` にする必要あり）
- Supabase Studio: http://localhost:54323

管理者の追加・無効化は管理画面の「管理者」タブから行える（初期管理者「管理者」でログイン後）。

### テスト

```bash
npm test        # scoring / aggregate の20ケース
```

必須網羅ケース（仕様 §9）: 未入力種目が混在する個人総合 / 確定人数不足の団体スコア / 同点順位 (1,1,3) / MAG 6-6-5・WAG 4-4-3。

## 運用フロー

| フェーズ | 操作 | ステータス |
|---|---|---|
| 試技会前 | 管理者が試技会と参加者を設定 | `draft` |
| 試技会後 | 選手が D スコアを入力（何度でも修正可） | `open` |
| 試技会後 | 管理者が E / ND / SB を入力 | `open` → `locked` |
| 確定 | 順位の「暫定」表示が外れる | `finalized` |

- E スコアが入力された種目から逐次、結果・順位に反映される（公開スイッチなし）
- ステータスは前後どちらへも変更可能

## ディレクトリ

```
src/
  app/
    admin/(app)/...            管理者画面（middleware/proxy + layout で保護）
    athlete/(app)/...          選手画面
    api/csv/[competitionId]/   CSV エクスポート（UTF-8 BOM）
  lib/
    scoring/                   純関数（最終スコア・個人総合・団体・順位）+ テスト
    aggregate.ts               カテゴリ別集計（純関数）+ テスト
    db/queries.ts, results.ts  サーバー専用の読み取り
    actions/                   Server Actions（変異）
    auth/                      admin / athlete いずれも「名簿選択 + Cookie」方式 / guards
  proxy.ts                     /admin/* の Cookie チェック
supabase/
  migrations/0001_init.sql, 0002_admins.sql
  seed.sql
```

## スコープ外

推移グラフ / D スコア自動算出 / 審判複数採点 / 外部公開画面 / リアルタイム同期 / 同一種目複数本 / 出場種目の個別指定。
