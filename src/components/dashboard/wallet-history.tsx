
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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
import { Skeleton } from "../ui/skeleton";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { TransactionReceipt } from "./transaction-receipt";

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
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTransactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: (data.date as Timestamp).toDate(),
        } as Transaction;
      });
      setTransactions(userTransactions);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching real-time transactions: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsReceiptOpen(true);
  };
  
  const handleRowClick = (transaction: Transaction) => {
    // Check for window to ensure this runs only on the client
    // 640px is the default 'sm' breakpoint in Tailwind
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      handleViewReceipt(transaction);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
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
                <TableHead>Amount</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell className="text-right hidden sm:table-cell"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : transactions.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                          No transactions yet.
                      </TableCell>
                  </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow 
                    key={transaction.id}
                    onClick={() => handleRowClick(transaction)}
                    className="sm:cursor-auto cursor-pointer"
                  >
                    <TableCell>
                      <div className="font-medium">{transaction.description}</div>
                      <div className="text-sm text-muted-foreground">{format(transaction.date, 'Pp')}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="capitalize">{transaction.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={getStatusBadgeVariant(transaction.status)} className="capitalize">{transaction.status}</Badge>
                    </TableCell>
                    <TableCell className={cn("font-semibold", transaction.amount > 0 ? "text-success" : "text-destructive")}>
                      {transaction.amount > 0 ? `+${transaction.amount.toLocaleString()}` : transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      <Button variant="ghost" size="icon" onClick={() => handleViewReceipt(transaction)} aria-label="View Receipt">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="sm:max-w-xl p-0 overflow-y-auto">
          <DialogHeader className="mb-4 p-6 pb-0">
            <DialogTitle>Transaction Receipt</DialogTitle>
            {selectedTransaction && <DialogDescription>
              Official receipt for transaction ID: {selectedTransaction.id}
            </DialogDescription>}
          </DialogHeader>
           <div className="p-6 pt-0">
            <TransactionReceipt transaction={selectedTransaction} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
