import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

export default async function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.user_metadata?.role !== "guru") redirect("/admin");

  const userName = (user.user_metadata?.nama as string) ?? user.email ?? "Guru";
  const kelasId = user.user_metadata?.kelas_id as string | undefined;

  let kelasName: string | undefined;
  if (kelasId) {
    const { data } = await supabase
      .from("kelas")
      .select("nama_kelas")
      .eq("id", kelasId)
      .single();
    kelasName = data?.nama_kelas;
  }

  return (
    <AppShell role="guru" userName={userName} kelasName={kelasName}>
      {children}
    </AppShell>
  );
}
