"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { generateAvatar } from "@/ai/flows/generate-avatar-flow";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  PlaySquare,
  Settings,
  User,
  Wallet,
  Zap,
} from "lucide-react";

export default function DashboardHeader() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user) {
        setLoadingAvatar(false);
        return;
      }
      
      const storedAvatar = sessionStorage.getItem(`avatar_${user.uid}`);
      if (storedAvatar) {
        setAvatarUrl(storedAvatar);
        setLoadingAvatar(false);
        return;
      }

      setLoadingAvatar(true);
      try {
        const result = await generateAvatar();
        setAvatarUrl(result.avatarDataUri);
        sessionStorage.setItem(`avatar_${user.uid}`, result.avatarDataUri);
      } catch (error) {
        console.error("Failed to generate avatar:", error);
        setAvatarUrl("https://placehold.co/36x36.png"); // fallback
      } finally {
        setLoadingAvatar(false);
      }
    };

    if (user) {
        fetchAvatar();
    }
  }, [user]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <Zap className="h-5 w-5 transition-all group-hover:scale-110" />
              <span className="sr-only">AdBoost</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/watch-ads"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <PlaySquare className="h-5 w-5" />
              Watch Ads
            </Link>
            <Link
              href="/dashboard/wallet"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Wallet className="h-5 w-5" />
              Wallet
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathSegments.slice(1).map((segment, index) => (
             <React.Fragment key={segment}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {index === pathSegments.length - 2 ? (
                  <BreadcrumbPage className="capitalize">{segment.replace('-', ' ')}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={`/dashboard/${pathSegments.slice(1, index + 2).join('/')}`} className="capitalize">{segment.replace('-', ' ')}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Future Search Bar */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            {loadingAvatar ? (
              <Skeleton className="h-full w-full rounded-full" />
            ) : (
              <Image
                src={avatarUrl || "https://placehold.co/36x36.png"}
                width={36}
                height={36}
                alt="Avatar"
                className="overflow-hidden rounded-full object-cover"
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut(auth)}>
               <LogOut className="mr-2 h-4 w-4" />
               Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
