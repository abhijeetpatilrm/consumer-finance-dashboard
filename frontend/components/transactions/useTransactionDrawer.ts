"use client";

import { useCallback, useState } from "react";
import { api, type Transaction } from "@/lib/api";

export interface DrawerState {
  open: boolean;
  transaction: Transaction | null;
  loading: boolean;
  error: Error | null;
}

/** Hook that manages the transaction detail drawer state. */
export function useTransactionDrawer() {
  const [state, setState] = useState<DrawerState>({
    open: false,
    transaction: null,
    loading: false,
    error: null,
  });

  const openTransaction = useCallback(async (id: number) => {
    setState({ open: true, transaction: null, loading: true, error: null });
    try {
      const txn = await api.transactions.get(id);
      setState({ open: true, transaction: txn, loading: false, error: null });
    } catch (err) {
      setState({
        open: true,
        transaction: null,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  const close = useCallback(() => {
    setState({ open: false, transaction: null, loading: false, error: null });
  }, []);

  return { state, openTransaction, close };
}
