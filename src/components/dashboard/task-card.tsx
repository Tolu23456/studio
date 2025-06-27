
'use client';

import { useState } from "react";
import Image from "next/image";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/lib/types";
import { CheckCircle, Zap, ExternalLink, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { claimTaskReward } from "@/services/user-data";
import { cn } from "@/lib/utils";

type TaskCardProps = {
  task: Task;
  onTaskClaimed: (taskId: string) => void;
};

export function TaskCard({ task, onTaskClaimed }: TaskCardProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleClaim = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "You must be logged in to claim rewards." });
        return;
    }
    setIsClaiming(true);
    try {
        await claimTaskReward(task.id);
        toast({
            title: "Reward Claimed!",
            description: `You've earned ${task.reward} Cubes.`,
        });
        onTaskClaimed(task.id);
    } catch (error: any) {
        console.error("Failed to claim reward", error);
        toast({ variant: "destructive", title: "Claiming failed", description: error.message || "Could not claim your reward. Please try again." });
    } finally {
        setIsClaiming(false);
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1.5 flex flex-col">
      <CardHeader className="p-0">
        <Image
          src={task.imageUrl}
          alt={task.title}
          width={600}
          height={400}
          className="object-cover aspect-video"
          data-ai-hint={task.dataAiHint}
        />
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="font-headline text-lg">{task.title}</CardTitle>
        <CardDescription className="mt-1">{task.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 bg-muted/50 mt-auto grid grid-cols-2 gap-2">
        {task.taskUrl ? (
            <a href={task.taskUrl} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Start Task
            </a>
        ) : (
            <Button variant="outline" className="w-full" disabled>
                Details
            </Button>
        )}
        <Button onClick={handleClaim} disabled={isClaiming} className="w-full">
            {isClaiming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Claim {task.reward} <Zap className="ml-1 h-4 w-4" />
              </>
            )}
        </Button>
      </CardFooter>
    </Card>
  );
}
