import { PublicNav } from "@/components/nav/PublicNav";
import { getCurrentUser } from "@/lib/auth";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is logged in
  let user = null;
  const currentUser = await getCurrentUser();

  if (currentUser && isServiceRoleConfigured()) {
    const supabase = getServiceClient();
    const { data } = await supabase
      .from("users")
      .select("full_name, avatar_url, role")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (data) {
      user = {
        id: currentUser.id,
        email: currentUser.email || "",
        fullName: data.full_name,
        avatarUrl: data.avatar_url,
        role: data.role,
      };
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav user={user} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
