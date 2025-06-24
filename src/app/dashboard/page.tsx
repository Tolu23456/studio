import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ActivityHistory } from "@/components/dashboard/activity-history";
import { DailyRewards } from "@/components/dashboard/daily-rewards";

export default function DashboardPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <OverviewCards />
        <DailyRewards />
      </div>
      <ActivityHistory />
    </div>
  );
}
