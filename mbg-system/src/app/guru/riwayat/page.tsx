import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GuruRiwayatClient from "./GuruRiwayatClient";

export default async function GuruRiwayatPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const kelasId = user.user_metadata?.kelas_id as string | undefined;
  if (!kelasId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Akun belum terhubung ke kelas.</p>
      </div>
    );
  }

  const { data: logs } = await supabase
    .from("log_makan")
    .select("*, kelas(*)")
    .eq("kelas_id", kelasId)
    .order("tanggal", { ascending: false })
    .limit(30);

  return <GuruRiwayatClient logs={logs ?? []} />;
}
