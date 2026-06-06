import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/dashboard/Header";
import ProfileClient from "@/components/profile/ProfileClient";
import { getProfile } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Profile — ATPL Past Year",
  description: "Manage your user profile.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300" style={{ background: "var(--bg-main)" }}>
      <Header email={user.email || ""} />
      
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8 mt-4 sm:mt-12 animate-fade-in">
        <h1 className="text-3xl font-extrabold mb-8 tracking-tight" style={{ color: "var(--text-primary)" }}>
          User Profile
        </h1>
        
        <ProfileClient 
          userId={user.id} 
          initialDisplayName={profile?.display_name || ""} 
          initialEmail={user.email || ""} 
        />
      </main>
    </div>
  );
}
