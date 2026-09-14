import type { Bid } from "@/types";
import { StatusPill } from "@/components/StatusPill";

export function AuctionPanel({ bids }: { bids: Bid[] }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
      <h2 className="text-lg font-bold text-soil">Live Driver Bidding</h2>
      <div className="mt-4 space-y-3">
        {bids.map((bid) => (
          <div className="grid gap-3 rounded-lg border border-stone-200 p-3 sm:grid-cols-[1fr_1fr_auto]" key={bid.id}>
            <div>
              <p className="font-bold text-soil">{bid.driverName}</p>
              <p className="text-sm text-stone-600">{bid.vehicle}</p>
            </div>
            <div>
              <p className="text-sm text-stone-500">Bid / Reliability</p>
              <p className="font-bold">Rs {bid.amount.toLocaleString("en-IN")} / {bid.reliabilityScore}%</p>
            </div>
            <StatusPill status={bid.status} />
          </div>
        ))}
      </div>
    </section>
  );
}

