"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";
import { useRouter } from "next/navigation";

export function useAuth(requiredRole?: "farmer" | "driver" | "admin") {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        let session: any = null;
        if (typeof window !== "undefined") {
          const localDemo = localStorage.getItem("kb_demo_session");
          if (localDemo) {
            try {
              session = JSON.parse(localDemo);
            } catch (e) {
              console.error("Failed to parse demo session", e);
            }
          }
        }

        if (!session) {
          const { data } = await supabase.auth.getSession();
          session = data?.session;
        }

        if (!session) {
          if (requiredRole) {
            router.push("/login");
          } else {
            setLoading(false);
          }
          return;
        }

        let profile: any = null;
        if (session.user?.user_metadata?.is_mock) {
          profile = session.user.user_metadata;
        } else {
          // Fetch user profile from database
          const { data: dbProfile, error: dbError } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();
          
          if (!dbProfile || dbError) {
            console.warn("User profile not found, signing out:", dbError);
            await supabase.auth.signOut();
            router.push("/login");
            return;
          }
          profile = dbProfile;
        }

        if (requiredRole) {
          // Admins can access everything, others must match requiredRole
          if (profile.role !== "admin" && profile.role !== requiredRole) {
            router.push(profile.role === "farmer" ? "/farmer" : "/driver/loads");
            return;
          }
        }

        let roleProfile = {};
        if (profile.role === "driver") {
          const { data: driverProfile } = await supabase
            .from("drivers")
            .select("id, reliability_score, completed_trips, rating")
            .eq("user_id", profile.id)
            .maybeSingle();
          if (driverProfile) {
            roleProfile = {
              driverId: driverProfile.id,
              reliability_score: driverProfile.reliability_score || 94,
              completed_trips: driverProfile.completed_trips || 0,
              rating: driverProfile.rating || 4.8
            };
          }
        } else if (profile.role === "farmer") {
          const { data: farmerProfile } = await supabase
            .from("farmers")
            .select("village, preferred_language")
            .eq("user_id", profile.id)
            .maybeSingle();
          if (farmerProfile) {
            roleProfile = {
              village: farmerProfile.village,
              preferred_language: farmerProfile.preferred_language
            };
          }
        }

        setUser({ ...session.user, ...profile, ...roleProfile });
      } catch (err) {
        console.error("Auth check error:", err);
        if (requiredRole) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [requiredRole, router]);

  return { user, loading };
}
