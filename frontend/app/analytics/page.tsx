import type { Metadata } from "next";
import AnalyticsClient from "./AnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics — FinLens",
  description: "Gain insights into your spending patterns.",
};

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
