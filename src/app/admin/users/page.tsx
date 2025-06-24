
'use client';

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getAllUsers } from "@/services/user-data";
import type { UserProfile } from "@/lib/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const idToken = await user.getIdToken(true);
        const fetchedUsers = await getAllUsers(idToken);
        setUsers(fetchedUsers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("You do not have permission to view this page or an error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold tracking-tight font-headline">User Management</h1>
      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>A list of all users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
                <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Cube Balance</TableHead>
                <TableHead>Total Earned</TableHead>
                <TableHead className="hidden sm:table-cell">Joined On</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                        </TableRow>
                    ))
                ) : error ? (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center text-destructive">
                            {error}
                        </TableCell>
                    </TableRow>
                ) : users.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No users found.
                        </TableCell>
                    </TableRow>
                ) : (
                users.map((profile) => (
                    <TableRow key={profile.uid}>
                        <TableCell>
                            <div className="font-medium">{profile.email}</div>
                            <div className="text-xs text-muted-foreground font-mono">{profile.uid}</div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{profile.cubeBalance.toLocaleString()}</Badge>
                        </TableCell>
                        <TableCell>{profile.totalEarned.toLocaleString()}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                            {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                    </TableRow>
                ))
                )}
            </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
