import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Activity } from "@/lib/types";

const mockActivities: Activity[] = [
  { id: "1", type: "Ad Watch", description: "Watched 'TechGadget Pro' ad", cubes_earned: 15, date: "2024-05-22" },
  { id: "2", type: "Daily Login", description: "Daily login bonus - Day 5", cubes_earned: 50, date: "2024-05-22" },
  { id: "3", type: "Task Completion", description: "Completed 'Quick Survey'", cubes_earned: 100, date: "2024-05-21" },
  { id: "4", type: "Referral Bonus", description: "Bonus for user@example.com", cubes_earned: 500, date: "2024-05-21" },
  { id: "5", type: "Ad Watch", description: "Watched 'Healthy Snacks' ad", cubes_earned: 12, date: "2024-05-20" },
  { id: "6", type: "Game Play", description: "High score in 'Cube Runner'", cubes_earned: 25, date: "2024-05-20" },
];

export function ActivityHistory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          A log of your recent earnings on the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Cubes Earned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockActivities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <div className="font-medium">{activity.description}</div>
                  <div className="text-sm text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{activity.type}</Badge>
                </TableCell>
                <TableCell className="text-right text-green-600 font-semibold">+ {activity.cubes_earned}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
