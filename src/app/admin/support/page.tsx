'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { LifeBuoy, AlertCircle, CheckCircle, Mail, Eye } from 'lucide-react';
import type { SupportTicket } from '@/lib/types';
import { getSupportTickets, updateSupportTicketStatus } from '@/services/user-data';
import { useAuth } from '@/context/auth-context';
import { format, formatDistanceToNow } from 'date-fns';

export default function AdminSupportPage() {
    const { toast } = useToast();
    const { userProfile } = useAuth();
    const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = React.useState<SupportTicket | null>(null);
    const [isDetailViewOpen, setIsDetailViewOpen] = React.useState(false);
    const [isResolveAlertOpen, setIsResolveAlertOpen] = React.useState(false);

    const fetchTickets = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedTickets = await getSupportTickets();
            setTickets(fetchedTickets);
        } catch (err) {
            console.error('Failed to fetch support tickets:', err);
            setError('Could not fetch the support tickets. Please check your network connection and Firestore security rules.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);
    
    const handleViewDetails = (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setIsDetailViewOpen(true);
    }
    
    const handleResolveAlertOpen = (ticket: SupportTicket) => {
        setSelectedTicket(ticket);
        setIsResolveAlertOpen(true);
    }

    const handleResolveTicket = async () => {
        if (!selectedTicket || !userProfile) return;
        try {
            await updateSupportTicketStatus(selectedTicket.id, 'resolved', userProfile.displayName);
            toast({ title: 'Ticket Resolved', description: `Ticket from ${selectedTicket.userDisplayName} has been marked as resolved.` });
            await fetchTickets();
            setIsResolveAlertOpen(false);
        } catch (err) {
            console.error('Failed to resolve ticket:', err);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not resolve the ticket.' });
        }
    };
    
    const getBadgeVariant = (status: 'open' | 'resolved') => status === 'open' ? 'destructive' : 'default';

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <h1 className="text-3xl font-bold tracking-tight font-headline">Support Tickets</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Support Tickets</CardTitle>
                    <CardDescription>
                        View and resolve issues submitted by users.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Failed to Load Tickets</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : loading ? (
                        <div className="space-y-2">
                           {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : tickets.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
                            <LifeBuoy className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold">No Tickets Found</h3>
                            <p className="text-muted-foreground">The support inbox is clear.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead className='hidden md:table-cell'>Message</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className='hidden sm:table-cell'>Submitted</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tickets.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium">
                                            <div>{ticket.userDisplayName}</div>
                                            <div className='text-xs text-muted-foreground'>{ticket.userEmail}</div>
                                        </TableCell>
                                        <TableCell className='hidden md:table-cell max-w-sm truncate'>{ticket.message}</TableCell>
                                        <TableCell>
                                            <Badge variant={getBadgeVariant(ticket.status)} className="capitalize">
                                                {ticket.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className='hidden sm:table-cell'>{formatDistanceToNow(ticket.createdAt, { addSuffix: true })}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(ticket)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {ticket.status === 'open' && (
                                                <Button variant="ghost" size="icon" onClick={() => handleResolveAlertOpen(ticket)}>
                                                    <CheckCircle className="h-4 w-4 text-success" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDetailViewOpen} onOpenChange={setIsDetailViewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ticket from {selectedTicket?.userDisplayName}</DialogTitle>
                        <DialogDescription>
                            Submitted {selectedTicket ? format(selectedTicket.createdAt, 'PPp') : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4 py-4'>
                        <p className='text-sm text-muted-foreground whitespace-pre-wrap bg-secondary p-4 rounded-md'>{selectedTicket?.message}</p>
                        <div className='text-xs space-y-1'>
                            <p><span className='font-semibold'>User ID:</span> {selectedTicket?.userId}</p>
                            <p><span className='font-semibold'>Email:</span> {selectedTicket?.userEmail}</p>
                        </div>
                        {selectedTicket?.status === 'resolved' && (
                            <div className='text-sm p-3 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'>
                                <p><span className='font-semibold'>Resolved by:</span> {selectedTicket.resolvedBy}</p>
                                <p><span className='font-semibold'>Resolved at:</span> {selectedTicket.resolvedAt ? format(selectedTicket.resolvedAt, 'PPp') : 'N/A'}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="!justify-between items-center">
                         <Button asChild>
                            <a href={`mailto:${selectedTicket?.userEmail}`}><Mail className='mr-2' /> Reply via Email</a>
                         </Button>
                         <Button onClick={() => setIsDetailViewOpen(false)} variant="outline">Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <AlertDialog open={isResolveAlertOpen} onOpenChange={setIsResolveAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark as Resolved?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will mark the ticket as resolved and notify the user. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResolveTicket} className="bg-success hover:bg-success/90">Mark Resolved</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}