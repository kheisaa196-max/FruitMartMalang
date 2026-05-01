import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GuruAbsensiClient from "./GuruAbsensiClient";

export default async function GuruAbsensiPage() {
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

  const { data: kelas } = await supabase
    .from("kelas")
    .select("*")
    .eq("id", kelasId)
    .single();

  const today = new Date().toISOString().split("T")[0];
  const { data: todayLog } = await supabase
    .from("log_makan")
    .select("*")
    .eq("kelas_id", kelasId)
    .eq("tanggal", today)
    .maybeSingle();

  return (
    <GuruAbsensiClient
      kelas={kelas}
      todayLog={todayLog}
      userName={(user.user_metadata?.nama as string) ?? user.email ?? "Guru"}
    />
  );
}
