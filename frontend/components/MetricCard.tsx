import type { LucideIcon } from "lucide-react";

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-panel">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-field/10 text-field">
          <Icon size={20} />
        </span>
        <div>
          <p className="text-sm text-stone-500">{label}</p>
          <p className="text-2xl font-bold text-soil">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-stone-600">{detail}</p>
    </div>
  );
}

