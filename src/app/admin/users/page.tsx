'use client';

import * as React from 'react';
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AdminUserView } from '@/lib/types';
import { format } from 'date-fns';

const mockUsers: AdminUserView[] = [
  {
    id: 'usr_1',
    photoURL: 'https://placehold.co/40x40.png',
    displayName: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    status: 'Active',
    createdAt: new Date('2023-11-15'),
    lastLogin: new Date('2024-07-18'),
    isAdmin: false,
  },
  {
    id: 'usr_2',
    displayName: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    status: 'Active',
    createdAt: new Date('2023-10-20'),
    lastLogin: new Date('2024-07-19'),
    isAdmin: false,
  },
  {
    id: 'usr_3',
    displayName: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    status: 'Disabled',
    createdAt: new Date('2023-09-01'),
    lastLogin: new Date('2024-06-01'),
    isAdmin: false,
  },
  {
    id: 'usr_4',
    photoURL: 'https://placehold.co/40x40.png',
    displayName: 'William Kim',
    email: 'will@email.com',
    status: 'Active',
    createdAt: new Date('2024-01-10'),
    lastLogin: new Date('2024-07-20'),
    isAdmin: true,
  },
  {
    id: 'usr_5',
    displayName: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    status: 'Active',
    createdAt: new Date('2024-03-25'),
    lastLogin: new Date('2024-07-15'),
    isAdmin: false,
  },
];

export default function AdminUsersPage() {
  const { toast } = useToast();

  const handleAction = (action: string, userName: string) => {
    toast({
      title: 'Action Triggered',
      description: `${action} for ${userName} (demo only).`,
    });
  };

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="disabled">Disabled</TabsTrigger>
          <TabsTrigger value="admin" className="hidden sm:flex">
            Admins
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Filter
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Status
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Role</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-7 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" className="h-7 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add User
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View, manage, and take action on user accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    Last Login
                  </TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((user) => (
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
                      {format(user.lastLogin, 'PPpp')}
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
                          <DropdownMenuItem
                            onClick={() => handleAction('View profile', user.displayName)}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction('Edit', user.displayName)}
                          >
                            Edit
                          </DropdownMenuItem>
                           <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleAction('Disable', user.displayName)}
                          >
                            Disable
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-5</strong> of <strong>{mockUsers.length}</strong> users
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
