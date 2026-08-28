# デプロイ手順（GitHub + Vercel + Supabase クラウド）

スマホ・他端末からアクセスできるよう公開する。以後は **`git push` するだけで Vercel が自動再デプロイ**。

```
[ローカル修正] --git push--> [GitHub(private)] --自動--> [Vercel 本番/プレビュー]
                                                            |
                                              [Supabase クラウド(Postgres)]
```

---

## 0. 必要なアカウント（各自で作成）

- GitHub … https://github.com
- Vercel … https://vercel.com （GitHub アカウントでサインアップ可）
- Supabase … https://supabase.com

---

## 1. Supabase 本番プロジェクトを作る（あなた）

1. https://supabase.com/dashboard → **New project**
   - Region: **Northeast Asia (Tokyo)**
   - Database Password を**控える**（後で使う）
2. 作成後、以下を控える：
   - **Project Settings → API**
     - `Project URL`（例 `https://xxxx.supabase.co`）
     - `service_role` の secret（`Reveal` して全文コピー。**絶対に公開しない**）
   - **Project Settings → General**
     - `Reference ID`（`xxxx` の部分）

この3つ（+ DB パスワード）をこちらに渡してください。以降のスキーマ適用・シード・初期管理者作成はこちらで行います。

---

## 2. スキーマとシードを本番 DB へ適用（こちらで実施）

```bash
npx supabase login                       # ← ブラウザ認証だけあなたが実施
npx supabase link --project-ref <ref>    # DB パスワード入力
npx supabase db push                     # supabase/migrations/*.sql を本番へ
```

シード（種目マスタ・団体ルール・初期管理者「管理者」）は `db push` では流れないため、
`supabase/seed.sql` の内容を **Supabase Studio → SQL Editor** で実行（またはこちらで `psql` 実行）。

---

## 3. GitHub リポジトリ（private）

```bash
gh auth login        # ← ブラウザ認証だけあなたが実施（GitHub.com / HTTPS / ブラウザ）
```

その後こちらで：

```bash
gh repo create shigikai-kanri --private --source=. --remote=origin --push
```

---

## 4. Vercel

```bash
vercel login         # ← ブラウザ認証だけあなたが実施
```

その後こちらで：

```bash
vercel link                                    # プロジェクト作成/紐付け
vercel env add SUPABASE_URL production          # 値: Supabase Project URL
vercel env add SUPABASE_SERVICE_ROLE_KEY production   # 値: service_role secret
vercel env add ADMIN_SHARED_PASSWORD production  # 値: 推測されにくい文字列（下記注意）
vercel git connect                              # GitHub 連携（push で自動デプロイ）
vercel --prod                                   # 初回本番デプロイ
```

デプロイ完了で `https://shigikai-kanri.vercel.app` のような URL が発行される。これを関係者に共有。

---

## 5. 以後の修正フロー

| 変更内容 | 手順 |
|---|---|
| 画面・ロジック修正 | `git push` → Vercel が本番へ自動デプロイ。ブランチ/PR は自動でプレビュー URL |
| DB スキーマ変更 | `supabase/migrations/` に新しい連番 SQL を追加 → ローカルで `npx supabase db reset` で確認 → `npx supabase db push` で本番反映 |
| 環境変数の変更 | `vercel env` または Vercel ダッシュボード → 変更後は再デプロイ |

ローカル開発（Docker + `npx supabase start`）はこれまでどおり。ローカルと本番で
`.env.local` / Vercel 環境変数 が切り替わる。

---

## セキュリティ上の注意

- **選手側は認証なし**の設計。公開 URL を知っている人は誰でも選手名を選んで D スコアを入力できる。
- 本番の `ADMIN_SHARED_PASSWORD` は `09548` のままにせず、**推測されにくい文字列**にすること（ローカルは `09548` のままで可）。
- URL は関係者だけに共有する。より厳密にしたい場合は Vercel の Deployment Protection（Pro プラン）も検討。
- `.env.local` と `service_role` キーは Git にコミットしない（`.gitignore` 済み）。
