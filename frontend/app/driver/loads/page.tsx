"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import { LogOut, Truck, Scale, Sprout, MapPin, IndianRupee, Compass, Clock, Award, Star, Bell, ShieldAlert, CheckCircle, X } from "lucide-react";
import Link from "next/link";

interface BidEvent {
  driverName: string;
  vehicle: string;
  amount: number;
  reliability: number;
  timestamp: string;
}

export default function DriverLoadsPage() {
  const { user, loading } = useAuth("driver");
  const router = useRouter();

  // Active load state (defaults to mock KB1024 if db bundles empty)
  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  
  // Bidding states
  const [driverBid, setDriverBid] = useState<string>("");
  const [bidsFeed, setBidsFeed] = useState<BidEvent[]>([]);
  const [biddingActive, setBiddingActive] = useState(false);
  const [isLowest, setIsLowest] = useState(true);
  const [lowestBidValue, setLowestBidValue] = useState<number>(Infinity);
  
  // Simulated competitor state
  const [compStep, setCompStep] = useState(0);
  const compTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Per-bundle state mapping to prevent stale state issues and enable switching
  const [bundleStates, setBundleStates] = useState<Record<string, {
    driverBid: string;
    bidsFeed: BidEvent[];
    biddingActive: boolean;
    isLowest: boolean;
    lowestBidValue: number;
    compStep: number;
  }>>({});

  // Synchronize active bidding states back to bundleStates map
  useEffect(() => {
    if (!selectedBundle) return;
    setBundleStates(prev => {
      const current = prev[selectedBundle.id];
      if (
        current &&
        current.driverBid === driverBid &&
        current.bidsFeed === bidsFeed &&
        current.biddingActive === biddingActive &&
        current.isLowest === isLowest &&
        current.lowestBidValue === lowestBidValue &&
        current.compStep === compStep
      ) {
        return prev;
      }
      return {
        ...prev,
        [selectedBundle.id]: {
          driverBid,
          bidsFeed,
          biddingActive,
          isLowest,
          lowestBidValue,
          compStep
        }
      };
    });
  }, [selectedBundle?.id, driverBid, bidsFeed, biddingActive, isLowest, lowestBidValue, compStep]);

  // Helper to switch or select a bundle
  const selectBundle = (bundle: any) => {
    if (selectedBundle?.id === bundle.id) return;

    if (compTimerRef.current) {
      clearTimeout(compTimerRef.current);
      compTimerRef.current = null;
    }

    const nextState = bundleStates[bundle.id] || {
      driverBid: "",
      bidsFeed: [],
      biddingActive: false,
      isLowest: true,
      lowestBidValue: Infinity,
      compStep: 0
    };

    setDriverBid(nextState.driverBid);
    setBidsFeed(nextState.bidsFeed);
    setBiddingActive(nextState.biddingActive);
    setIsLowest(nextState.isLowest);
    setLowestBidValue(nextState.lowestBidValue);
    setCompStep(nextState.compStep);
    setSelectedBundle(bundle);
  };

  // Helper to close a bid details panel
  const handleCloseBid = () => {
    if (compTimerRef.current) {
      clearTimeout(compTimerRef.current);
      compTimerRef.current = null;
    }

    setSelectedBundle(null);
    setDriverBid("");
    setBidsFeed([]);
    setBiddingActive(false);
    setIsLowest(true);
    setLowestBidValue(Infinity);
    setCompStep(0);
  };

  // Winner Modal states
  const [showWinModal, setShowWinModal] = useState(false);
  const [winContractValue, setWinContractValue] = useState(0);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([
    {
      title: "New Load Available",
      message: "Bundle #KB1024 ready for cooperative logistics bidding.",
      time: "Just Now",
      read: false,
      type: "new_load"
    }
  ]);

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "contract_won":
        return {
          containerClass: "border-l-4 border-l-field border-field/30 bg-[#f7fbf7] hover:bg-[#eff7ef] shadow-sm",
          titleClass: "text-field font-black",
          badgeColor: "bg-field",
          icon: "🎉"
        };
      case "bid":
        return {
          containerClass: "border-l-4 border-l-harvest border-harvest/30 bg-[#fffcf5] hover:bg-[#fff7e6] shadow-sm",
          titleClass: "text-[#d67d00] font-bold",
          badgeColor: "bg-harvest",
          icon: "⚡"
        };
      case "new_load":
        return {
          containerClass: "border-l-4 border-l-river border-river/30 bg-[#f4f8fc] hover:bg-[#e8f1f8] shadow-sm",
          titleClass: "text-river font-bold",
          badgeColor: "bg-river",
          icon: "📦"
        };
      default:
        return {
          containerClass: "border-l-4 border-l-stone-400 border-stone-200 bg-stone-50 hover:bg-stone-100/85 shadow-sm",
          titleClass: "text-stone-850 font-bold",
          badgeColor: "bg-stone-400",
          icon: "🔔"
        };
    }
  };

  const handleNotificationClick = (notif: any) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => (n === notif ? { ...n, read: true } : n))
    );

    const msg = notif.message || "";
    const bundleMatch = msg.match(/KB-?\d+/i);
    
    if (notif.type === "contract_won" || notif.type === "trip_update" || msg.toLowerCase().includes("trip") || msg.toLowerCase().includes("journey") || msg.toLowerCase().includes("assigned")) {
      router.push("/driver/trip");
    } else if (bundleMatch) {
      const bId = bundleMatch[0].replace("-", "").toUpperCase();
      const target = bundles.find(b => b.id.toUpperCase().replace("-", "") === bId);
      if (target) {
        selectBundle(target);
      }
    } else if (msg.toLowerCase().includes("savings") || msg.toLowerCase().includes("analytics") || msg.toLowerCase().includes("payout")) {
      const targetEl = document.getElementById("performance-metrics");
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Load bundles
  useEffect(() => {
    async function getBundles() {
      if (!user) return;
      try {
        const { data } = await supabase.from("bundles").select("*").order("created_at", { ascending: false });
        if (data && data.length > 0) {
          setBundles(data.map(b => ({
            id: b.id,
            pickup: "Melma Cooperative Base",
            destination: b.destination,
            weight: b.total_weight_kg,
            crop: "Tomatoes & Eggplants",
            earnings: b.estimated_savings * 1.5, // simulate driver payout
            distance: 18,
            fuel: 600
          })));
        } else {
          // Fallback mockup
          setBundles([
            {
              id: "KB1024",
              pickup: "Melma Farmers Pool",
              destination: "Koyambedu Mandi",
              weight: 1200,
              crop: "Tomato (900kg), Brinjal (300kg)",
              earnings: 4200,
              distance: 18,
              fuel: 580
            }
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    getBundles();
  }, [user]);

  // Handle bidding submission
  const submitBid = async () => {
    const amount = Number(driverBid);
    if (!amount || amount <= 0) return;

    const newBid: BidEvent = {
      driverName: user.name || "You",
      vehicle: "Your Vehicle",
      amount,
      reliability: user.reliability_score || 94,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    // Store in Supabase bids table
    try {
      await supabase.from("bids").insert({
        id: `BID-${Date.now()}`,
        bundle_id: selectedBundle.id,
        driver_id: user.driverId || user.id,
        driver_name: user.name,
        vehicle: "Mini Truck",
        amount: amount,
        bid_amount: amount,
        reliability_score: user.reliability_score || 94,
        status: "Open"
      });
    } catch (e) {
      console.error("Error inserting bid:", e);
    }

    setBidsFeed([newBid]);
    setBiddingActive(true);
    setLowestBidValue(amount);
    setIsLowest(true);
    setCompStep(1);
  };

  // Simulated Bidding Engine Loop
  useEffect(() => {
    if (!biddingActive || !selectedBundle) return;

    const competitors = [
      { name: "Driver Selvam", vehicle: "Pickup Van", amount: 4500, reliability: 95 },
      { name: "Driver Kumar", vehicle: "Mini Truck", amount: 4300, reliability: 96 },
      { name: "Driver Mani", vehicle: "Pickup Van", amount: 4100, reliability: 91 },
      { name: "Driver Raj", vehicle: "Mini Truck", amount: 3950, reliability: 93 }
    ];

    if (compStep > 0 && compStep <= competitors.length) {
      compTimerRef.current = setTimeout(() => {
        const comp = competitors[compStep - 1];
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const nextBid: BidEvent = {
          driverName: comp.name,
          vehicle: comp.vehicle,
          amount: comp.amount,
          reliability: comp.reliability,
          timestamp: nowStr
        };

        setBidsFeed(prev => [nextBid, ...prev]);

        // Recalculate lowest bid
        setLowestBidValue(currentMin => {
          const newMin = Math.min(currentMin, comp.amount);
          const driverAmount = Number(driverBid);
          setIsLowest(driverAmount <= newMin);
          return newMin;
        });

        // Trigger notifications
        setNotifications(prev => [
          {
            title: "Competitive Bid Placed",
            message: `${comp.name} placed a bid of ₹${comp.amount} on Bundle #${selectedBundle.id}`,
            time: "Just Now",
            read: false,
            type: "bid"
          },
          ...prev
        ]);

        setCompStep(prev => prev + 1);
      }, 6000);
    } else if (compStep > competitors.length) {
      // Auction completed! Determine winner
      const finalDriverBid = Number(driverBid);
      const won = finalDriverBid <= lowestBidValue;

      // Close Bidding timer
      compTimerRef.current = setTimeout(async () => {
        setBiddingActive(false);

        if (won) {
          setWinContractValue(finalDriverBid);
          setShowWinModal(true);

          // Save assignment to trip_assignments and notifications
          try {
            await supabase.from("trip_assignments").insert({
              driver_id: user.driverId || user.id,
              bundle_id: selectedBundle.id,
              trip_status: "Assigned"
            });
            await supabase.from("notifications").insert({
              user_id: user.id,
              title: "Contract Awarded!",
              message: `Congratulations! You won the contract for Bundle #${selectedBundle.id} at ₹${finalDriverBid}`,
              type: "contract"
            });
          } catch (e) {
            console.error("Error saving winner states:", e);
          }

          setNotifications(prev => [
            {
              title: "🎉 CONTRACT WON!",
              message: `Cooperative bundle #${selectedBundle.id} awarded to you for ₹${finalDriverBid}.`,
              time: "Just Now",
              read: false,
              type: "contract_won"
            },
            ...prev
          ]);
        } else {
          alert(`Auction closed. The contract was awarded to Driver Raj at ₹${lowestBidValue}.`);
        }
      }, 5000);
    }

    return () => {
      if (compTimerRef.current) clearTimeout(compTimerRef.current);
    };
  }, [biddingActive, compStep, selectedBundle, driverBid, lowestBidValue, user]);

  const handleLogout = async () => {
    localStorage.removeItem("kb_demo_session");
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf0] flex items-center justify-center">
        <p className="text-stone-500 font-semibold animate-pulse font-mono text-xs">Authenticating Driver...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#fffaf0] flex flex-col md:flex-row pb-12">
      {/* Side Navigation panel */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-stone-200 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="text-soil animate-pulse" size={24} />
              <span className="text-lg font-black text-soil tracking-wide">KrishiBundle Driver</span>
            </div>
            <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">Ola Driver Mode</p>
          </div>

          <nav className="space-y-2 text-sm font-bold text-stone-600">
            <Link href="/driver/loads" className="flex items-center gap-2.5 bg-soil/5 text-soil p-2.5 rounded-lg border border-soil/10">
              <Compass size={17} /> Available Loads
            </Link>
            <Link href="/driver/trip" className="flex items-center gap-2.5 hover:bg-stone-50 p-2.5 rounded-lg hover:text-soil transition-all">
              <MapPin size={17} /> Active Journey Map
            </Link>
          </nav>

          {/* Performance & Score panel */}
          <div id="performance-metrics" className="rounded-xl border border-stone-150 p-4 bg-stone-50/50 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                <Award size={14} className="text-harvest" />
                Reliability Score
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-soil">{user.reliability_score || 94}</span>
              <span className="text-xs font-semibold text-stone-500">/ 100</span>
            </div>
            <div className="flex items-center text-yellow-500 text-xs">
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" />
              <Star size={12} fill="currentColor" className="opacity-80" />
              <span className="ml-1 text-[10px] font-bold text-stone-500">(4.8 Farmer Rating)</span>
            </div>
            <div className="pt-2 text-[10px] text-stone-500 border-t border-stone-200/50 grid grid-cols-2 gap-2">
              <div>
                <p className="font-bold">Completed Trips</p>
                <p className="font-black text-stone-700">{user.completed_trips || 24}</p>
              </div>
              <div>
                <p className="font-bold">Bid Success</p>
                <p className="font-black text-stone-700">82%</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="focus-ring mt-6 w-full flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white py-2 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <LogOut size={14} />
          Logout
        </button>
      </aside>

      {/* Main Workspace Area */}
      <section className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-soil uppercase tracking-wide">Available Loads</h1>
            <p className="text-xs text-stone-500">Cooperative farmer transport loads waiting for bids.</p>
          </div>
          <span className="text-xs font-semibold text-stone-500">Welcome back, {user.name}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Bundle Cards Container */}
          <div className="space-y-4">
            {bundles.length === 0 ? (
              <p className="text-sm text-stone-400 italic">No available loads in your area.</p>
            ) : (
              bundles.map((bundle) => (
                <div
                  key={bundle.id}
                  onClick={() => selectBundle(bundle)}
                  className={`rounded-xl border p-5 shadow-panel cursor-pointer transition-all bg-white relative overflow-hidden ${
                    selectedBundle?.id === bundle.id 
                      ? "border-soil ring-1 ring-soil" 
                      : "border-stone-200 hover:border-soil/40"
                  }`}
                >
                  <div className="absolute top-0 right-0 bg-soil/10 text-soil font-black text-[10px] px-3 py-1 rounded-bl-lg uppercase">
                    Bundle #{bundle.id}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold rounded bg-river/10 text-river px-2.5 py-0.5">
                        <MapPin size={11} /> Melma base → {bundle.destination}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs mt-2 text-stone-600">
                      <div className="flex items-center gap-2">
                        <Scale size={14} className="text-stone-400" />
                        <span>Weight: <strong className="text-stone-800">{bundle.weight} kg</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sprout size={14} className="text-stone-400" />
                        <span>Crops: <strong className="text-stone-800">{bundle.crop.split('(')[0]}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Compass size={14} className="text-stone-400" />
                        <span>Distance: <strong className="text-stone-800">{bundle.distance} km</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <IndianRupee size={14} className="text-stone-400" />
                        <span>Expected Payout: <strong className="text-field font-black">₹{bundle.earnings}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Bidding Interface Card */}
            {selectedBundle && (
              <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-panel space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-soil uppercase tracking-wider">
                      Place Bid for Bundle #{selectedBundle.id}
                    </h3>
                    <button
                      type="button"
                      onClick={handleCloseBid}
                      className="text-stone-400 hover:text-stone-600 hover:bg-stone-50 p-1 rounded-full border border-stone-200 transition-colors flex items-center justify-center"
                      title="Close bid details"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <span className="text-xs text-stone-500">Est. fuel cost: ₹{selectedBundle.fuel}</span>
                </div>

                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-stone-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      placeholder="Enter bid amount (e.g. 4000)"
                      value={driverBid}
                      disabled={biddingActive}
                      onChange={(e) => setDriverBid(e.target.value)}
                      className="focus-ring w-full rounded-lg border border-stone-300 pl-7 pr-3 py-2 text-sm text-stone-800"
                    />
                  </div>
                  <button
                    onClick={submitBid}
                    disabled={biddingActive || !driverBid}
                    className="focus-ring bg-soil text-white px-5 py-2 text-sm font-bold rounded-lg hover:bg-soil/95 transition-all disabled:opacity-50"
                  >
                    Submit Bid
                  </button>
                </div>

                {/* Status Indicator */}
                {bidsFeed.length > 0 && (
                  <div className="mt-3.5 flex items-center justify-between p-3 rounded-lg border text-xs">
                    <span className="font-bold text-stone-600">My Bid Status:</span>
                    {isLowest ? (
                      <span className="inline-flex items-center gap-1.5 font-black text-field bg-field/10 border border-field/20 px-3 py-1 rounded-full uppercase tracking-wider">
                        🟢 Lowest Bid - You are leading
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-black text-chilli bg-chilli/10 border border-chilli/20 px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                        ❌ Outbid - Higher Quote
                      </span>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Live Bid Feed & Notifications sidebar */}
          <div className="space-y-4">
            {/* Live Bid Feed */}
            {selectedBundle && bidsFeed.length > 0 && (
              <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-panel space-y-3">
                <h3 className="text-xs font-black text-soil uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-soil animate-spin-slow" />
                  Live Competitor Bid Feed
                </h3>
                
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {bidsFeed.map((bid, i) => (
                    <div key={i} className="rounded-lg border border-stone-100 p-2.5 bg-stone-50 flex justify-between items-center text-xs animate-fadeIn">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-stone-800">{bid.driverName}</span>
                          <span className="text-[10px] text-stone-400 font-mono">({bid.vehicle})</span>
                        </div>
                        <span className="text-[9px] text-stone-400">{bid.timestamp}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-soil">₹{bid.amount}</p>
                        <p className="text-[9px] text-field font-bold">Rel: {bid.reliability}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Notification Center */}
            <section className="rounded-xl border border-stone-200 bg-white p-5 shadow-panel space-y-4">
              <h3 className="text-xs font-black text-soil uppercase tracking-wider flex items-center gap-1.5">
                <Bell size={15} className="text-soil" />
                Notification Center
              </h3>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 text-left">
                {notifications.map((notif, index) => {
                  const style = getNotificationStyle(notif.type || "");
                  return (
                    <div 
                      key={index} 
                      onClick={() => handleNotificationClick(notif)}
                      className={`group rounded-lg p-3 cursor-pointer transition-all relative select-none active:scale-[0.98] ${style.containerClass} ${!notif.read ? "ring-1 ring-soil/15" : "opacity-80"}`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <strong className={`text-xs ${style.titleClass} flex items-center gap-1.5`}>
                          <span>{style.icon}</span>
                          {notif.title}
                          {!notif.read && (
                            <span className="relative flex h-1.5 w-1.5">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.badgeColor} opacity-75`}></span>
                              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.badgeColor}`}></span>
                            </span>
                          )}
                        </strong>
                        <span className="text-[9px] text-stone-400 font-mono flex-shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-[11px] text-stone-700 mt-1 leading-relaxed">{notif.message}</p>
                      <span className="text-[9px] text-stone-400 mt-1.5 block text-right font-semibold italic group-hover:text-soil transition-colors">Click to view →</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </section>

      {/* FEATURE 2: Winner Celebration Modal */}
      {showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border-2 border-soil bg-white p-6 shadow-2xl relative overflow-hidden text-center animate-fadeIn">
            {/* Background Confetti Pattern */}
            <div className="absolute inset-0 bg-gradient-to-b from-soil/5 to-white pointer-events-none" />
            
            <CheckCircle className="mx-auto text-field mb-3 animate-bounce" size={44} />
            <h3 className="text-xl font-black text-soil uppercase tracking-wide">🎉 CONGRATULATIONS</h3>
            <p className="text-sm font-bold text-stone-700 mt-1">You Won The Cooperative Contract</p>
            
            <div className="mt-5 rounded-xl bg-stone-50 border border-stone-150 p-4 space-y-2 text-xs font-mono text-left max-w-xs mx-auto">
              <div className="flex justify-between">
                <span className="text-stone-400">Bundle ID:</span>
                <strong className="text-stone-800">#{selectedBundle?.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Contract Value:</span>
                <strong className="text-field font-black">₹{winContractValue}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Pickup Time:</span>
                <strong className="text-stone-800">Tomorrow 7:00 AM</strong>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowWinModal(false);
                  router.push("/driver/trip");
                }}
                className="w-full focus-ring bg-soil text-white py-2.5 text-xs font-bold rounded-lg hover:bg-soil/95 transition-all uppercase tracking-wider"
              >
                Go to Active Trip
              </button>
              <button
                onClick={() => setShowWinModal(false)}
                className="w-full focus-ring border border-stone-300 bg-white text-stone-600 py-2.5 text-xs font-bold rounded-lg hover:bg-stone-50 transition-all uppercase tracking-wider"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
