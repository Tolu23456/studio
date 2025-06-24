
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/lib/types';

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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export default function DashboardHeader() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const { userProfile, notifications, loading: authLoading } = useAuth();
  
  const loadingNotifications = authLoading;
  const hasUnread = notifications.some(n => !n.read);

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
            <Button variant="outline" size="icon" className="h-9 w-9 relative">
              <Bell className="h-4 w-4" />
              {hasUnread && <span className="absolute top-0.5 right-0.5 block h-2 w-2 rounded-full bg-primary ring-1 ring-background" />}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 md:w-96">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loadingNotifications ? (
              <div className="p-2 space-y-3">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-4 w-4 rounded-full mt-1" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                 <div className="flex items-start space-x-3">
                  <Skeleton className="h-4 w-4 rounded-full mt-1" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </div>
            ) : notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                        <div className="flex items-center justify-between w-full">
                            <p className="font-medium text-sm">{notification.title}</p>
                            {!notification.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground w-full">{notification.description}</p>
                        <p className="text-xs text-muted-foreground/80 w-full pt-1">
                            {formatDistanceToNow(notification.date, { addSuffix: true })}
                        </p>
                    </DropdownMenuItem>
                ))
            ) : (
              <p className="p-4 text-center text-sm text-muted-foreground">No new notifications</p>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center p-2">
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    View all notifications
                </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
