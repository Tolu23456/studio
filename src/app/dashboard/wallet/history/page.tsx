
import { WalletHistory } from "@/components/dashboard/wallet-history";

export default function WalletHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight font-headline">Transaction History</h1>
      <WalletHistory />
    </div>
  );
}
