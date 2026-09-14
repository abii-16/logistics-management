"use client";

import { FarmerDashboard } from "@/components/FarmerDashboard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase";
import { useRouter } from "next/navigation";
import { LogOut, Tractor } from "lucide-react";

export default function FarmerPage() {
  const { user, loading } = useAuth("farmer");
  const router = useRouter();

  async function handleLogout() {
    localStorage.removeItem("kb_demo_session");
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fffaf0] flex items-center justify-center">
        <p className="text-stone-500 font-semibold animate-pulse font-mono text-xs">Verifying Farmer Session...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#fffaf0] pb-12">
      {/* Farmer Dashboard Header */}
      <header className="border-b border-stone-200 bg-white shadow-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tractor className="text-soil" size={22} />
            <span className="text-lg font-black text-soil tracking-wide">Farmer Dashboard</span>
            <span className="text-xs font-bold text-stone-500">| Welcome, {user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <FarmerDashboard />
      </div>
    </main>
  );
}
