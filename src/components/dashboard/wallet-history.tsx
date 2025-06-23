"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { getTransactions } from "@/services/user-data";
import { Skeleton } from "../ui/skeleton";

const getStatusBadgeVariant = (status: Transaction['status']) => {
    switch (status) {
        case "completed":
            return "default";
        case "pending":
            return "secondary";
        case "failed":
            return "destructive";
    }
}

export function WalletHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      if (!user) return;
      setLoading(true);
      try {
        const userTransactions = await getTransactions(user.uid);
        setTransactions(userTransactions);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          A complete record of your Cube earnings and spending.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="hidden sm:table-cell">Type</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No transactions yet.
                    </TableCell>
                </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-muted-foreground">{transaction.date.toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="capitalize">{transaction.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={getStatusBadgeVariant(transaction.status)} className="capitalize">{transaction.status}</Badge>
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", transaction.amount > 0 ? "text-success" : "text-destructive")}>
                    {transaction.amount > 0 ? `+${transaction.amount.toLocaleString()}` : transaction.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
