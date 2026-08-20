/**
 * StatusBadge — maps transaction status to the right Badge variant.
 * Single component to ensure consistent status rendering everywhere.
 */
import { Badge } from "@/components/ui/Badge";
import type { TransactionStatus } from "@/lib/api";

interface StatusBadgeProps {
  status: TransactionStatus;
}

const STATUS_MAP: Record<
  TransactionStatus,
  { variant: "success" | "error" | "pending"; label: string }
> = {
  SUCCESS: { variant: "success", label: "Success" },
  FAILED: { variant: "error", label: "Failed" },
  PENDING: { variant: "pending", label: "Pending" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { variant: "pending" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
