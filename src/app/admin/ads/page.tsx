
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2, AlertCircle, Film } from 'lucide-react';
import type { Ad } from '@/lib/types';
import { getAds, addAd, updateAd, deleteAd } from '@/services/user-data';

const adSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Title is required.'),
    description: z.string().min(1, 'Description is required.'),
    duration: z.coerce.number().int().positive('Duration must be a positive number.'),
    reward: z.coerce.number().int().positive('Reward must be a positive number.'),
    imageUrl: z.string().url('Must be a valid URL.'),
    dataAiHint: z.string().optional(),
    isEnabled: z.boolean(),
});

type AdFormData = z.infer<typeof adSchema>;

export default function AdminAdsPage() {
    const { toast } = useToast();
    const [ads, setAds] = React.useState<Ad[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
    const [selectedAd, setSelectedAd] = React.useState<Ad | null>(null);

    const form = useForm<AdFormData>({
        resolver: zodResolver(adSchema),
        defaultValues: {
            title: '',
            description: '',
            duration: 30,
            reward: 10,
            imageUrl: '',
            dataAiHint: '',
            isEnabled: true,
        },
    });

    const fetchAds = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedAds = await getAds();
            setAds(fetchedAds);
        } catch (err) {
            console.error('Failed to fetch ads:', err);
            setError('Could not fetch the ad list. Please check your network connection and Firestore security rules.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchAds();
    }, [fetchAds]);

    const handleDialogOpen = (ad: Ad | null = null) => {
        setSelectedAd(ad);
        if (ad) {
            form.reset(ad);
        } else {
            form.reset({
                title: '', description: '', duration: 30, reward: 10, imageUrl: '', dataAiHint: '', isEnabled: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleDeleteAlertOpen = (ad: Ad) => {
        setSelectedAd(ad);
        setIsDeleteAlertOpen(true);
    };
    
    const onSubmit = async (data: AdFormData) => {
        setIsSaving(true);
        try {
            if (selectedAd?.id) {
                await updateAd(selectedAd.id, data);
                toast({ title: 'Ad Updated', description: `'${data.title}' has been updated.` });
            } else {
                await addAd(data);
                toast({ title: 'Ad Added', description: `'${data.title}' has been added.` });
            }
            await fetchAds();
            setIsDialogOpen(false);
        } catch (err) {
            console.error('Failed to save ad:', err);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the ad.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedAd?.id) return;
        try {
            await deleteAd(selectedAd.id);
            toast({ title: 'Ad Deleted', description: `'${selectedAd.title}' has been deleted.` });
            await fetchAds();
            setIsDeleteAlertOpen(false);
        } catch (err) {
            console.error('Failed to delete ad:', err);
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the ad.' });
        }
    };

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Ad Management</h1>
                <Button onClick={() => handleDialogOpen()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Ad
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Ads</CardTitle>
                    <CardDescription>
                        Add, edit, or remove ads available for users to watch.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Failed to Load Ads</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : loading ? (
                        <div className="space-y-2">
                           {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : ads.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
                            <Film className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold">No Ads Found</h3>
                            <p className="text-muted-foreground">Click "Add New Ad" to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Reward</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ads.map((ad) => (
                                    <TableRow key={ad.id}>
                                        <TableCell className="font-medium">{ad.title}</TableCell>
                                        <TableCell>{ad.duration}s</TableCell>
                                        <TableCell>{ad.reward}</TableCell>
                                        <TableCell>
                                            <Badge variant={ad.isEnabled ? 'default' : 'secondary'}>
                                                {ad.isEnabled ? 'Enabled' : 'Disabled'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(ad)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAlertOpen(ad)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedAd ? 'Edit Ad' : 'Add New Ad'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the ad below.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" {...form.register('title')} />
                            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...form.register('description')} />
                            {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duration (seconds)</Label>
                                <Input id="duration" type="number" {...form.register('duration')} />
                                {form.formState.errors.duration && <p className="text-sm text-destructive">{form.formState.errors.duration.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reward">Reward (Cubes)</Label>
                                <Input id="reward" type="number" {...form.register('reward')} />
                                {form.formState.errors.reward && <p className="text-sm text-destructive">{form.formState.errors.reward.message}</p>}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <Input id="imageUrl" placeholder="https://placehold.co/600x400.png" {...form.register('imageUrl')} />
                            {form.formState.errors.imageUrl && <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dataAiHint">Image Hint</Label>
                            <Input id="dataAiHint" placeholder="e.g. tech gadget" {...form.register('dataAiHint')} />
                            {form.formState.errors.dataAiHint && <p className="text-sm text-destructive">{form.formState.errors.dataAiHint.message}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="isEnabled" checked={form.watch('isEnabled')} onCheckedChange={(checked) => form.setValue('isEnabled', checked)} />
                            <Label htmlFor="isEnabled">Enable this ad for users</Label>
                        </div>
                         <DialogFooter className="pt-4 !justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Ad
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

             <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the ad '{selectedAd?.title}'.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
