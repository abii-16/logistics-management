import type { FarmerOrder } from "@/types";

export function FarmerSavingsTable({
  orders,
  onSelect,
}: {
  orders: FarmerOrder[];
  onSelect: (order: FarmerOrder) => void;
}) {
  if (orders.length === 0) {
    return <p className="mt-4 text-sm text-stone-500">No orders yet.</p>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="text-stone-500">
          <tr>
            <th className="py-2">Farmer</th>
            <th>Weight</th>
            <th>Individual Cost</th>
            <th>Bundled Cost</th>
            <th>You Save</th>
            <th>Saving %</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const savings = order.individualCost - order.sharedCost;
            const savingsPercent =
              order.individualCost > 0
                ? (savings / order.individualCost) * 100
                : 0;
            return (
              <tr
                className="cursor-pointer border-t border-stone-200 hover:bg-stone-50"
                key={order.id}
                onClick={() => onSelect(order)}
              >
                <td className="py-3 font-semibold text-soil">{order.farmerName}</td>
                <td>{order.weightKg} kg</td>
                <td className="text-stone-500 line-through decoration-stone-300">
                  Rs {order.individualCost.toLocaleString("en-IN")}
                </td>
                <td className="font-semibold text-field">
                  Rs {order.sharedCost.toLocaleString("en-IN")}
                </td>
                <td className="font-semibold text-chilli">
                  Rs {savings.toLocaleString("en-IN")}
                </td>
                <td>
                  <span className="inline-flex items-center rounded-full bg-field/10 px-2 py-0.5 text-xs font-semibold text-field">
                    {savingsPercent.toFixed(0)}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
