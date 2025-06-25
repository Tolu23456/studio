
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import { Label } from "../ui/label";


const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

export function ForgotPasswordForm() {
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
        email: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!auth) return;
        try {
            await sendPasswordResetEmail(auth, values.email);
            toast({
                title: "Password Reset Email Sent",
                description: "Please check your inbox for instructions.",
            });
            router.push("/login");
        } catch (error: any) {
            console.error("Password reset failed:", error);
            toast({
                variant: "destructive",
                title: "Error Sending Email",
                description: "Could not send password reset email. Please check the address and try again.",
            });
        }
    }

  if (!isFirebaseConfigured) {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Forgot Password</CardTitle>
                <CardDescription>
                    Enter your email and we&apos;ll send you a link to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive" className="mb-4">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Feature Disabled</AlertTitle>
                    <AlertDescription>
                        Firebase is not configured correctly. This feature is unavailable.
                    </AlertDescription>
                </Alert>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email-disabled">Email</Label>
                        <Input id="email-disabled" placeholder="name@example.com" disabled />
                    </div>
                    <Button type="submit" className="w-full" disabled>
                        Send Reset Link
                    </Button>
                </div>
                 <div className="mt-4 text-center text-sm">
                    Remember your password?{" "}
                    <span className="underline text-muted-foreground cursor-not-allowed">
                        Login
                    </span>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Forgot Password</CardTitle>
        <CardDescription>
            Enter your email and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
            </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Remember your password?{" "}
          <Link href="/login" className="underline">
            Login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
