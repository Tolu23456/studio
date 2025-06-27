
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell, Eye, AlertCircle } from 'lucide-react';
import type { SentNotificationLog } from '@/lib/types';
import { getSentNotificationsLog } from '@/services/user-data';
import { format, formatDistanceToNow } from 'date-fns';

export default function AdminNotificationsPage() {
  const [logs, setLogs] = useState<SentNotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<SentNotificationLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true);
        setError(null);
        const fetchedLogs = await getSentNotificationsLog();
        setLogs(fetchedLogs);
      } catch (err) {
        console.error('Failed to fetch notification logs:', err);
        setError('Could not fetch the notification log. Please check your network connection and Firestore security rules.');
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const handleViewDetails = (log: SentNotificationLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Sent Notifications Log</h1>
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
          <CardDescription>
            A log of all broadcast and individual messages sent by admins. Note: Placeholders like '{{username}}' are shown as they were sent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to Load Logs</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
              <Bell className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold">No Messages Sent</h3>
              <p className="text-muted-foreground">Go to the 'Send Message' page to send a notification.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Target</TableHead>
                  <TableHead className="hidden md:table-cell">Sent By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium truncate max-w-xs">{log.title}</TableCell>
                    <TableCell className="hidden sm:table-cell capitalize">{log.target}</TableCell>
                    <TableCell className="hidden md:table-cell">{log.adminDisplayName}</TableCell>
                    <TableCell>{formatDistanceToNow(log.timestamp, { addSuffix: true })}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetails(log)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedLog?.title}</DialogTitle>
            <DialogDescription>
              Sent to {selectedLog?.target} on {selectedLog ? format(selectedLog.timestamp, 'PPp') : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedLog?.isHtml ? (
            <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border p-4 bg-secondary">
              <iframe
                srcDoc={selectedLog.description}
                title="HTML Preview"
                className="w-full h-full border-0 min-h-[200px]"
                sandbox="allow-scripts"
              />
            </div>
          ) : (
             <p className='text-sm text-muted-foreground whitespace-pre-wrap bg-secondary p-4 rounded-md'>{selectedLog?.description}</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
