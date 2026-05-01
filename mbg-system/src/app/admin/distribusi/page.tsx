import { createClient } from "@/lib/supabase/server";
import AdminDistribusiClient from "./AdminDistribusiClient";

export default async function AdminDistribusiPage() {
  const supabase = createClient();

  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: logs } = await supabase
    .from("log_makan")
    .select("*, kelas(*)")
    .gte("tanggal", thirtyDaysAgo.toISOString().split("T")[0])
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: allKelas } = await supabase
    .from("kelas")
    .select("*")
    .order("nama_kelas");

  return (
    <AdminDistribusiClient logs={logs ?? []} allKelas={allKelas ?? []} />
  );
}
