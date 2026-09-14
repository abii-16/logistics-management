"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";
import { sendLoginSMS } from "@/services/sms";
import { Languages, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"farmer" | "driver" | "admin">("farmer");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // Clean phone number format for email mapping — extract last 10 digits only
      const digitsOnly = phone.replace(/\D/g, "");
      const cleanPhone = digitsOnly.slice(-10);
      const email = `user${cleanPhone}@myapp.com`;

      const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !session) {
        setErrorMsg("Invalid phone number or password.");
        setLoading(false);
        return;
      }

      // Fetch profile to verify role
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setErrorMsg("Failed to retrieve user profile.");
        setLoading(false);
        return;
      }

      // Role check (Admin can bypass and access all dashboards)
      if (profile.role !== "admin" && profile.role !== role) {
        await supabase.auth.signOut();
        setErrorMsg(`Role Mismatch: Your account is registered as ${profile.role.toUpperCase()}.`);
        setLoading(false);
        return;
      }

      // Send login SMS (non-blocking - don't wait for it)
      sendLoginSMS(profile.name, profile.phone).catch((err) => {
        console.warn("SMS send failed after login:", err);
      });

      // Redirect based on database role
      if (profile.role === "farmer") {
        router.push("/farmer");
      } else if (profile.role === "driver") {
        router.push("/driver/loads");
      } else if (profile.role === "admin") {
        router.push("/admin");
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setErrorMsg("An error occurred during login. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    let mockUser: any = {};
    if (role === "farmer") {
      mockUser = {
        id: "demo-farmer-id",
        name: "Arumugam (Demo)",
        phone: phone || "9003011224",
        role: "farmer",
        village: "Melma",
        preferred_language: "ta",
        is_mock: true
      };
    } else if (role === "driver") {
      mockUser = {
        id: "demo-driver-id",
        name: "Shyam (Demo)",
        phone: phone || "9486456584",
        role: "driver",
        driverId: "demo-driver-uuid",
        reliability_score: 98,
        completed_trips: 42,
        rating: 4.9,
        is_mock: true
      };
    } else {
      mockUser = {
        id: "demo-admin-id",
        name: "Admin (Demo)",
        phone: phone || "9999999999",
        role: "admin",
        is_mock: true
      };
    }

    const mockSession = {
      user: {
        id: mockUser.id,
        email: `user${mockUser.phone}@myapp.com`,
        user_metadata: mockUser
      }
    };

    localStorage.setItem("kb_demo_session", JSON.stringify(mockSession));
    
    if (role === "farmer") {
      router.push("/farmer");
    } else if (role === "driver") {
      router.push("/driver/loads");
    } else {
      router.push("/admin");
    }
  };

  return (
    <main className="min-h-screen bg-[#fffaf0] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Back to Home Link */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-soil transition-colors">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-field/30 bg-white px-3 py-1 text-xs font-semibold text-field">
            <Languages size={14} />
            Cooperative Logistics
          </div>
        </div>
        <h2 className="mt-5 text-center text-3xl font-black text-soil uppercase tracking-wide">
          Login to Agrilogi
        </h2>
        <p className="mt-1.5 text-center text-xs text-stone-500">
          Enter credentials below to access your logistics workspace.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-stone-200 shadow-panel sm:rounded-xl sm:px-10 relative overflow-hidden">
          {/* Subtle Accent Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-soil" />

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-stone-600 mb-1">
                Preferred Workspace Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {["farmer", "driver", "admin"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r as any)}
                    className={`focus-ring py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                      role === r
                        ? "bg-soil text-white border-soil"
                        : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-extrabold uppercase tracking-wider text-stone-600 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="e.g. +91 90030 11224"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="focus-ring block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-extrabold uppercase tracking-wider text-stone-600 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-ring block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 placeholder-stone-400"
              />
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-chilli/10 border border-chilli/20 p-3 flex items-start gap-2 text-chilli animate-fadeIn">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span className="text-xs font-bold leading-tight">{errorMsg}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full focus-ring flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-soil hover:bg-soil/95 transition-all uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Login"}
              </button>
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-stone-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-extrabold">
                <span className="bg-white px-2 text-stone-400">Or Bypass Rate Limits</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full focus-ring flex justify-center py-2.5 px-4 border border-soil/30 rounded-lg shadow-sm text-xs font-black text-soil bg-soil/5 hover:bg-soil/10 transition-all uppercase tracking-wider"
              >
                ⚡ Enter in Demo Mode ({role})
              </button>
            </div>
          </form>

          <div className="mt-5 text-center text-xs">
            <span className="text-stone-500">New to the platform? </span>
            <Link href="/register" className="font-bold text-soil hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
