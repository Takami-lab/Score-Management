"use client";
import { useRouter } from "next/navigation";
import { Select, Label } from "@/components/ui";

/** 選択すると即その URL へ遷移するセレクタ。 */
export function ProgressPicker({
  label,
  name,
  value,
  options,
  buildHref,
}: {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string; group?: string }[];
  buildHref: (value: string) => string;
}) {
  const router = useRouter();
  const groups = [...new Set(options.map((o) => o.group ?? ""))];

  return (
    <div className="max-w-sm">
      <Label htmlFor={name}>{label}</Label>
      <Select
        id={name}
        name={name}
        value={value}
        onChange={(e) => router.push(buildHref(e.target.value))}
      >
        <option value="">選択してください</option>
        {groups.map((g) =>
          g === "" ? (
            options
              .filter((o) => !o.group)
              .map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
          ) : (
            <optgroup key={g} label={g}>
              {options
                .filter((o) => o.group === g)
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </optgroup>
          ),
        )}
      </Select>
    </div>
  );
}
