
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/sidebar";
import DashboardHeader from "@/components/dashboard/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/context/auth-context";
import { Zap } from "lucide-react";
import { GlobalPopup } from "@/components/dashboard/global-popup";
import { StatusOverlay } from "@/components/dashboard/status-overlay";
import { ReenableWarningPopup } from "@/components/dashboard/reenable-warning-popup";
import { NotificationPopupController } from "@/components/dashboard/notification-popup-controller";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userProfile, platformSettings, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.emailVerified) {
        router.push("/please-verify");
      }
    }
  }, [user, loading, router]);

  if (loading || !user || !user.emailVerified) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/40">
        <Zap className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  const isMaintenance = platformSettings?.maintenanceMode && !userProfile?.isAdmin;
  const isDisabled = userProfile?.status === 'Disabled';

  if (isMaintenance || isDisabled) {
    return <StatusOverlay isMaintenance={isMaintenance} />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <DashboardSidebar />
        <div className="flex flex-1 flex-col sm:pl-14">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:px-6 sm:py-4 md:gap-8 pb-20">
            {children}
          </main>
        </div>
        <GlobalPopup />
        {userProfile?.showReenableWarning && <ReenableWarningPopup />}
        <NotificationPopupController />
      </div>
    </SidebarProvider>
  );
}
