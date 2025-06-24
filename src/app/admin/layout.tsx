
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Shield } from "lucide-react";
import AdminSidebar from "@/components/admin/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Shield className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
      <div className="flex min-h-screen w-full bg-muted/40">
        <AdminSidebar />
        <div className="flex flex-col flex-grow sm:pl-64">
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
  );
}
