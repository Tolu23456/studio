
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, PlusCircle } from 'lucide-react';

export default function AdminGamesPage() {
  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
       <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold tracking-tight font-headline">Game Management</h1>
         <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Game
         </Button>
       </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Games</CardTitle>
          <CardDescription>
            Add, edit, or remove games that are available for users to play and earn rewards.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
              <Gamepad2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold">Game Management Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This section is under construction. Soon you'll be able to dynamically add and configure new games for your platform right from this dashboard.
              </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
