import { createClient } from "@/lib/supabase/server";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  // Today's logs with kelas info
  const { data: todayLogs } = await supabase
    .from("log_makan")
    .select("*, kelas(*)")
    .eq("tanggal", today)
    .order("created_at", { ascending: false });

  // All kelas
  const { data: allKelas } = await supabase
    .from("kelas")
    .select("*")
    .order("nama_kelas");

  return (
    <AdminDashboardClient
      initialLogs={todayLogs ?? []}
      allKelas={allKelas ?? []}
    />
  );
}
