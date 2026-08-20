import type { Metadata } from "next";
import RewardsClient from "./RewardsClient";

export const metadata: Metadata = {
  title: "Rewards — FinLens",
  description: "Redeem your coins for exclusive rewards.",
};

export default function RewardsPage() {
  return <RewardsClient />;
}
