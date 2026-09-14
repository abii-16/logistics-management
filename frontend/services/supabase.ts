import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://krenzgkwgusmpauxuloe.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_CCdZDjrCqHwO1U1NMTrSmg_3lGyltxT";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
