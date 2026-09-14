"use client";
import { useRouter } from "next/navigation";
import { Select, Label } from "@/components/ui";

/**
 * 選択すると即その URL へ遷移するセレクタ。
 * 遷移先は `hrefPrefix + 選択値`（関数は Server Component から渡せないため）。
 */
export function ProgressPicker({
  label,
  name,
  value,
  options,
  hrefPrefix,
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string; group?: string }[];
  hrefPrefix: string;
}) {
  const router = useRouter();
  const grouped = options.filter((o) => o.group);
  const ungrouped = options.filter((o) => !o.group);
  const groups = [...new Set(grouped.map((o) => o.group as string))];

  return (
    <div className="max-w-sm">
      <Label htmlFor={name}>{label}</Label>
      <Select
        id={name}
        name={name}
        value={value}
        onChange={(e) => {
          if (e.target.value) router.push(hrefPrefix + e.target.value);
        }}
      >
        <option value="">選択してください</option>
        {ungrouped.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {groups.map((g) => (
          <optgroup key={g} label={g}>
            {grouped
              .filter((o) => o.group === g)
              .map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
          </optgroup>
        ))}
      </Select>
    </div>
  );
}
