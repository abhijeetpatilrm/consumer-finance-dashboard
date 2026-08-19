import type { Metadata } from "next";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Dashboard — FinLens",
  description: "Overview of your financial activity",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-heading-1">Dashboard</h1>
          <p className="text-caption mt-1">
            Your financial overview — full dashboard coming in Phase 2.
          </p>
        </div>
        <Badge variant="info">Phase 1 — Foundation</Badge>
      </div>

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-label">Backend</p>
          <p className="text-heading-2 mt-2 text-emerald-400">Running</p>
          <p className="text-caption mt-1">FastAPI · PostgreSQL · Alembic</p>
        </Card>
        <Card>
          <p className="text-label">Dataset</p>
          <p className="text-heading-2 mt-2">10,000 records</p>
          <p className="text-caption mt-1">Seeded · All formats normalized</p>
        </Card>
        <Card>
          <p className="text-label">Tests</p>
          <p className="text-heading-2 mt-2 text-emerald-400">43 passed</p>
          <p className="text-caption mt-1">Normalizer · Rewards · Health</p>
        </Card>
      </div>

      {/* Placeholder for Phase 2 content */}
      <EmptyState
        title="Dashboard coming in Phase 2"
        description="Transaction table, spending analytics, and rewards overview will appear here."
        icon="chart"
      />
    </div>
  );
}
