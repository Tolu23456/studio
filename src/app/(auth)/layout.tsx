"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-secondary/50">
        <Zap className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/50 p-4">
       <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center space-x-2 text-foreground/80 hover:text-foreground transition-colors">
            <Zap className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg font-headline">AdBoost</span>
        </Link>
       </div>
      {children}
    </div>
  );
}
