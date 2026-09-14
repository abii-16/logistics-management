"use client";

import { CalendarClock, CheckCircle2, IndianRupee, PackagePlus, Truck, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { savingsTrend } from "@/services/demoData";
import type { FarmerOrder } from "@/types";
import { StatusPill } from "@/components/StatusPill";
import { VoiceCallSimulator } from "@/components/VoiceCallSimulator";
import { SavingsPanel } from "@/components/SavingsPanel";
import { useAuth } from "@/hooks/useAuth";

export function FarmerDashboard() {
  const [orders, setOrders] = useState<FarmerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { user } = useAuth("farmer");

  async function loadOrders() {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function addBooking(formData: FormData) {
    const crop = String(formData.get("crop") || "Tomato");
    const weight = Number(formData.get("weight") || 150);
    const village = String(formData.get("village") || "New Village");
    
    const payload = {
      farmer_name: user?.name || "Unknown Farmer",
      phone: user?.phone || "",
      village,
      crop,
      weight_kg: weight,
      destination: "Koyambedu Mandi"
    };

    try {
      const newOrder = await api.createBooking(payload);
      if (newOrder) {
        setOrders([newOrder, ...orders]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleNewNotification(notif: any) {
    setNotifications((prev) => [notif, ...prev]);
  }

  const assignedOrder = orders.find((order) => order.status === "Driver Assigned") ?? orders[0];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-5">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-soil">Create Booking</h2>
              <p className="mt-1 text-sm text-stone-600">Crop, weight, location, and voice note in one companion flow.</p>
            </div>
            <PackagePlus className="text-field" size={24} />
          </div>
          <form action={addBooking} className="mt-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <input className="focus-ring rounded-lg border border-stone-300 px-3 py-2" name="crop" placeholder="Crop Type" required />
              <input className="focus-ring rounded-lg border border-stone-300 px-3 py-2" min="1" name="weight" placeholder="Weight kg" type="number" required />
              <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-field px-4 py-2 font-semibold text-white" type="submit">
                <CheckCircle2 size={18} />
                Submit
              </button>
            </div>
            <input
              className="focus-ring w-full rounded-lg border border-stone-300 px-3 py-2"
              name="village"
              placeholder="Full address — e.g. 12/4 Gandhi Street, Melma, Kanchipuram District, Tamil Nadu 631501"
              required
            />
          </form>
        </section>

        <VoiceCallSimulator onBookingCreated={loadOrders} onNewNotification={handleNewNotification} />

        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold text-soil">My Orders</h2>
          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <p className="text-sm text-stone-500">Loading orders...</p>
            ) : (
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-stone-500">
                  <tr>
                    <th className="py-2">Booking</th>
                    <th>Crop</th>
                    <th>Village</th>
                    <th>Weight</th>
                    <th>Status</th>
                    <th>Pickup</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr className="border-t border-stone-200" key={order.id}>
                      <td className="py-3 font-semibold text-soil">{order.id}</td>
                      <td>{order.crop}</td>
                      <td>{order.village}</td>
                      <td>{order.weightKg} kg</td>
                      <td>
                        <StatusPill status={order.status} />
                      </td>
                      <td>{order.pickupTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
          <h2 className="text-lg font-bold text-soil">Assigned Driver</h2>
          {assignedOrder ? (
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                <span className="inline-flex items-center gap-2 text-stone-600"><Truck size={17} /> Driver</span>
                <strong>Kannan</strong>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                <span className="text-stone-600">Phone</span>
                <strong>+91 98844 77882</strong>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                <span className="text-stone-600">Vehicle</span>
                <strong>TN 11 AB 4472</strong>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                <span className="inline-flex items-center gap-2 text-stone-600"><CalendarClock size={17} /> Pickup</span>
                <strong>{assignedOrder.pickupTime}</strong>
              </p>
              <p className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                <span className="inline-flex items-center gap-2 text-stone-600"><IndianRupee size={17} /> Final Cost</span>
                <strong>Rs {assignedOrder.sharedCost.toLocaleString("en-IN")}</strong>
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-stone-500">No driver assigned.</p>
          )}
        </section>

        {/* Simulated SMS Notification Center */}
        <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone className="text-river" size={20} />
            <h2 className="text-lg font-bold text-soil">Simulated SMS Delivery</h2>
          </div>
          <p className="text-xs text-stone-500 mb-4">
            Simulates notifications delivered to farmers via SMS immediately after calling the helpline.
          </p>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-stone-400 italic text-center py-6">
                No SMS received yet. Run a Tamil/Hindi/English voice booking to simulate SMS delivery.
              </p>
            ) : (
              notifications.map((notif, index) => (
                <div key={index} className="rounded-lg border border-stone-200 bg-stone-50 p-3 relative shadow-sm hover:border-river/30 transition-all">
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-400">
                    <span>FROM: 1800-KRISHI</span>
                    <span>{notif.timestamp}</span>
                  </div>
                  <div className="mt-1.5 text-xs text-stone-700 space-y-1 font-mono">
                    <p className="font-bold text-river uppercase">Booking Confirmed</p>
                    <p><span className="text-stone-500">ID:</span> {notif.id}</p>
                    <p><span className="text-stone-500">Crop:</span> {notif.crop}</p>
                    <p><span className="text-stone-500">Weight:</span> {notif.weightKg} kg</p>
                    <p><span className="text-stone-500">Village:</span> {notif.village}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <SavingsPanel orders={orders} trend={savingsTrend} />
      </div>
    </div>
  );
}
