import type { FarmerOrder } from "@/types";

const VILLAGE_COORDS: Record<string, { x: number; y: number }> = {
  melma: { x: 90, y: 95 },
  athur: { x: 185, y: 80 },
  sevoor: { x: 145, y: 165 },
  thiruvetriyur: { x: 260, y: 180 },
  default: { x: 200, y: 120 }
};

const getCoords = (villageName: string) => {
  const norm = (villageName || "").toLowerCase().trim();
  if (norm === "melma") return VILLAGE_COORDS.melma;
  if (norm === "athur") return VILLAGE_COORDS.athur;
  if (norm === "sevoor") return VILLAGE_COORDS.sevoor;
  if (norm === "thiruvetriyur") return VILLAGE_COORDS.thiruvetriyur;

  // Hash fallback
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = norm.charCodeAt(i) + ((hash << 5) - hash);
  }
  const x = 50 + Math.abs(hash % 200);
  const y = 50 + Math.abs((hash >> 8) % 150);
  return { x, y };
};

export function TacticalMap({ orders }: { orders: FarmerOrder[] }) {
  try {
    if (!orders) {
      return (
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel min-h-[352px] flex flex-col justify-center items-center">
          <h2 className="text-lg font-bold text-soil mb-4 self-start">Cluster Visualization</h2>
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soil" />
            <p className="text-xs text-stone-500 font-medium animate-pulse">Loading spatial route data...</p>
          </div>
        </section>
      );
    }

    if (orders.length === 0) {
      return (
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold text-soil">Cluster Visualization</h2>
          <div className="relative mt-4 h-72 w-full rounded-lg bg-[#eef3e9] flex flex-col items-center justify-center border border-dashed border-stone-300">
            <p className="text-xs text-stone-500 font-bold uppercase tracking-wider">No Active Farmer Bookings</p>
            <p className="text-[10px] text-stone-400 mt-1 max-w-[220px] text-center leading-normal">
              Ready to visualize cooperative dispatch clusters once orders are received.
            </p>
          </div>
        </section>
      );
    }

    // Dynamic points calculation
    const farmerPoints = orders.map((order) => {
      const coords = getCoords(order.village);
      return {
        ...coords,
        label: order.village || "Melma",
        farmer: order.farmerName
      };
    });

    const mandiPoint = { x: 320, y: 130, label: "Koyambedu Mandi" };

    // Calculate cluster center
    let avgX = 140;
    let avgY = 110;
    let radius = 60;
    if (farmerPoints.length > 0) {
      const sumX = farmerPoints.reduce((sum, p) => sum + p.x, 0);
      const sumY = farmerPoints.reduce((sum, p) => sum + p.y, 0);
      avgX = sumX / farmerPoints.length;
      avgY = sumY / farmerPoints.length;

      let maxDist = 30;
      farmerPoints.forEach((p) => {
        const dist = Math.sqrt(Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2));
        if (dist > maxDist) maxDist = dist;
      });
      radius = Math.min(95, maxDist + 20); // cap max radius
    }

    return (
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel animate-fadeIn">
        <h2 className="text-lg font-bold text-soil">Cluster Visualization</h2>
        <svg className="mt-4 h-72 w-full rounded-lg bg-[#eef3e9]" viewBox="0 0 390 240" role="img" aria-label="Cluster map">
          {/* Active routes from dynamic farmer points to Mandi */}
          {farmerPoints.map((pt, i) => (
            <path
              key={`route-${pt.label}-${i}`}
              d={`M ${pt.x} ${pt.y} Q ${(pt.x + mandiPoint.x) / 2} ${(pt.y + mandiPoint.y) / 2 - 20} ${mandiPoint.x} ${mandiPoint.y}`}
              fill="none"
              stroke="#2f7f8f"
              strokeWidth="2.5"
              strokeDasharray="5 5"
              className="opacity-70"
            />
          ))}

          {/* Translucent Cluster Zone Boundary */}
          {farmerPoints.length > 0 && (
            <circle
              cx={avgX}
              cy={avgY}
              fill="#4f7d5a15"
              r={radius}
              stroke="#4f7d5a"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          )}

          {/* Farmer Location Nodes */}
          {farmerPoints.map((point, index) => (
            <g key={`farmer-pt-${point.label}-${index}`}>
              <circle cx={point.x} cy={point.y} fill="#4f7d5a" r={8} stroke="#ffffff" strokeWidth="1.5" />
              <text fill="#312a24" fontSize="10" fontWeight="700" x={point.x + 10} y={point.y + 4}>
                {point.label}
              </text>
            </g>
          ))}

          {/* Mandi Node */}
          <g>
            <circle cx={mandiPoint.x} cy={mandiPoint.y} fill="#d44d3d" r={10} stroke="#ffffff" strokeWidth="2" />
            <text fill="#312a24" fontSize="10" fontWeight="800" x={mandiPoint.x - 40} y={mandiPoint.y - 12}>
              {mandiPoint.label}
            </text>
          </g>

          {/* Dispatch Truck Symbol moving along route */}
          {farmerPoints.length > 0 && (
            <g transform={`translate(${(avgX + mandiPoint.x) / 2 - 12}, ${(avgY + mandiPoint.y) / 2 - 12})`}>
              <rect fill="#f6b44b" height="12" rx="3" width="20" />
              <circle cx="5" cy="12" fill="#312a24" r="2.5" />
              <circle cx="15" cy="12" fill="#312a24" r="2.5" />
            </g>
          )}
        </svg>
      </section>
    );
  } catch (err) {
    console.error("Map rendering crash:", err);
    return (
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
        <h2 className="text-lg font-bold text-soil">Cluster Visualization</h2>
        <div className="relative mt-4 h-72 w-full rounded-lg bg-red-50 flex flex-col items-center justify-center border border-red-200">
          <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Map Render Failure</p>
          <p className="text-[10px] text-red-400 mt-1 max-w-[220px] text-center leading-normal">
            An error occurred while compiling spatial coordinates.
          </p>
        </div>
      </section>
    );
  }
}
