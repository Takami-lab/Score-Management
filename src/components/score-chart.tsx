"use client";
import * as React from "react";
import { fromMilli, type Milli } from "@/lib/scoring/milli";

export interface ChartPoint {
  /** X 軸ラベル (例 "09/12") */
  label: string;
  /** ツールチップ等に出す名称 */
  title: string;
  value: Milli | null;
  /** false なら白抜きの点にして「参考値」であることを示す */
  complete: boolean;
  /** 点を選んだときに出す補足 (例 "4/6種目") */
  note?: string;
}

const H = 240;
const PAD = { top: 16, right: 14, bottom: 40, left: 46 };

/** 依存ライブラリ無しの折れ線グラフ。値はミリ整数。 */
export function ScoreChart({
  points,
  places = 3,
  emptyMessage = "確定済みの記録がまだありません。",
}: {
  points: ChartPoint[];
  places?: number;
  emptyMessage?: string;
}) {
  const [selected, setSelected] = React.useState<number | null>(null);

  const withValue = points.filter((p) => p.value !== null);
  if (withValue.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--color-muted)]">
        {emptyMessage}
      </p>
    );
  }

  // Y 軸レンジ (少し余白を持たせてキリのよい値に丸める)
  const vals = withValue.map((p) => p.value as number);
  const rawMin = Math.min(...vals);
  const rawMax = Math.max(...vals);
  const span = Math.max(rawMax - rawMin, 1000); // 最低 1.000 の幅
  const step = niceStep(span / 4);
  const yMin = Math.floor((rawMin - span * 0.15) / step) * step;
  const yMax = Math.ceil((rawMax + span * 0.15) / step) * step;
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1; v += step) ticks.push(v);

  // 点が多いときは横スクロールできるよう幅を確保
  const W = Math.max(320, PAD.left + PAD.right + (points.length - 1) * 64 + 40);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (points.length === 1 ? plotW / 2 : (plotW * i) / (points.length - 1));
  const y = (v: number) => PAD.top + plotH * (1 - (v - yMin) / (yMax - yMin));

  // 値のある点だけを結ぶ
  const path = points
    .map((p, i) => (p.value === null ? null : { i, v: p.value }))
    .filter((p): p is { i: number; v: number } => p !== null)
    .map((p, n) => `${n === 0 ? "M" : "L"} ${x(p.i)} ${y(p.v)}`)
    .join(" ");

  const sel = selected !== null ? points[selected] : null;

  return (
    <div>
      <div className="w-full min-w-0 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          role="img"
          aria-label="得点推移グラフ"
          className="max-w-full"
          style={{ minWidth: W }}
        >
          {/* 横グリッド + Y 軸ラベル */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-border)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y(t) + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--color-muted)"
              >
                {fromMilli(t, places === 3 ? 1 : places)}
              </text>
            </g>
          ))}

          {/* 折れ線 */}
          <path
            d={path}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* 点 + X 軸ラベル */}
          {points.map((p, i) => (
            <g key={i}>
              {p.value !== null && (
                <circle
                  cx={x(i)}
                  cy={y(p.value)}
                  r={selected === i ? 7 : 5}
                  fill={p.complete ? "var(--color-primary)" : "var(--color-surface)"}
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                />
              )}
              {/* タップ領域 */}
              <rect
                x={x(i) - 22}
                y={PAD.top}
                width={44}
                height={plotH}
                fill="transparent"
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(selected === i ? null : i)}
              />
              <text
                x={x(i)}
                y={H - PAD.bottom + 16}
                textAnchor="middle"
                fontSize={11}
                fill={
                  selected === i ? "var(--color-foreground)" : "var(--color-muted)"
                }
                fontWeight={selected === i ? 600 : 400}
              >
                {p.label}
              </text>
              {p.value !== null && (
                <text
                  x={x(i)}
                  y={H - PAD.bottom + 30}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--color-muted)"
                >
                  {fromMilli(p.value, places)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* 選択した点の詳細 */}
      <div className="mt-2 min-h-[3.25rem] rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
        {sel ? (
          <>
            <div className="font-medium">{sel.title}</div>
            <div className="text-[var(--color-muted)] text-xs mt-0.5">
              {sel.value === null ? "記録なし" : fromMilli(sel.value, places)}
              {sel.note ? ` ・ ${sel.note}` : ""}
              {!sel.complete && sel.value !== null && "（参考値）"}
            </div>
          </>
        ) : (
          <span className="text-[var(--color-muted)] text-xs">
            グラフの点をタップすると試技会名と内訳が表示されます。
          </span>
        )}
      </div>

      <p className="mt-1.5 text-xs text-[var(--color-muted)]">
        <span className="inline-block size-2.5 rounded-full bg-[var(--color-primary)] align-middle" />{" "}
        全種目そろった記録
        <span className="inline-block size-2.5 rounded-full border-2 border-[var(--color-primary)] bg-[var(--color-surface)] align-middle" />{" "}
        一部のみの参考値
      </p>
    </div>
  );
}

/** 1 / 2 / 2.5 / 5 の系列でキリのよい目盛り幅を選ぶ (ミリ単位)。 */
function niceStep(raw: number): number {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (pow * m >= raw) return pow * m;
  }
  return pow * 10;
}

export function chartLabel(heldOn: string): string {
  return heldOn.slice(5).replace("-", "/");
}
