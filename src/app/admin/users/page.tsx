
'use client';

import * as React from 'react';
import {
  File,
  MoreHorizontal,
  User as UserIcon,
  AlertCircle,
  Award,
  Loader2,
  UserCog,
  UserX,
  Eye,
  PlusCircle,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { type AdminUserView } from '@/lib/types';
import { format } from 'date-fns';
import { getAllUsersForAdmin, updateUserStatus, updateUserProfileAdmin } from '@/services/user-data';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = React.useState<AdminUserView[]>([]);
  const [filteredUsers, setFilteredUsers] = React.useState<AdminUserView[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedUser, setSelectedUser] = React.useState<AdminUserView | null>(null);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('all');

  const fetchUsers = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const fetchedUsers = await getAllUsersForAdmin();
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      setActiveTab('all');
    } catch (err: any) {
      console.error("Failed to fetch users:", err);
      setError("Could not fetch the user list. Please check your network connection and Firestore security rules.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  React.useEffect(() => {
      if (activeTab === 'all') {
          setFilteredUsers(users);
      } else if (activeTab === 'active') {
          setFilteredUsers(users.filter(u => u.status === 'Active'));
      } else if (activeTab === 'disabled') {
          setFilteredUsers(users.filter(u => u.status === 'Disabled'));
      }
  }, [activeTab, users]);

  const handleStatusToggle = async (user: AdminUserView) => {
    const newStatus = user.status === 'Active' ? 'Disabled' : 'Active';
    try {
      await updateUserStatus(user.id, newStatus);
      toast({
        title: 'User Status Updated',
        description: `${user.displayName}'s account has been ${newStatus.toLowerCase()}.`,
      });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Failed to update user status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: `Could not update status for ${user.displayName}.`,
      });
    }
  };
  
  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    const formData = new FormData(e.currentTarget);
    const displayName = formData.get('displayName') as string;
    const isAdmin = formData.get('isAdmin') === 'on';

    setIsSaving(true);
    try {
      await updateUserProfileAdmin(selectedUser.id, { displayName, isAdmin });
      toast({
        title: 'Profile Updated',
        description: `Successfully updated ${displayName}'s profile.`,
      });
      setIsEditOpen(false);
      fetchUsers(); // Refresh user list
    } catch (error) {
       console.error('Failed to update user profile:', error);
       toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: `Could not update profile for ${displayName}.`,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const openDialog = (user: AdminUserView, type: 'view' | 'edit') => {
    setSelectedUser(user);
    if (type === 'view') setIsViewOpen(true);
    if (type === 'edit') setIsEditOpen(true);
  }

  return (
    <>
      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="disabled">Disabled</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-7 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-7 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add User
                        </span>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                            For security reasons, new users should be created through the standard registration process. This ensures they set their own password securely.
                        </DialogDescription>
                    </DialogHeader>
                     <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </div>
        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View, manage, and take action on user accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                   <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Failed to Load Users</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                  </Alert>
              ) : (
                  <Table>
                  <TableHeader>
                      <TableRow>
                      <TableHead className="hidden w-[100px] sm:table-cell">
                          <span className="sr-only">Image</span>
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                          Role
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                          Date Joined
                      </TableHead>
                      <TableHead>
                          <span className="sr-only">Actions</span>
                      </TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                          <TableCell className="hidden sm:table-cell">
                              <Skeleton className="h-9 w-9 rounded-full" />
                          </TableCell>
                          <TableCell>
                              <Skeleton className="h-5 w-32" />
                              <Skeleton className="h-4 w-48 mt-1" />
                          </TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                          </TableRow>
                      ))
                      ) : (
                      filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                          <TableCell className="hidden sm:table-cell">
                              <Avatar className="h-9 w-9">
                              <AvatarImage
                                  src={user.photoURL}
                                  alt="Avatar"
                              />
                              <AvatarFallback>
                                  <UserIcon className="h-5 w-5" />
                              </AvatarFallback>
                              </Avatar>
                          </TableCell>
                          <TableCell className="font-medium">
                              <div className="font-semibold">{user.displayName}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                          </TableCell>
                          <TableCell>
                              <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                              {user.status}
                              </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                              {user.isAdmin ? <Badge variant="destructive">Admin</Badge> : 'User'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                              {format(user.createdAt, 'PP')}
                          </TableCell>
                          <TableCell>
                              <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => openDialog(user, 'view')}>
                                    <Eye className="mr-2 h-4 w-4"/> View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openDialog(user, 'edit')}>
                                    <UserCog className="mr-2 h-4 w-4"/> Edit User
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}
                                        className={user.status === 'Disabled' ? "text-success" : "text-destructive"}>
                                         <UserX className="mr-2 h-4 w-4"/>
                                         {user.status === 'Disabled' ? 'Enable User' : 'Disable User'}
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will {user.status === 'Disabled' ? 're-enable' : 'disable'} the account for {user.displayName}. They {user.status === 'Disabled' ? 'will be able to' : 'will not be able to'} log in.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleStatusToggle(user)}>Continue</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>

                              </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                          </TableRow>
                      ))
                      )}
                  </TableBody>
                  </Table>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* View User Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>User Profile</DialogTitle>
                <DialogDescription>
                    Details for {selectedUser?.displayName}.
                </DialogDescription>
            </DialogHeader>
            {selectedUser && (
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={selectedUser.photoURL} />
                            <AvatarFallback><UserIcon /></AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-lg">{selectedUser.displayName}</p>
                            <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                            <p className="text-xs text-muted-foreground">Joined: {format(selectedUser.createdAt, 'PPP')}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            <span><span className="font-semibold">{selectedUser.cubeBalance.toLocaleString()}</span> Cubes</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-primary" />
                            <span><span className="font-semibold">{selectedUser.totalEarned.toLocaleString()}</span> Earned</span>
                        </div>
                        <div className="font-semibold">Role:</div>
                        <div>{selectedUser.isAdmin ? 'Admin' : 'User'}</div>
                        <div className="font-semibold">Status:</div>
                        <div>{selectedUser.status}</div>
                         <div className="font-semibold">Disables:</div>
                        <div className="font-semibold text-destructive">{selectedUser.disableCount || 0}</div>
                    </div>
                </div>
            )}
             <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
             </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                    Modify details for {selectedUser?.displayName}. Changes are permanent.
                </DialogDescription>
            </DialogHeader>
            {selectedUser && (
                <form onSubmit={handleEditSave} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" name="displayName" defaultValue={selectedUser.displayName} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="isAdmin" className="font-semibold text-destructive">Admin Status</Label>
                        <Switch id="isAdmin" name="isAdmin" defaultChecked={selectedUser.isAdmin} />
                    </div>
                     <DialogFooter className='pt-4'>
                        <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSaving}>
                          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Changes
                        </Button>
                     </DialogFooter>
                </form>
            )}
        </DialogContent>
      </Dialog>
    </>
  );
}
