export type Category = "MAG" | "WAG";
export type CompetitionStatus = "draft" | "open" | "locked" | "finalized";

export const CATEGORY_LABEL: Record<Category, string> = {
  MAG: "男子",
  WAG: "女子",
};

export const STATUS_LABEL: Record<CompetitionStatus, string> = {
  draft: "設定中",
  open: "D入力受付中",
  locked: "D入力締切",
  finalized: "確定",
};

export const STATUS_ORDER: CompetitionStatus[] = [
  "draft",
  "open",
  "locked",
  "finalized",
];

export interface Athlete {
  id: string;
  last_name: string;
  first_name: string;
  kana: string | null;
  category: Category;
  affiliation: string | null;
  birth_mmdd: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Apparatus {
  id: number;
  code: string;
  name_ja: string;
  category: Category;
  sort_order: number;
}

export interface Competition {
  id: string;
  name: string;
  held_on: string;
  venue: string | null;
  status: CompetitionStatus;
  created_at: string;
}

export interface Team {
  id: string;
  competition_id: string;
  name: string;
  category: Category;
}

export interface TeamRuleRow {
  category: Category;
  team_size: number;
  counting_count: number;
}

/** v_routines ビューの行 (numeric は text) */
export interface RoutineViewRow {
  id: string;
  competition_id: string;
  athlete_id: string;
  apparatus_id: number;
  apparatus_code: string;
  apparatus_name: string;
  category: Category;
  apparatus_sort_order: number;
  d_score: string | null;
  e_score: string | null;
  nd: string | null;
  sb: string | null;
  d_updated_at: string | null;
  e_updated_at: string | null;
}

export function athleteLabel(a: Pick<Athlete, "last_name" | "first_name" | "affiliation">): string {
  return a.affiliation
    ? `${a.last_name} ${a.first_name}（${a.affiliation}）`
    : `${a.last_name} ${a.first_name}`;
}
