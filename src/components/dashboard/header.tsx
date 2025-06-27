
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";

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
import { Button } from "@/components/ui/button";
import {
  Bell,
  LogOut,
  Settings,
  User,
  Zap,
  Shield,
  Badge,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function DashboardHeader() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const { userProfile, notifications } = useAuth();
  
  const unreadCount = notifications.filter(n => !n.read).length;


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex items-center gap-2">
        <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold md:hidden"
        >
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-bold">Adsener</span>
        </Link>
        <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
            <BreadcrumbItem>
                <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
            </BreadcrumbItem>
            {pathSegments.slice(1).map((segment, index) => {
                const isLast = index === pathSegments.length - 2;
                const href = `/${pathSegments.slice(0, index + 2).join('/')}`;
                return (
                <React.Fragment key={segment}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    {isLast ? (
                    <BreadcrumbPage className="capitalize">{segment.replace('-', ' ')}</BreadcrumbPage>
                    ) : (
                    <BreadcrumbLink asChild>
                        <Link href={href} className="capitalize">{segment.replace('-', ' ')}</Link>
                    </BreadcrumbLink>
                    )}
                </BreadcrumbItem>
                </React.Fragment>
                )
            })}
            </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="relative ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full h-9 w-9"
            >
              <Avatar className="h-full w-full">
                  <AvatarImage src={userProfile?.photoURL || undefined} alt="Avatar" />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
              <Link href="/dashboard/notifications" className="relative flex justify-between w-full">
                <div className='flex items-center'>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                </div>
                {unreadCount > 0 && 
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                        {unreadCount}
                    </div>
                }
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            {userProfile?.isAdmin && (
                <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="text-destructive hover:!text-destructive font-semibold">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                </Link>
                </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut(auth)}>
                 <LogOut className="mr-2 h-4 w-4" />
                 Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
