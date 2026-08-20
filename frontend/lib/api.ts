/**
 * Typed API client for all backend endpoints.
 * Single source of truth for API contracts — mirrors Phase 2 Pydantic schemas.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------------------------------------------------------------------------
// HTTP primitives
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Primitive = string | number | boolean;

async function apiFetch<T>(
  path: string,
  params?: Record<string, Primitive | undefined | null>,
  init?: RequestInit
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      // ignore
    }
    throw new ApiError(
      response.status,
      `API error ${response.status}: ${response.statusText}`,
      body
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type TransactionStatus = "SUCCESS" | "FAILED" | "PENDING";
export type SortField =
  | "timestamp"
  | "amount"
  | "merchant"
  | "category"
  | "status";
export type SortOrder = "asc" | "desc";

// ---------------------------------------------------------------------------
// Transaction types
// ---------------------------------------------------------------------------

export interface Transaction {
  id: number;
  source_id: string;
  merchant: string;
  category: string;
  amount: string; // decimal as string from API
  currency: string;
  status: TransactionStatus;
  payment_method: string | null;
  transacted_at: string; // ISO 8601
}

export interface PaginatedTransactions {
  items: Transaction[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface TransactionFilters {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  status?: TransactionStatus;
  min_amount?: string;
  max_amount?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: SortField;
  sort_order?: SortOrder;
}

// ---------------------------------------------------------------------------
// Analytics types
// ---------------------------------------------------------------------------

export interface CategorySpend {
  category: string;
  total_amount: string; // decimal as string
  transaction_count: number;
}

export interface CategoryAnalytics {
  items: CategorySpend[];
  total_categories: number;
}

export interface MonthlySpend {
  year: number;
  month: number;
  month_label: string;
  total_amount: string; // decimal as string
  transaction_count: number;
}

export interface MonthlyAnalytics {
  items: MonthlySpend[];
}

// ---------------------------------------------------------------------------
// Rewards types
// ---------------------------------------------------------------------------

export interface RewardItem {
  id: number;
  name: string;
  description: string | null;
  cost_coins: number;
  is_active: boolean;
}

export interface RewardCatalogue {
  items: RewardItem[];
}

export interface CoinBalance {
  user_id: number;
  balance: number;
}

export interface RedemptionRequest {
  user_id: number;
  reward_id: number;
}

export interface RedemptionResponse {
  id: number;
  user_id: number;
  catalogue_item_id: number;
  coins_used: number;
  description: string;
  reward_name: string;
  redeemed_at: string;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: string;
  db: string;
}

// ---------------------------------------------------------------------------
// API client object
// ---------------------------------------------------------------------------

export const api = {
  health: () => apiFetch<HealthResponse>("/api/health"),

  transactions: {
    list: (filters: TransactionFilters = {}) =>
      apiFetch<PaginatedTransactions>("/api/transactions", {
        page: filters.page,
        page_size: filters.page_size,
        search: filters.search,
        category: filters.category,
        status: filters.status,
        min_amount: filters.min_amount,
        max_amount: filters.max_amount,
        start_date: filters.start_date,
        end_date: filters.end_date,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      }),
    get: (id: number) =>
      apiFetch<Transaction>(`/api/transactions/${id}`),
  },

  analytics: {
    category: () => apiFetch<CategoryAnalytics>("/api/analytics/category"),
    monthly: () => apiFetch<MonthlyAnalytics>("/api/analytics/monthly"),
  },

  rewards: {
    balance: () => apiFetch<CoinBalance>("/api/rewards/balance"),
    catalogue: () => apiFetch<RewardCatalogue>("/api/rewards"),
    redeem: (payload: RedemptionRequest) => 
      apiFetch<RedemptionResponse>(`/api/rewards/${payload.reward_id}/redeem`, undefined, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
} as const;
