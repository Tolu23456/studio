
'use client';

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function ForgotPasswordPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect verified users away from forgot password page
        if (!loading && user?.emailVerified) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);
    
    return <ForgotPasswordForm />;
}
