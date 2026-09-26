"use client";

import { useMemo, useState } from "react";
import { computeBalances, summarize, useStore } from "@/lib/store";
import { daysInMonth, formatCompact, formatMonth, formatRupiah, monthKey, shiftMonth, todayISO } from "@/lib/format";
import { ACCOUNT_TYPE_LABEL, type Account, type CategoryKind } from "@/lib/types";
import { Card, PageHeader, SectionTitle, Segmented } from "@/components/ui";
import { MonthPicker } from "@/components/month-picker";

export function PelaporanView() {
  const { transactions, categories, accounts } = useStore();
  const [month, setMonth] = useState(() => monthKey(todayISO()));
  const [kind, setKind] = useState<CategoryKind>("expense");

  const data = useMemo(() => {
    const monthTx = transactions.filter((t) => monthKey(t.date) === month);
    const summary = summarize(monthTx);
    const prev = summarize(transactions.filter((t) => monthKey(t.date) === shiftMonth(month, -1)));

    const byCat = new Map<string, number>();
    for (const t of monthTx) if (t.type === kind && t.categoryId) byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount);
    const kindTotal = [...byCat.values()].reduce((s, v) => s + v, 0);
    const breakdown = [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, amount]) => {
        const c = categories.find((x) => x.id === id);
        return { id, name: c?.name ?? "Lainnya", icon: c?.icon ?? "•", color: c?.color ?? "#888", amount, pct: kindTotal ? amount / kindTotal : 0 };
      });

    const days = daysInMonth(month);
    const daily = Array.from({ length: days }, () => 0);
    for (const t of monthTx) if (t.type === "expense") daily[Number(t.date.slice(8, 10)) - 1] += t.amount;

    const trend = Array.from({ length: 6 }, (_, i) => {
      const key = shiftMonth(month, i - 5);
      return { key, ...summarize(transactions.filter((t) => monthKey(t.date) === key)) };
    });

    // Per sumber dana: saldo awal bulan -> arus bulan ini -> saldo akhir bulan.
    const opening = computeBalances(accounts, transactions.filter((t) => monthKey(t.date) < month));
    const closing = computeBalances(accounts, transactions.filter((t) => monthKey(t.date) <= month));
    const perAccount = [...accounts]
      .sort((a, b) => a.order - b.order)
      .map((a) => {
        let income = 0, expense = 0, transferIn = 0, transferOut = 0;
        for (const t of monthTx) {
          if (t.type === "income" && t.accountId === a.id) income += t.amount;
          else if (t.type === "expense" && t.accountId === a.id) expense += t.amount;
          else if (t.type === "transfer") {
            if (t.accountId === a.id) transferOut += t.amount;
            if (t.toAccountId === a.id) transferIn += t.amount;
          }
        }
        return { account: a, opening: opening.get(a.id) ?? 0, closing: closing.get(a.id) ?? 0, income, expense, transferIn, transferOut };
      })
      .filter((r) => !r.account.archived || r.income || r.expense || r.transferIn || r.transferOut);

    return { summary, prev, breakdown, kindTotal, daily, trend, perAccount };
  }, [transactions, categories, accounts, month, kind]);

  const expenseDelta = data.prev.expense ? (data.summary.expense - data.prev.expense) / data.prev.expense : null;
  const savingRate = data.summary.income ? data.summary.net / data.summary.income : null;

  return (
    <>
      <PageHeader title="Pelaporan" />
      <div className="space-y-5 pt-1">
        <MonthPicker value={month} onChange={setMonth} />

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted">Pengeluaran</p>
            <p className="tabular mt-1 font-semibold text-expense">{formatRupiah(data.summary.expense)}</p>
            {expenseDelta !== null && (
              <p className={`mt-1 text-[11px] ${expenseDelta > 0 ? "text-expense" : "text-income"}`}>
                {expenseDelta > 0 ? "▲" : "▼"} {Math.abs(Math.round(expenseDelta * 100))}% vs bulan lalu
              </p>
            )}
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">Pemasukan</p>
            <p className="tabular mt-1 font-semibold text-income">{formatRupiah(data.summary.income)}</p>
            {savingRate !== null && (
              <p className="mt-1 text-[11px] text-muted">Tabungan {Math.round(savingRate * 100)}% dari pemasukan</p>
            )}
          </Card>
        </div>

        {/* Category breakdown */}
        <div>
          <SectionTitle>Per kategori</SectionTitle>
          <Card className="p-4">
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: "expense", label: "Pengeluaran", activeClass: "text-expense" },
                { value: "income", label: "Pemasukan", activeClass: "text-income" },
              ]}
            />
            {data.breakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">Belum ada data di bulan ini.</p>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <Donut items={data.breakdown} total={data.kindTotal} />
                <ul className="w-full flex-1 space-y-2.5">
                  {data.breakdown.map((b) => (
                    <li key={b.id} className="flex items-center gap-3 text-sm">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="min-w-0 flex-1 truncate">
                        {b.icon} {b.name}
                      </span>
                      <span className="w-10 text-right text-xs text-muted">{Math.round(b.pct * 100)}%</span>
                      <span className="tabular w-28 text-right font-medium">{formatRupiah(b.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>

        {/* Per account */}
        <div>
          <SectionTitle>Per sumber dana</SectionTitle>
          <div className="space-y-3">
            {data.perAccount.map((r) => (
              <AccountReport key={r.account.id} row={r} />
            ))}
          </div>
        </div>

        {/* Daily expense */}
        <div>
          <SectionTitle>Pengeluaran harian</SectionTitle>
          <Card className="p-4">
            <DailyBars values={data.daily} />
          </Card>
        </div>

        {/* 6-month trend */}
        <div>
          <SectionTitle>Tren 6 bulan</SectionTitle>
          <Card className="p-4">
            <TrendBars rows={data.trend} active={month} />
            <div className="mt-3 flex justify-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-income" /> Pemasukan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-expense" /> Pengeluaran
              </span>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

interface AccountRow {
  account: Account;
  opening: number;
  closing: number;
  income: number;
  expense: number;
  transferIn: number;
  transferOut: number;
}

function AccountReport({ row }: { row: AccountRow }) {
  const { account: a, opening, closing, income, expense, transferIn, transferOut } = row;
  const change = closing - opening;
  const inflow = income + transferIn;
  const outflow = expense + transferOut;
  const max = Math.max(1, inflow, outflow);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl text-lg" style={{ backgroundColor: `${a.color}22` }}>
          {a.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{a.name}</p>
          <p className="text-xs text-muted">{ACCOUNT_TYPE_LABEL[a.type]}</p>
        </div>
        <div className="text-right">
          <p className="tabular font-semibold">{formatRupiah(closing)}</p>
          <p className={`tabular text-xs ${change < 0 ? "text-expense" : change > 0 ? "text-income" : "text-muted"}`}>
            {change > 0 ? "+" : ""}
            {change === 0 ? "tidak berubah" : formatRupiah(change)}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-12 text-muted">Masuk</span>
          <div className="h-2 flex-1 rounded-full bg-surface-2">
            <div className="h-2 rounded-full bg-income" style={{ width: `${(inflow / max) * 100}%` }} />
          </div>
          <span className="tabular w-24 text-right font-medium text-income">{formatRupiah(inflow)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-12 text-muted">Keluar</span>
          <div className="h-2 flex-1 rounded-full bg-surface-2">
            <div className="h-2 rounded-full bg-expense" style={{ width: `${(outflow / max) * 100}%` }} />
          </div>
          <span className="tabular w-24 text-right font-medium text-expense">{formatRupiah(outflow)}</span>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs">
        <dt className="text-muted">Saldo awal bulan</dt>
        <dd className="tabular text-right">{formatRupiah(opening)}</dd>
        <dt className="text-muted">Pemasukan</dt>
        <dd className="tabular text-right text-income">+{formatRupiah(income)}</dd>
        <dt className="text-muted">Pengeluaran</dt>
        <dd className="tabular text-right text-expense">−{formatRupiah(expense)}</dd>
        {(transferIn > 0 || transferOut > 0) && (
          <>
            <dt className="text-muted">Transfer masuk / keluar</dt>
            <dd className="tabular text-right text-transfer">
              +{formatRupiah(transferIn)} / −{formatRupiah(transferOut)}
            </dd>
          </>
        )}
        <dt className="font-medium">Saldo akhir bulan</dt>
        <dd className="tabular text-right font-semibold">{formatRupiah(closing)}</dd>
      </dl>
    </Card>
  );
}

function Donut({ items, total }: { items: { id: string; color: string; amount: number }[]; total: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const segments = items.reduce<{ id: string; color: string; len: number; offset: number }[]>((acc, it) => {
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0;
    acc.push({ id: it.id, color: it.color, len: (it.amount / total) * c, offset });
    return acc;
  }, []);
  return (
    <div className="relative size-40 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
        {segments.map((s) => (
          <circle
            key={s.id}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${Math.max(0, s.len - 0.8)} ${c}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="text-[10px] text-muted">Total</p>
          <p className="tabular text-sm font-semibold">{formatCompact(total)}</p>
        </div>
      </div>
    </div>
  );
}

function DailyBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return (
    <div>
      <div className="flex h-32 items-end gap-[2px]">
        {values.map((v, i) => (
          <div key={i} className="group relative flex h-full flex-1 items-end">
            <div
              className="w-full rounded-t-sm bg-expense/70 group-hover:bg-expense"
              style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }}
              title={`Tgl ${i + 1}: ${formatRupiah(v)}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>1</span>
        <span>{Math.ceil(values.length / 2)}</span>
        <span>{values.length}</span>
      </div>
      <p className="mt-2 text-xs text-muted">
        Rata-rata <span className="tabular font-medium text-foreground">{formatRupiah(Math.round(avg))}</span> / hari
      </p>
    </div>
  );
}

function TrendBars({ rows, active }: { rows: { key: string; income: number; expense: number }[]; active: string }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.income, r.expense]));
  return (
    <div className="flex h-40 items-end gap-2">
      {rows.map((r) => (
        <div key={r.key} className="flex h-full flex-1 flex-col items-center gap-1">
          <div className="flex w-full flex-1 items-end justify-center gap-0.5">
            <div className="w-1/3 max-w-4 rounded-t-sm bg-income" style={{ height: `${(r.income / max) * 100}%` }} title={formatRupiah(r.income)} />
            <div className="w-1/3 max-w-4 rounded-t-sm bg-expense" style={{ height: `${(r.expense / max) * 100}%` }} title={formatRupiah(r.expense)} />
          </div>
          <span className={`text-[10px] ${r.key === active ? "font-semibold text-foreground" : "text-muted"}`}>
            {formatMonth(r.key).slice(0, 3)}
          </span>
        </div>
      ))}
    </div>
  );
}
