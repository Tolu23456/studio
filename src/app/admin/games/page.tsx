
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
import { PlusCircle, Edit, Trash2, Loader2, AlertCircle, Gamepad2 } from 'lucide-react';
import type { Game } from '@/lib/types';
import { getGames, addGame, updateGame, deleteGame } from '@/services/user-data';

const gameSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Title is required.'),
    description: z.string().min(1, 'Description is required.'),
    rewardDescription: z.string().optional(),
    imageUrl: z.string().url('Must be a valid URL.'),
    dataAiHint: z.string().optional(),
    gameUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal("")).optional(),
    isEnabled: z.boolean(),
}).refine(data => {
    // If it's a built-in game (no URL), reward description is required.
    if (!data.gameUrl) {
        return !!data.rewardDescription && data.rewardDescription.length > 0;
    }
    // If it's an embedded game, reward description is not required.
    return true;
}, {
    message: "Reward description is required for built-in games.",
    path: ["rewardDescription"],
});


type GameFormData = z.infer<typeof gameSchema>;

export default function AdminGamesPage() {
    const { toast } = useToast();
    const [games, setGames] = React.useState<Game[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
    const [selectedGame, setSelectedGame] = React.useState<Game | null>(null);

    const form = useForm<GameFormData>({
        resolver: zodResolver(gameSchema),
        defaultValues: {
            title: '',
            description: '',
            rewardDescription: '',
            imageUrl: '',
            dataAiHint: '',
            gameUrl: '',
            isEnabled: true,
        },
    });

    const gameUrlValue = form.watch('gameUrl');

    const fetchGames = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedGames = await getGames();
            setGames(fetchedGames);
        } catch (err) {
            console.error('Failed to fetch games:', err);
            setError('Could not fetch the game list. Please check your network connection and Firestore security rules.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchGames();
    }, [fetchGames]);

    const handleDialogOpen = (game: Game | null = null) => {
        setSelectedGame(game);
        if (game) {
            form.reset(game);
        } else {
            form.reset({
                title: '', description: '', rewardDescription: '', imageUrl: '', gameUrl: '', dataAiHint: '', isEnabled: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleDeleteAlertOpen = (game: Game) => {
        setSelectedGame(game);
        setIsDeleteAlertOpen(true);
    };
    
    const onSubmit = async (data: GameFormData) => {
        setIsSaving(true);
        try {
            const submissionData = { ...data };
            if (submissionData.gameUrl) {
                // Ensure rewardDescription is not sent for embedded games
                delete submissionData.rewardDescription;
            }

            if (selectedGame?.id) {
                await updateGame(selectedGame.id, submissionData);
                toast({ title: 'Game Updated', description: `'${data.title}' has been updated.` });
            } else {
                await addGame(submissionData);
                toast({ title: 'Game Added', description: `'${data.title}' has been added.` });
            }
            await fetchGames();
            setIsDialogOpen(false);
        } catch (err) {
            console.error('Failed to save game:', err);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the game.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedGame?.id) return;
        try {
            await deleteGame(selectedGame.id);
            toast({ title: 'Game Deleted', description: `'${selectedGame.title}' has been deleted.` });
            await fetchGames();
            setIsDeleteAlertOpen(false);
        } catch (err) {
            console.error('Failed to delete game:', err);
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the game.' });
        }
    };

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Game Management</h1>
                <Button onClick={() => handleDialogOpen()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Game
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Games</CardTitle>
                    <CardDescription>
                        Add, edit, or remove games that are available for users to play.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Failed to Load Games</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : loading ? (
                        <div className="space-y-2">
                           {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : games.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
                            <Gamepad2 className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold">No Games Found</h3>
                            <p className="text-muted-foreground">Click "Add New Game" to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {games.map((game) => (
                                    <TableRow key={game.id}>
                                        <TableCell className="font-medium">{game.title}</TableCell>
                                        <TableCell>
                                            <Badge variant={game.gameUrl ? 'outline' : 'secondary'}>
                                                {game.gameUrl ? 'External' : 'Built-in'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={game.isEnabled ? 'default' : 'secondary'}>
                                                {game.isEnabled ? 'Enabled' : 'Disabled'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(game)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAlertOpen(game)}>
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
                        <DialogTitle>{selectedGame ? 'Edit Game' : 'Add New Game'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the game below.
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

                         <div className="space-y-2">
                            <Label htmlFor="gameUrl">Game URL (Optional)</Label>
                            <Input id="gameUrl" placeholder="https://example.com/my-game" {...form.register('gameUrl')} />
                             <p className="text-xs text-muted-foreground">Provide a URL for an external game. Leave blank for built-in games. Rewards for external games are not automatic.</p>
                            {form.formState.errors.gameUrl && <p className="text-sm text-destructive">{form.formState.errors.gameUrl.message}</p>}
                        </div>
                        
                        {!gameUrlValue && (
                            <div className="space-y-2">
                                <Label htmlFor="rewardDescription">Reward Description</Label>
                                <Input id="rewardDescription" placeholder="e.g. Higher score = more Cubes!" {...form.register('rewardDescription')} />
                                {form.formState.errors.rewardDescription && <p className="text-sm text-destructive">{form.formState.errors.rewardDescription.message}</p>}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Image URL</Label>
                            <Input id="imageUrl" placeholder="https://placehold.co/600x400.png" {...form.register('imageUrl')} />
                            {form.formState.errors.imageUrl && <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dataAiHint">Image Hint</Label>
                            <Input id="dataAiHint" placeholder="e.g. puzzle game" {...form.register('dataAiHint')} />
                            {form.formState.errors.dataAiHint && <p className="text-sm text-destructive">{form.formState.errors.dataAiHint.message}</p>}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="isEnabled" checked={form.watch('isEnabled')} onCheckedChange={(checked) => form.setValue('isEnabled', checked)} />
                            <Label htmlFor="isEnabled">Enable this game for users</Label>
                        </div>
                         <DialogFooter className="pt-4 !justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Game
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
                            This action cannot be undone. This will permanently delete the game '{selectedGame?.title}'.
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
