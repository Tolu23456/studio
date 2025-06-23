import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, Award, BarChart } from "lucide-react";

export function OverviewCards() {
  const stats = [
    {
      title: "Cube Balance",
      value: "12,530",
      icon: <Zap className="h-4 w-4 text-muted-foreground" />,
      description: "Your current spendable Cubes"
    },
    {
      title: "Total Earned",
      value: "85,210",
      icon: <Award className="h-4 w-4 text-muted-foreground" />,
      description: "Lifetime Cube earnings"
    },
    {
      title: "Referrals",
      value: "12",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      description: "Users you have referred"
    },
    {
      title: "Tasks Completed",
      value: "152",
      icon: <BarChart className="h-4 w-4 text-muted-foreground" />,
      description: "Total tasks completed"
    }
  ];

  return (
    <>
      {stats.slice(0, 3).map((stat, index) => (
        <Card key={index} className={index === 0 ? "sm:col-span-2" : ""}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              {stat.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
