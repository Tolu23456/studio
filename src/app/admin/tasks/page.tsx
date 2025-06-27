
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
import { PlusCircle, Edit, Trash2, Loader2, AlertCircle, ClipboardList, Upload } from 'lucide-react';
import type { Task } from '@/lib/types';
import { getTasks, addTask, updateTask, deleteTask } from '@/services/user-data';
import Image from 'next/image';

const taskSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(1, 'Title is required.'),
    description: z.string().min(1, 'Description is required.'),
    reward: z.coerce.number().int().positive('Reward must be a positive number.'),
    imageUrl: z.string().min(1, 'Image is required.'),
    dataAiHint: z.string().optional(),
    taskUrl: z.string().url({ message: 'Please enter a valid URL.' }).or(z.literal("")).optional(),
    isEnabled: z.boolean(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function AdminTasksPage() {
    const { toast } = useToast();
    const [tasks, setTasks] = React.useState<Task[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<TaskFormData>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            title: '',
            description: '',
            reward: 100,
            imageUrl: '',
            dataAiHint: '',
            taskUrl: '',
            isEnabled: true,
        },
    });

    const fetchTasks = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const fetchedTasks = await getTasks();
            setTasks(fetchedTasks);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
            setError('Could not fetch the task list. Please check your network connection and Firestore security rules.');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleDialogOpen = (task: Task | null = null) => {
        setSelectedTask(task);
        if (task) {
            form.reset(task);
        } else {
            form.reset({
                title: '', description: '', reward: 100, imageUrl: '', dataAiHint: '', taskUrl: '', isEnabled: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleDeleteAlertOpen = (task: Task) => {
        setSelectedTask(task);
        setIsDeleteAlertOpen(true);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
          toast({
            variant: 'destructive',
            title: 'File Too Large',
            description: 'Please select an image smaller than 2MB.',
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUri = e.target?.result as string;
          form.setValue('imageUrl', dataUri, { shouldDirty: true, shouldValidate: true });
        };
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data: TaskFormData) => {
        setIsSaving(true);
        try {
            if (selectedTask?.id) {
                await updateTask(selectedTask.id, data);
                toast({ title: 'Task Updated', description: `'${data.title}' has been updated.` });
            } else {
                await addTask(data);
                toast({ title: 'Task Added', description: `'${data.title}' has been added.` });
            }
            await fetchTasks();
            setIsDialogOpen(false);
        } catch (err) {
            console.error('Failed to save task:', err);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the task.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTask?.id) return;
        try {
            await deleteTask(selectedTask.id);
            toast({ title: 'Task Deleted', description: `'${selectedTask.title}' has been deleted.` });
            await fetchTasks();
            setIsDeleteAlertOpen(false);
        } catch (err) {
            console.error('Failed to delete task:', err);
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete the task.' });
        }
    };

    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Task Management</h1>
                <Button onClick={() => handleDialogOpen()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Task
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Tasks</CardTitle>
                    <CardDescription>
                        Add, edit, or remove tasks available for users to complete.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Failed to Load Tasks</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : loading ? (
                        <div className="space-y-2">
                           {Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : tasks.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
                            <ClipboardList className="w-16 h-16 text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold">No Tasks Found</h3>
                            <p className="text-muted-foreground">Click "Add New Task" to get started.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Reward</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium">{task.title}</TableCell>
                                        <TableCell>{task.reward}</TableCell>
                                        <TableCell>
                                            <Badge variant={task.isEnabled ? 'default' : 'secondary'}>
                                                {task.isEnabled ? 'Enabled' : 'Disabled'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(task)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteAlertOpen(task)}>
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
                        <DialogTitle>{selectedTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the task below.
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
                            <Label htmlFor="taskUrl">Task URL (Optional)</Label>
                            <Input id="taskUrl" placeholder="https://example.com/my-task" {...form.register('taskUrl')} />
                             <p className="text-xs text-muted-foreground">Provide a URL for an external task. Users will manually claim the reward.</p>
                            {form.formState.errors.taskUrl && <p className="text-sm text-destructive">{form.formState.errors.taskUrl.message}</p>}
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="reward">Reward (Cubes)</Label>
                            <Input id="reward" type="number" {...form.register('reward')} />
                            {form.formState.errors.reward && <p className="text-sm text-destructive">{form.formState.errors.reward.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imageUrl">Task Image</Label>
                            <div className="flex items-center gap-4">
                                <div className="w-48 h-28 relative rounded-md border bg-muted flex items-center justify-center">
                                    {form.watch('imageUrl') ? (
                                        <Image src={form.watch('imageUrl')} alt="Task preview" layout="fill" className="object-cover rounded-md" />
                                    ) : (
                                        <ClipboardList className="w-10 h-10 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Image
                                    </Button>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/png, image/jpeg, image/webp"
                            />
                             {form.formState.errors.imageUrl && <p className="text-sm text-destructive">{form.formState.errors.imageUrl.message}</p>}
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="dataAiHint">Image Hint (Optional)</Label>
                             <Input id="dataAiHint" placeholder="e.g. `checklist` or `survey`" {...form.register('dataAiHint')} />
                             <p className="text-xs text-muted-foreground">Provide one or two keywords to help find a better image for this task later.</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="isEnabled" checked={form.watch('isEnabled')} onCheckedChange={(checked) => form.setValue('isEnabled', checked)} />
                            <Label htmlFor="isEnabled">Enable this task for users</Label>
                        </div>
                         <DialogFooter className="pt-4 !justify-end">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Task
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
                            This action cannot be undone. This will permanently delete the task '{selectedTask?.title}'.
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
