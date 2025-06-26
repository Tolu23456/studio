
"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
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
  LogOut,
  User,
  Shield
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminHeader() {
  const { userProfile } = useAuth();
  
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-destructive" />
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </div>
      
      <div className="relative ml-auto flex items-center gap-2 md:grow-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="overflow-hidden rounded-full h-9 w-9"
            >
              <Avatar className="h-full w-full">
                  <AvatarImage src={userProfile?.photoURL || undefined} alt="Admin Avatar" />
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
              <Link href="/admin/profile">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Link>
            </DropdownMenuItem>
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
