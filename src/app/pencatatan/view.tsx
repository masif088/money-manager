"use client";

import { useMemo, useState } from "react";
import { summarize, useStore } from "@/lib/store";
import { formatDayHeader, formatRupiah, monthKey, todayISO } from "@/lib/format";
import type { TransactionType } from "@/lib/types";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { MonthPicker } from "@/components/month-picker";
import { SearchIcon } from "@/components/icons";
import { TransactionItem } from "@/components/transaction-item";

type Filter = "all" | TransactionType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "expense", label: "Pengeluaran" },
  { value: "income", label: "Pemasukan" },
  { value: "transfer", label: "Transfer" },
];

export function PencatatanView() {
  const { transactions, categories, accounts } = useStore();
  const [month, setMonth] = useState(() => monthKey(todayISO()));
  const [filter, setFilter] = useState<Filter>("all");
  const [accountId, setAccountId] = useState("all");
  const [query, setQuery] = useState("");

  const { groups, summary } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = transactions
      .filter((t) => monthKey(t.date) === month)
      .filter((t) => filter === "all" || t.type === filter)
      .filter((t) => accountId === "all" || t.accountId === accountId || t.toAccountId === accountId)
      .filter((t) => {
        if (!q) return true;
        const cat = categories.find((c) => c.id === t.categoryId)?.name ?? "";
        return t.note.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const groups = new Map<string, typeof list>();
    for (const t of list) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);
    return { groups: [...groups.entries()], summary: summarize(list) };
  }, [transactions, categories, month, filter, accountId, query]);

  return (
    <>
      <PageHeader title="Pencatatan" />

      <div className="space-y-4 pt-1">
        <MonthPicker value={month} onChange={setMonth} />

        <div className="grid grid-cols-3 gap-2 text-center">
          <Card className="px-2 py-3">
            <p className="text-[11px] text-muted">Masuk</p>
            <p className="tabular truncate text-sm font-semibold text-income">{formatRupiah(summary.income)}</p>
          </Card>
          <Card className="px-2 py-3">
            <p className="text-[11px] text-muted">Keluar</p>
            <p className="tabular truncate text-sm font-semibold text-expense">{formatRupiah(summary.expense)}</p>
          </Card>
          <Card className="px-2 py-3">
            <p className="text-[11px] text-muted">Selisih</p>
            <p className={`tabular truncate text-sm font-semibold ${summary.net < 0 ? "text-expense" : ""}`}>
              {formatRupiah(summary.net)}
            </p>
          </Card>
        </div>

        <div className="flex gap-2">
          <label className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari catatan / kategori"
              className="w-full rounded-xl border border-border bg-surface py-2.5 pr-3 pl-9 text-sm outline-none focus:border-primary"
            />
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            aria-label="Filter sumber dana"
            className="max-w-32 rounded-xl border border-border bg-surface px-2 text-sm outline-none"
          >
            <option value="all">Semua akun</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                filter === f.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {groups.length === 0 ? (
          <Card>
            <EmptyState icon="🗒️" title="Tidak ada transaksi" hint="Coba ganti bulan atau filter." />
          </Card>
        ) : (
          groups.map(([date, items]) => {
            const day = summarize(items);
            return (
              <div key={date}>
                <div className="mb-1.5 flex items-center justify-between px-1 text-xs">
                  <span className="font-semibold text-muted capitalize">{formatDayHeader(date)}</span>
                  <span className={`tabular ${day.net < 0 ? "text-expense" : "text-income"}`}>
                    {day.net === 0 ? "" : formatRupiah(day.net)}
                  </span>
                </div>
                <Card className="divide-y divide-border overflow-hidden">
                  {items.map((t) => (
                    <TransactionItem key={t.id} tx={t} />
                  ))}
                </Card>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
