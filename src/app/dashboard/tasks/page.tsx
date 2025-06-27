
'use client';

import { TaskCard } from "@/components/dashboard/task-card";
import type { Task } from "@/lib/types";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getTasks } from "@/services/user-data";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
        const allTasks = await getTasks();
        const availableTasks = allTasks.filter(task => task.isEnabled);
        setTasks(availableTasks);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, []);

  const handleTaskClaimed = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
  
  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Complete Tasks & Earn</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col">
                <Skeleton className="aspect-video w-full" />
                <div className="p-4 flex-grow">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                </div>
                <div className="p-4 bg-muted/50 mt-auto">
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Complete Tasks & Earn</h1>
        {tasks.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onTaskClaimed={handleTaskClaimed} />
              ))}
          </div>
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <ClipboardList className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold">No Tasks Available</h3>
                <p className="text-muted-foreground">The admin hasn't added any tasks yet. Check back later!</p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
