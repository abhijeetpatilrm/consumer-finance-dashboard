import type { Metadata } from "next";
import { Suspense } from "react";
import TransactionsClient from "./TransactionsClient";

export const metadata: Metadata = {
  title: "Transactions — FinLens",
  description: "View and filter your transaction history.",
};

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsClient />
    </Suspense>
  );
}
