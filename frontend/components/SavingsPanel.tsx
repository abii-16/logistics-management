"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FarmerOrder, SavingsPoint } from "@/types";
import { FarmerSavingsTable } from "@/components/FarmerSavingsTable";
import { FarmerSavingsDetail } from "@/components/FarmerSavingsDetail";

export function SavingsPanel({ orders, trend }: { orders: FarmerOrder[]; trend: SavingsPoint[] }) {
  const [selectedOrder, setSelectedOrder] = useState<FarmerOrder | null>(null);

  const individual = orders.reduce((sum, order) => sum + order.individualCost, 0);
  const shared = orders.reduce((sum, order) => sum + order.sharedCost, 0);
  const savings = individual - shared;

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
      <h2 className="text-lg font-bold text-soil">Savings Dashboard</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-sm text-stone-500">Individual Cost</p>
          <p className="text-2xl font-bold text-soil">Rs {individual.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-sm text-stone-500">Shared Cost</p>
          <p className="text-2xl font-bold text-field">Rs {shared.toLocaleString("en-IN")}</p>
        </div>
        <div>
          <p className="text-sm text-stone-500">Total Savings</p>
          <p className="text-2xl font-bold text-chilli">Rs {savings.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="mt-5 h-52">
        <ResponsiveContainer height="100%" width="100%">
          <AreaChart data={trend}>
            <XAxis dataKey="label" tickLine={false} />
            <YAxis tickLine={false} width={44} />
            <Tooltip formatter={(value) => [`Rs ${Number(value).toLocaleString("en-IN")}`, "Savings"]} />
            <Area dataKey="value" fill="#4f7d5a33" stroke="#4f7d5a" strokeWidth={2} type="monotone" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 border-t border-stone-200 pt-5">
        <h3 className="text-base font-bold text-soil">Farmer-wise Savings</h3>
        <p className="mt-1 text-sm text-stone-500">
          {selectedOrder
            ? "Cost breakdown for this farmer."
            : "Tap a farmer to see their full cost breakdown."}
        </p>
        {selectedOrder ? (
          <FarmerSavingsDetail order={selectedOrder} onBack={() => setSelectedOrder(null)} />
        ) : (
          <FarmerSavingsTable orders={orders} onSelect={setSelectedOrder} />
        )}
      </div>
    </section>
  );
}
