import { createClient } from "@/lib/supabase/server";
import DistribusiKelasClient from "./DistribusiKelasClient";

export default async function DistribusiKelasPage() {
  const supabase = createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: allKelas } = await supabase
    .from("kelas")
    .select("*")
    .order("nama_kelas");

  const { data: todayLogs } = await supabase
    .from("log_makan")
    .select("*, kelas(*)")
    .eq("tanggal", today);

  return (
    <DistribusiKelasClient
      allKelas={allKelas ?? []}
      todayLogs={todayLogs ?? []}
      today={today}
    />
  );
}
