import { ArrowLeft, IndianRupee, Package } from "lucide-react";
import type { FarmerOrder } from "@/types";

export function FarmerSavingsDetail({
  order,
  onBack,
}: {
  order: FarmerOrder;
  onBack: () => void;
}) {
  const savings = order.individualCost - order.sharedCost;
  const savingsPercent =
    order.individualCost > 0 ? (savings / order.individualCost) * 100 : 0;

  return (
    <div className="mt-4">
      <button
        className="focus-ring mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-river"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        Back to farmer savings
      </button>

      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-field/10 text-sm font-bold text-field">
          {order.farmerName
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")}
        </span>
        <div>
          <p className="text-lg font-bold text-soil">{order.farmerName}</p>
          <p className="text-sm text-stone-500">
            {order.village} &middot; {order.crop}
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-stone-50">
        <Row icon={Package} label="Load" value={`${order.weightKg} kg`} />
        <Row
          icon={IndianRupee}
          label="Individual Cost"
          value={`Rs ${order.individualCost.toLocaleString("en-IN")}`}
          valueClassName="text-stone-500 line-through decoration-stone-300"
        />
        <Row
          icon={IndianRupee}
          label="Bundled Cost"
          value={`Rs ${order.sharedCost.toLocaleString("en-IN")}`}
          valueClassName="font-bold text-field"
        />
        <Row
          icon={IndianRupee}
          label="You Save"
          value={`Rs ${savings.toLocaleString("en-IN")} (${savingsPercent.toFixed(0)}%)`}
          valueClassName="font-bold text-chilli"
        />
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  valueClassName = "font-semibold text-soil",
}: {
  icon: typeof Package;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3">
      <span className="inline-flex items-center gap-2 text-sm text-stone-600">
        <Icon size={16} />
        {label}
      </span>
      <strong className={valueClassName}>{value}</strong>
    </div>
  );
}
