import { createClient } from "@/lib/supabase/server";
import AdminKelasClient from "./AdminKelasClient";

export default async function AdminKelasPage() {
  const supabase = createClient();
  const { data: kelas } = await supabase
    .from("kelas")
    .select("*")
    .order("nama_kelas");

  return <AdminKelasClient initialKelas={kelas ?? []} />;
}
