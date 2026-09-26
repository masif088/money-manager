"use client";

import Link from "next/link";
import { useMemo } from "react";
import { computeBalances, summarize, useStore } from "@/lib/store";
import { formatMonth, formatRupiah, monthKey, todayISO } from "@/lib/format";
import { ACCOUNT_TYPE_LABEL } from "@/lib/types";
import { Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui";
import { ArrowDownIcon, ArrowUpIcon } from "@/components/icons";
import { TransactionItem } from "@/components/transaction-item";

export function DashboardView() {
  const { accounts, categories, transactions } = useStore();
  const thisMonth = monthKey(todayISO());

  const { balances, total, month, recent, topExpenses, budgets } = useMemo(() => {
    const balances = computeBalances(accounts, transactions);
    const total = accounts.filter((a) => !a.archived).reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);
    const monthTx = transactions.filter((t) => monthKey(t.date) === thisMonth);
    const month = summarize(monthTx);
    const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    const byCat = new Map<string, number>();
    for (const t of monthTx) if (t.type === "expense" && t.categoryId) byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount);
    const topExpenses = [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([id, amount]) => ({ category: categories.find((c) => c.id === id), amount }));

    const budgets = categories
      .filter((c) => c.kind === "expense" && c.budget && !c.archived)
      .map((c) => ({ category: c, spent: byCat.get(c.id) ?? 0, budget: c.budget! }))
      .sort((a, b) => b.spent / b.budget - a.spent / a.budget)
      .slice(0, 3);

    return { balances, total, month, recent, topExpenses, budgets };
  }, [accounts, categories, transactions, thisMonth]);

  const maxTop = Math.max(1, ...topExpenses.map((t) => t.amount));

  return (
    <>
      <PageHeader title="Dashboard" subtitle={formatMonth(thisMonth)} />

      <div className="space-y-5 pt-1">
        {/* Total balance */}
        <section className="rounded-3xl bg-primary p-5 text-primary-foreground shadow-sm">
          <p className="text-sm opacity-80">Total saldo</p>
          <p className="tabular mt-1 text-3xl font-bold tracking-tight">{formatRupiah(total)}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-3">
              <p className="flex items-center gap-1 text-xs opacity-85">
                <ArrowDownIcon className="size-3.5" /> Pemasukan
              </p>
              <p className="tabular mt-0.5 font-semibold">{formatRupiah(month.income)}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3">
              <p className="flex items-center gap-1 text-xs opacity-85">
                <ArrowUpIcon className="size-3.5" /> Pengeluaran
              </p>
              <p className="tabular mt-0.5 font-semibold">{formatRupiah(month.expense)}</p>
            </div>
          </div>
        </section>

        {/* Accounts */}
        <div>
          <SectionTitle
            action={
              <Link href="/setting/sumber-dana/" className="text-sm font-medium text-primary">
                Kelola
              </Link>
            }
          >
            Sumber dana
          </SectionTitle>
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0">
            {accounts
              .filter((a) => !a.archived)
              .sort((a, b) => a.order - b.order)
              .map((a) => (
                <Card key={a.id} className="min-w-40 shrink-0 snap-start p-4">
                  <div className="flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-lg text-base" style={{ backgroundColor: `${a.color}22` }}>
                      {a.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.name}</p>
                      <p className="text-[11px] text-muted">{ACCOUNT_TYPE_LABEL[a.type]}</p>
                    </div>
                  </div>
                  <p className="tabular mt-3 font-semibold">{formatRupiah(balances.get(a.id) ?? 0)}</p>
                </Card>
              ))}
          </div>
        </div>

        <div className={`grid gap-5 ${budgets.length ? "md:grid-cols-2" : ""}`}>
          {/* Top expenses */}
          <div>
            <SectionTitle>Pengeluaran terbesar bulan ini</SectionTitle>
            <Card className="space-y-3 p-4">
              {topExpenses.length === 0 && <p className="text-sm text-muted">Belum ada pengeluaran.</p>}
              {topExpenses.map(({ category, amount }) => (
                <div key={category?.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate">
                      {category?.icon} {category?.name}
                    </span>
                    <span className="tabular font-medium">{formatRupiah(amount)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2">
                    <div className="h-2 rounded-full" style={{ width: `${(amount / maxTop) * 100}%`, backgroundColor: category?.color }} />
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Budgets — only shown once a category has a budget */}
          {budgets.length > 0 && (
            <div>
              <SectionTitle>Budget</SectionTitle>
              <Card className="space-y-3 p-4">
                {budgets.map(({ category, spent, budget }) => {
                  const pct = Math.min(100, (spent / budget) * 100);
                  const over = spent > budget;
                  return (
                    <div key={category.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="truncate">
                          {category.icon} {category.name}
                        </span>
                        <span className={`tabular text-xs ${over ? "font-semibold text-expense" : "text-muted"}`}>
                          {formatRupiah(spent)} / {formatRupiah(budget)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-2">
                        <div
                          className={`h-2 rounded-full ${over ? "bg-expense" : pct > 80 ? "bg-amber-500" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          )}
        </div>

        {/* Recent */}
        <div>
          <SectionTitle
            action={
              <Link href="/pencatatan/" className="text-sm font-medium text-primary">
                Lihat semua
              </Link>
            }
          >
            Transaksi terakhir
          </SectionTitle>
          <Card className="divide-y divide-border overflow-hidden">
            {recent.length === 0 ? (
              <EmptyState icon="🧾" title="Belum ada transaksi" hint="Tekan tombol + untuk mencatat." />
            ) : (
              recent.map((t) => <TransactionItem key={t.id} tx={t} />)
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
