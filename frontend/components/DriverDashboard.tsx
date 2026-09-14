"use client";

import { BadgeIndianRupee, ClipboardCheck, Send, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { Bid, Driver, FarmerOrder } from "@/types";
import { StatusPill } from "@/components/StatusPill";

export function DriverDashboard() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [orders, setOrders] = useState<FarmerOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const [fetchedBids, fetchedOrders, fetchedDrivers] = await Promise.all([
        api.getBids(),
        api.getOrders(),
        api.getDrivers()
      ]);
      setBids(fetchedBids);
      setOrders(fetchedOrders);
      setDrivers(fetchedDrivers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function submitBid(formData: FormData) {
    const amount = Number(formData.get("bid") || 4500);
    const payload = {
      driver_name: "Your Vehicle",
      vehicle: "Mini Truck",
      amount,
      reliability_score: 90
    };

    try {
      const newBid = await api.submitBid(payload);
      if (newBid) {
        setBids([newBid, ...bids]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const totalWeight = orders.reduce((sum, order) => sum + order.weightKg, 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-soil">Driver Registration</h2>
          <Truck className="text-field" size={24} />
        </div>
        <div className="mt-4 grid gap-3">
          {["Name", "Phone Number", "Vehicle Number", "Driving License Number"].map((label) => (
            <input className="focus-ring rounded-lg border border-stone-300 px-3 py-2" key={label} placeholder={label} />
          ))}
          <select className="focus-ring rounded-lg border border-stone-300 px-3 py-2" defaultValue="Tata Ace">
            {["Tata Ace", "Mahindra Bolero Pickup", "Ashok Leyland Dost", "Mini Truck", "Other"].map((vehicle) => (
              <option key={vehicle}>{vehicle}</option>
            ))}
          </select>
          <button className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg bg-field px-4 py-2 font-semibold text-white" type="button">
            <ClipboardCheck size={18} />
            Save Vehicle
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel">
        <h2 className="text-lg font-bold text-soil">Available Load</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-5">
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Pickup Villages</p>
            <p className="font-bold">Melma, Athur, Sevoor</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Destination</p>
            <p className="font-bold">Koyambedu</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Total Weight</p>
            <p className="font-bold">{totalWeight} kg</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Expected Earnings</p>
            <p className="font-bold">Rs 4,350</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-3">
            <p className="text-xs text-stone-500">Crops</p>
            <p className="font-bold">Tomato, Brinjal</p>
          </div>
        </div>

        <form action={submitBid} className="mt-4 flex flex-wrap gap-3">
          <label className="flex min-w-64 flex-1 items-center gap-2 rounded-lg border border-stone-300 px-3 py-2">
            <BadgeIndianRupee size={18} />
            <input className="w-full outline-none" min="1" name="bid" placeholder="Driver Bid" type="number" required />
          </label>
          <button className="focus-ring inline-flex items-center gap-2 rounded-lg bg-soil px-4 py-2 font-semibold text-white" type="submit">
            <Send size={18} />
            Submit Bid
          </button>
        </form>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <p className="text-sm text-stone-500">Loading bids...</p>
          ) : (
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="text-stone-500">
                <tr>
                  <th className="py-2">Driver</th>
                  <th>Vehicle</th>
                  <th>Bid Amount</th>
                  <th>Reliability</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid) => (
                  <tr className="border-t border-stone-200" key={bid.id}>
                    <td className="py-3 font-semibold">{bid.driverName}</td>
                    <td>{bid.vehicle}</td>
                    <td>Rs {bid.amount.toLocaleString("en-IN")}</td>
                    <td>{bid.reliabilityScore}%</td>
                    <td>
                      <StatusPill status={bid.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-panel xl:col-span-2">
        <h2 className="text-lg font-bold text-soil">Active Trips</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {drivers.map((driver) => (
            <div className="rounded-lg border border-stone-200 p-4" key={driver.id}>
              <p className="font-bold text-soil">{driver.name}</p>
              <p className="mt-1 text-sm text-stone-600">{driver.vehicleType} / {driver.vehicleNumber}</p>
              <div className="mt-4 flex gap-3">
                <button className="focus-ring rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold">Picked Up</button>
                <button className="focus-ring rounded-lg bg-field px-4 py-2 text-sm font-semibold text-white">Delivered</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

