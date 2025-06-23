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

const mockTransactions: Transaction[] = [
    { id: "txn1", type: "reward", description: "Watched 'TechGadget Pro' ad", amount: 15, date: "2024-05-22", status: "completed" },
    { id: "txn2", type: "reward", description: "Daily login bonus - Day 5", amount: 50, date: "2024-05-22", status: "completed" },
    { id: "txn3", type: "withdrawal", description: "Redeemed for $5 Gift Card", amount: -5000, date: "2024-05-21", status: "completed" },
    { id: "txn4", type: "reward", description: "Completed 'Quick Survey'", amount: 100, date: "2024-05-21", status: "completed" },
    { id: "txn5", type: "reward", description: "Bonus for user@example.com", amount: 500, date: "2024-05-21", status: "completed" },
    { id: "txn6", type: "purchase", description: "Entered 'Super Raffle'", amount: -50, date: "2024-05-20", status: "completed" },
    { id: "txn7", type: "reward", description: "High score in 'Cube Runner'", amount: 25, date: "2024-05-20", status: "completed" },
    { id: "txn8", type: "withdrawal", description: "Redeemed for $10 Gift Card", amount: -10000, date: "2024-05-19", status: "pending" },
];

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
            {mockTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="capitalize">{transaction.type}</Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={getStatusBadgeVariant(transaction.status)} className="capitalize">{transaction.status}</Badge>
                </TableCell>
                <TableCell className={cn("text-right font-semibold", transaction.amount > 0 ? "text-green-600" : "text-destructive")}>
                  {transaction.amount > 0 ? `+${transaction.amount.toLocaleString()}` : transaction.amount.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
