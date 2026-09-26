"use client";

import { useStore } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { formatRupiah } from "@/lib/format";
import { useTransactionSheet } from "./app-shell";

export function TransactionItem({ tx }: { tx: Transaction }) {
  const { accounts, categories } = useStore();
  const { openTransaction } = useTransactionSheet();
  const category = categories.find((c) => c.id === tx.categoryId);
  const account = accounts.find((a) => a.id === tx.accountId);
  const toAccount = accounts.find((a) => a.id === tx.toAccountId);

  const isTransfer = tx.type === "transfer";
  const title = isTransfer ? "Transfer" : (category?.name ?? "Tanpa kategori");
  const sub = isTransfer ? `${account?.name ?? "?"} → ${toAccount?.name ?? "?"}` : account?.name;
  const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "";
  const color = tx.type === "income" ? "text-income" : tx.type === "expense" ? "text-foreground" : "text-transfer";

  return (
    <button
      onClick={() => openTransaction(tx)}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2 active:bg-surface-2"
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-full text-lg"
        style={{ backgroundColor: `${isTransfer ? "#2563eb" : (category?.color ?? "#888")}22` }}
      >
        {isTransfer ? "🔁" : (category?.icon ?? "•")}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{tx.note || title}</span>
        <span className="block truncate text-xs text-muted">
          {tx.note ? `${title} · ${sub}` : sub}
        </span>
      </span>
      <span className={`tabular shrink-0 font-semibold ${color}`}>
        {sign}
        {formatRupiah(tx.amount)}
      </span>
    </button>
  );
}
