"use client";

import { useEffect, useState } from "react";
import { Bot, IndianRupee, Package, UsersRound, AlertTriangle, Edit2, X, PhoneCall, Laptop } from "lucide-react";
import { api } from "@/services/api";
import { AuctionPanel } from "@/components/AuctionPanel";
import { MetricCard } from "@/components/MetricCard";
import { RecommendationCard } from "@/components/RecommendationCard";
import { SavingsPanel } from "@/components/SavingsPanel";
import { TacticalMap } from "@/components/TacticalMap";
import { StatusPill } from "@/components/StatusPill";

export function AdminDashboard() {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit form states
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    farmerName: "",
    phone: "",
    village: "",
    crop: "",
    weightKg: 0
  });

  // FEATURE 4: Live Operations Timeline State
  const [timelineEvents, setTimelineEvents] = useState<any[]>([
    { id: "init-5", time: "09:20 AM", title: "Booking Confirmed", details: "Booking KB1023 verified by Admin", status: "success" },
    { id: "init-4", time: "09:17 AM", title: "Driver Assigned", details: "Kannan assigned to Vehicle TN 11 AB 4472", status: "info" },
    { id: "init-3", time: "09:14 AM", title: "Bundle Generated", details: "Cooperative logistics bundle generated (1250 kg)", status: "warning" },
    { id: "init-2", time: "09:13 AM", title: "AI Extraction Complete", details: "Gemini successfully parsed audio transcript", status: "success" },
    { id: "init-1", time: "09:12 AM", title: "Farmer Call Received", details: "Incoming helpline call from Arumugam", status: "call" },
  ]);

  const [prevOrdersCount, setPrevOrdersCount] = useState<number>(0);

  async function loadSnapshot() {
    try {
      const data = await api.getAdminSnapshot();
      setSnapshot(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSnapshot();
  }, []);

  // Prepend live events when new orders arrive
  useEffect(() => {
    if (snapshot?.orders && snapshot.orders.length > 0) {
      const currentOrders = snapshot.orders;
      if (prevOrdersCount > 0 && currentOrders.length > prevOrdersCount) {
        // Find the new order (usually the first one in the list since they are sorted desc)
        const newOrder = currentOrders[0];
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const callTime = new Date(now.getTime() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const extractionTime = new Date(now.getTime() - 30000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const newEvents = [
          {
            id: `evt-${newOrder.id}-3`,
            time: timeStr,
            title: "Booking Confirmed",
            details: `Booking ${newOrder.id} successfully saved (${newOrder.weight_kg || newOrder.weightKg || 400} kg ${newOrder.crop || 'Tomato'})`,
            status: "success"
          },
          {
            id: `evt-${newOrder.id}-2`,
            time: extractionTime,
            title: "AI Extraction Complete",
            details: `Confidence score: ${newOrder.review_required || newOrder.reviewRequired ? "Needs Review" : "Verified"} for ${newOrder.farmer_name || newOrder.farmerName || 'Farmer'}`,
            status: newOrder.review_required || newOrder.reviewRequired ? "danger" : "success"
          },
          {
            id: `evt-${newOrder.id}-1`,
            time: callTime,
            title: "Farmer Call Received",
            details: `Incoming helpline call from ${newOrder.farmer_name || newOrder.farmerName || 'Farmer'} (${newOrder.village || 'Melma'})`,
            status: "call"
          }
        ];

        setTimelineEvents((prev) => [...newEvents, ...prev]);
      }
      setPrevOrdersCount(currentOrders.length);
    }
  }, [snapshot?.orders]);

  function handleStartEdit(order: any) {
    setEditingOrder(order);
    setEditForm({
      farmerName: order.farmerName,
      phone: order.phone,
      village: order.village,
      crop: order.crop,
      weightKg: order.weightKg
    });
  }

  async function handleSaveEdit() {
    if (!editingOrder) return;
    try {
      const updated = await api.updateBooking(editingOrder.id, editForm);
      if (updated) {
        setEditingOrder(null);
        await loadSnapshot();
      }
    } catch (err) {
      console.error("Error saving booking edit:", err);
    }
  }

  if (loading) {
    return <p className="text-sm text-stone-500 py-10 text-center">Loading admin snapshot...</p>;
  }

  if (!snapshot) {
    return <p className="text-sm text-red-500 py-10 text-center">Failed to load admin snapshot.</p>;
  }

  const { orders = [], bids = [], extraction, recommendation, savingsTrend } = snapshot;

  const totalWeight = orders.reduce((sum: number, order: any) => sum + order.weightKg, 0);
  const totalSavings = orders.reduce((sum: number, order: any) => sum + order.individualCost - order.sharedCost, 0);

  // Low confidence manual review orders
  const reviewOrders = orders.filter((o: any) => o.reviewRequired);

  // FEATURE 1: Dynamic AI Trust Score calculations
  const extConfidence = extraction?.confidence || { farmer_name: 94, village: 92, crop: 98, weight: 97 };
  const confValues = Object.values(extConfidence).map(v => Number(v));
  const avgTrustScore = confValues.length > 0
    ? Math.round(confValues.reduce((a, b) => a + b, 0) / confValues.length)
    : 95;

  const trustColor = avgTrustScore >= 90
    ? "text-stone-800 bg-[#f7fbf7] border-field/30"
    : avgTrustScore >= 70
      ? "text-stone-800 bg-[#fffcf5] border-harvest/30"
      : "text-stone-850 bg-[#fff8f8] border-chilli/30";
      
  const trustTextColor = avgTrustScore >= 90
    ? "text-field"
    : avgTrustScore >= 70
      ? "text-harvest"
      : "text-chilli";

  const trustBgBar = avgTrustScore >= 90
    ? "bg-field"
    : avgTrustScore >= 70
      ? "bg-harvest"
      : "bg-chilli";

  const isVillageRecognized = (extConfidence.village || 0) >= 70;
  const isCropRecognized = (extConfidence.crop || 0) >= 70;
  const isWeightParsed = (extConfidence.weight || 0) >= 70;
  const isAboveThreshold = avgTrustScore >= 70;

  return (
    <div className="space-y-5">
      {/* Metrics Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={UsersRound} label="Farmers Served" value={`${orders.length}`} detail="Active cooperative load for Koyambedu Mandi" />
        <MetricCard icon={IndianRupee} label="Money Saved" value={`Rs ${totalSavings.toLocaleString("en-IN")}`} detail="Savings compared with individual transport" />
        <MetricCard icon={Package} label="Weight Transported" value={`${totalWeight} kg`} detail={`Current cluster utilization is ${recommendation.truckUtilization}%`} />
      </div>

      {/* Manual Review Alert Card */}
      {reviewOrders.length > 0 && (
        <section className="rounded-lg border border-red-200 bg-red-50/70 p-5 shadow-panel border-l-4 border-l-chilli animate-fadeIn">
          <div className="flex items-start gap-3 text-chilli">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-0.5 text-chilli animate-bounce" />
            <div className="w-full">
              <h2 className="text-base font-extrabold uppercase tracking-wider text-stone-850">
                MANUAL REVIEW REQUIRED ({reviewOrders.length})
              </h2>
              <p className="mt-1 text-sm text-stone-700 leading-relaxed">
                The following voice-helpline bookings failed the AI NLP confidence threshold (under 70%) and must be manually corrected by an administrator.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {reviewOrders.map((order: any) => (
                  <div key={order.id} className="rounded-lg border border-red-250 bg-white p-4 shadow-sm flex flex-col justify-between hover:border-chilli/60 transition-all">
                    <div>
                      <div className="flex items-center justify-between">
                        <strong className="text-stone-900 font-extrabold">{order.id}</strong>
                        <span className="text-[10px] font-bold text-chilli bg-chilli/10 px-2 py-0.5 rounded-full">Low Confidence</span>
                      </div>
                      <p className="mt-2 text-xs text-stone-700">
                        <span className="font-semibold text-stone-500">Farmer:</span> {order.farmerName || "Unknown"}
                      </p>
                      <p className="text-xs text-stone-700">
                        <span className="font-semibold text-stone-500">Village:</span> {order.village || "Unknown"}
                      </p>
                      <p className="text-xs text-stone-700">
                        <span className="font-semibold text-stone-500">Crop:</span> {order.crop || "Unknown"} ({order.weightKg} kg)
                      </p>
                      {order.confidence && (
                        <div className="mt-2 text-[10px] text-stone-600 bg-stone-50 p-2 rounded border border-stone-100">
                          <p className="font-bold mb-0.5 text-stone-500">Confidence scores:</p>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                            {Object.entries(order.confidence as Record<string, number>).map(([key, val]) => (
                              <div key={key}>
                                <span className="capitalize text-stone-400">{key.replace("_", " ")}: </span>
                                <span className={Number(val) < 70 ? "text-chilli font-bold" : "text-field font-semibold"}>{val}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleStartEdit(order)}
                      className="mt-3.5 focus-ring w-full rounded-lg bg-chilli py-2 text-xs font-bold text-white hover:bg-chilli/90 transition-colors shadow-sm"
                    >
                      Resolve & Correct
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Booking Operations Table */}
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-soil">Booking Operations</h2>
            <p className="mt-1 text-xs text-stone-500">View, audit, and correct farmer transport requests from Web and Voice channels.</p>
          </div>
          <span className="text-xs font-bold text-stone-650 bg-stone-100 px-3 py-1 rounded-full">
            Total Bookings: {orders.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-stone-500 font-bold bg-stone-50/80">
              <tr>
                <th className="py-2.5 px-3">Booking ID</th>
                <th>Channel</th>
                <th>Farmer Name</th>
                <th>Village</th>
                <th>Crop</th>
                <th>Weight</th>
                <th>Status</th>
                <th>AI Confidence</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr className="border-t border-stone-100 hover:bg-stone-50/50 transition-colors" key={order.id}>
                  <td className="py-3.5 px-3 font-semibold text-soil">{order.id}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold rounded px-2.5 py-0.5 ${
                      order.source === "Voice Call" 
                        ? "bg-river/10 text-river" 
                        : "bg-stone-100 text-stone-600"
                    }`}>
                      {order.source === "Voice Call" ? (
                        <>
                          <PhoneCall size={11} />
                          Voice ({order.language || "en"})
                        </>
                      ) : (
                        <>
                          <Laptop size={11} />
                          Web
                        </>
                      )}
                    </span>
                  </td>
                  <td>
                    <div className="font-semibold text-stone-850">{order.farmerName}</div>
                    <div className="text-[11px] text-stone-500 font-medium">{order.phone}</div>
                  </td>
                  <td>{order.village}</td>
                  <td>{order.crop}</td>
                  <td>{order.weightKg} kg</td>
                  <td>
                    <StatusPill status={order.status} />
                  </td>
                  <td>
                    {order.source === "Voice Call" && order.confidence ? (
                      <div className="flex flex-col gap-0.5">
                        {order.reviewRequired ? (
                          <span className="text-[10px] font-extrabold text-chilli bg-chilli/10 px-1.5 py-0.5 rounded w-max">
                            Low Confidence
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-field bg-field/10 px-1.5 py-0.5 rounded w-max">
                            Verified
                          </span>
                        )}
                        <span className="text-[10px] text-stone-500 font-mono">
                          Avg: {Math.round(
                            Object.values(order.confidence as Record<string, number>).reduce((a: number, b: number) => a + b, 0) / 
                            Object.keys(order.confidence as Record<string, number>).length
                          )}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-stone-400 italic">N/A (Web)</span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleStartEdit(order)}
                      className="focus-ring inline-flex items-center gap-1 text-xs font-bold text-soil border border-stone-200 bg-white px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-all"
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Live AI Processing Monitor Panel */}
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-soil">AI Processing Monitor</h2>
                <p className="mt-1 text-sm text-stone-600">Whisper transcript, Gemini extraction, and confidence scoring.</p>
              </div>
              <Bot className="text-river" size={24} />
            </div>
            
            <div className="mt-4 rounded-lg bg-stone-50 p-4">
              <p className="text-xs uppercase text-stone-500 font-bold">Transcript</p>
              <p className="mt-2 text-sm text-stone-700 leading-relaxed font-mono italic">"{extraction.transcript}"</p>
            </div>
            
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(extraction.extracted).map(([key, value]) => (
                <div className="rounded-lg border border-stone-200 p-3 bg-white" key={key}>
                  <p className="text-xs uppercase text-stone-400 font-bold">{key.replace("_", " ")}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <strong className="text-stone-800">{String(value)}</strong>
                    <span className="text-xs font-bold text-field">
                      {extraction.confidence[key as keyof typeof extraction.confidence]}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FEATURE 1: AI Trust Score Panel */}
          <div className={`mt-5 rounded-xl border p-4 ${trustColor} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
            <div>
              <p className="text-xs uppercase font-extrabold tracking-wider text-stone-500">AI Trust Score</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-black ${trustTextColor}`}>{avgTrustScore}%</span>
                <span className="text-[10px] font-bold text-stone-500 uppercase">Verification Level</span>
              </div>
              
              <div className="w-44 h-1.5 rounded-full bg-stone-150 mt-2.5 overflow-hidden">
                <div style={{ width: `${avgTrustScore}%` }} className={`h-full ${trustBgBar} transition-all duration-1000 ease-out`} />
              </div>
            </div>

            <div className="text-[11px] space-y-1.5 pl-4 sm:border-l border-stone-250 w-full sm:w-auto">
              <p className="font-bold text-stone-600 uppercase tracking-wider text-[10px]">Verification Factors:</p>
              <div className="flex items-center gap-2 text-stone-700">
                <span className={`font-black text-xs ${isVillageRecognized ? "text-field" : "text-stone-400"}`}>
                  {isVillageRecognized ? "✓" : "✗"}
                </span>
                <span>Village Recognized</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <span className={`font-black text-xs ${isCropRecognized ? "text-field" : "text-stone-400"}`}>
                  {isCropRecognized ? "✓" : "✗"}
                </span>
                <span>Crop Recognized</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <span className={`font-black text-xs ${isWeightParsed ? "text-field" : "text-stone-400"}`}>
                  {isWeightParsed ? "✓" : "✗"}
                </span>
                <span>Weight Parsed Successfully</span>
              </div>
              <div className="flex items-center gap-2 text-stone-700">
                <span className={`font-black text-xs ${isAboveThreshold ? "text-field" : "text-stone-400"}`}>
                  {isAboveThreshold ? "✓" : "✗"}
                </span>
                <span>Confidence Above Threshold</span>
              </div>
            </div>
          </div>
        </section>

        <RecommendationCard recommendation={recommendation} orders={orders} />
      </div>

      {/* Map and Auction / Timeline Panels */}
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <TacticalMap orders={orders} />
        <div className="space-y-5 flex flex-col justify-between">
          <AuctionPanel bids={bids} />
          
          {/* FEATURE 4: Live Operations Timeline Card */}
          <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel flex-1">
            <h2 className="text-lg font-bold text-soil flex items-center gap-2 mb-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-river opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-river"></span>
              </span>
              Live Operations Timeline
            </h2>
            <p className="text-xs text-stone-500 mb-4">Real-time event feed from cooperative dispatch and voice helpline.</p>

            <div className="relative pl-6 space-y-4 max-h-[300px] overflow-y-auto pr-1 border-l-2 border-stone-100">
              {timelineEvents.map((evt) => {
                let statusColor = "bg-stone-450";
                if (evt.status === "success") statusColor = "bg-field";
                else if (evt.status === "info") statusColor = "bg-river";
                else if (evt.status === "warning") statusColor = "bg-harvest";
                else if (evt.status === "danger") statusColor = "bg-chilli";
                else if (evt.status === "call") statusColor = "bg-soil";

                return (
                  <div key={evt.id} className="relative group transition-all duration-300 hover:translate-x-0.5 animate-fadeIn">
                    <div className={`absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${statusColor} shadow-sm`} />
                    <div className="rounded-lg bg-stone-50 p-3 hover:bg-stone-50/80 transition-all border border-stone-100">
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-stone-450">
                        <span className="uppercase tracking-wider">{evt.title}</span>
                        <span>{evt.time}</span>
                      </div>
                      <p className="mt-1 text-xs text-stone-700 font-medium">{evt.details}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Savings Analytics Trend */}
      <SavingsPanel orders={orders} trend={savingsTrend} />

      {/* Edit Booking Modal Overlay */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-xl relative animate-fadeIn">
            <button
              onClick={() => setEditingOrder(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold text-soil flex items-center gap-1.5 mb-2">
              <Edit2 size={18} className="text-soil" />
              Correct Booking: {editingOrder.id}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Correcting this booking will automatically update coordinates, recalculate costs, and clear the warning flags.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Farmer Name</label>
                <input
                  type="text"
                  value={editForm.farmerName}
                  onChange={(e) => setEditForm({ ...editForm, farmerName: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus-ring"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Village</label>
                <input
                  type="text"
                  value={editForm.village}
                  onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus-ring"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Crop</label>
                  <input
                    type="text"
                    value={editForm.crop}
                    onChange={(e) => setEditForm({ ...editForm, crop: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={editForm.weightKg}
                    onChange={(e) => setEditForm({ ...editForm, weightKg: Number(e.target.value) })}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus-ring"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="rounded-lg bg-soil px-5 py-2 text-sm font-semibold text-white hover:bg-soil/95 transition-colors"
              >
                Save & Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
