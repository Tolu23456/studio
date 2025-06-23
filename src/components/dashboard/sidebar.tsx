
"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  PlaySquare,
  Wallet,
  LogOut,
  Zap,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";


export default function DashboardSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/watch-ads", icon: PlaySquare, label: "Watch Ads" },
    { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
    { href: "/dashboard/profile", icon: User, label: "Profile" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  const isLinkActive = (href: string) => {
    // Special case for the main dashboard page
    if (href === '/dashboard') {
      return pathname === href;
    }
    // For all other pages, check if the path starts with the href
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <TooltipProvider>
          <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
            <Link
              href="/dashboard"
              className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
            >
              <Zap className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">AdBoost</span>
            </Link>
            {navItems.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8",
                      isLinkActive(item.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
          <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => signOut(auth)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Logout</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          </nav>
        </TooltipProvider>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-background p-1 sm:hidden">
          {navItems.map((item) => (
              <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                      "flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs font-medium transition-colors",
                      isLinkActive(item.href)
                          ? "text-primary"
                          : "text-muted-foreground hover:bg-accent/80"
                  )}
              >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
              </Link>
          ))}
      </nav>
    </>
  );
}
