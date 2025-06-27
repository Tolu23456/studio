
'use client';

import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function TasksPage() {
  return (
    <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Complete Tasks & Earn</h1>
       
        <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <ClipboardList className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold">Tasks Coming Soon!</h3>
                <p className="text-muted-foreground">New opportunities to earn by completing tasks will be available here shortly.</p>
            </CardContent>
        </Card>
    </div>
  );
}
