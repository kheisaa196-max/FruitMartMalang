import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.user_metadata?.role !== "admin") redirect("/guru");

  const userName =
    (user.user_metadata?.nama as string) ?? user.email ?? "Admin";

  return (
    <AppShell role="admin" userName={userName}>
      {children}
    </AppShell>
  );
}
