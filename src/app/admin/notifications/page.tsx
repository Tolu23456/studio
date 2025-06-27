import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell } from 'lucide-react';

export default function AdminNotificationsPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Notification Center</h1>
      <Card>
        <CardHeader>
          <CardTitle>Sent Notifications</CardTitle>
          <CardDescription>
            A log of all broadcast and individual messages sent by admins.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
                <Bell className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold">Coming Soon</h3>
                <p className="text-muted-foreground">A log of sent notifications will be available here in a future update.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
