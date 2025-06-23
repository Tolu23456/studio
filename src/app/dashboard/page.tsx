
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ActivityHistory } from "@/components/dashboard/activity-history";
import { DailyRewards } from "@/components/dashboard/daily-rewards";
import { PersonalizedTasks } from "@/components/dashboard/personalized-tasks";

export default function DashboardPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <OverviewCards />
        <DailyRewards />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <div className="xl:col-span-2">
            <ActivityHistory />
        </div>
        <div>
            <PersonalizedTasks />
        </div>
      </div>
    </div>
  );
}
