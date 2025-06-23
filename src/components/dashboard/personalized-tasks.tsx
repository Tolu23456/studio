"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, RotateCw } from "lucide-react";
import { getPersonalizedTaskSuggestions } from "@/ai/flows/personalized-task-suggestions";
import { useToast } from "@/hooks/use-toast";

export function PersonalizedTasks() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Mock user data
      const mockInput = {
        userActivityHistory: "Completed 5 surveys, watched 20 video ads, played 'Cube Runner' 10 times.",
        userPreferences: "Prefers surveys and short video ads. Dislikes downloading apps.",
      };
      const result = await getPersonalizedTaskSuggestions(mockInput);
      setSuggestions(result.suggestedTasks);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch personalized tasks. Please try again.",
      });
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          For You
        </CardTitle>
        <CardDescription>
          AI-powered suggestions to help you earn more Cubes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-4/5" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <ul className="space-y-2">
            {suggestions.map((task, index) => (
              <li key={index} className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm shrink-0">
                  Top Pick
                </Badge>
                <span className="text-sm text-muted-foreground">{task}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={fetchSuggestions} disabled={loading} className="w-full">
            <RotateCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Suggestions
        </Button>
      </CardFooter>
    </Card>
  );
}
