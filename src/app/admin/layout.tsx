
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHeader from "@/components/admin/header";
import { useAuth } from "@/context/auth-context";
import { Shield } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!userProfile?.isAdmin) {
        // If user is logged in but not an admin, redirect to user dashboard
        router.push("/dashboard");
      }
    }
  }, [user, userProfile, loading, router]);

  // Show a loading state while we verify auth and admin status
  if (loading || !userProfile?.isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Shield className="h-8 w-8 animate-pulse text-destructive" />
      </div>
    );
  }

  // Render the admin layout for verified admins
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AdminSidebar />
      <div className="flex flex-1 flex-col sm:pl-14">
        <AdminHeader />
        <main className="flex-1 p-4 sm:px-6 sm:py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
