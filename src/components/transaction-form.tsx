"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Transaction, TransactionType } from "@/lib/types";
import { todayISO } from "@/lib/format";
import { Field, Segmented, inputClass } from "./ui";

const TYPE_OPTIONS: { value: TransactionType; label: string; activeClass: string }[] = [
  { value: "expense", label: "Pengeluaran", activeClass: "text-expense" },
  { value: "income", label: "Pemasukan", activeClass: "text-income" },
  { value: "transfer", label: "Transfer", activeClass: "text-transfer" },
];

const numberFmt = new Intl.NumberFormat("id-ID");

export function TransactionForm({ initial, onDone }: { initial?: Transaction; onDone: () => void }) {
  const { accounts, categories, saveTransaction, deleteTransaction } = useStore();
  const activeAccounts = accounts.filter((a) => !a.archived).sort((a, b) => a.order - b.order);

  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(initial?.amount ?? 0);
  const [categoryId, setCategoryId] = useState(initial?.categoryId);
  const [accountId, setAccountId] = useState(initial?.accountId ?? activeAccounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(initial?.toAccountId ?? activeAccounts[1]?.id ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState("");

  const kindCategories =
    type === "transfer"
      ? []
      : categories.filter((c) => c.kind === type && !c.archived).sort((a, b) => a.order - b.order);

  function changeType(t: TransactionType) {
    setType(t);
    setCategoryId(undefined);
    setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) return setError("Nominal harus lebih dari 0");
    if (!accountId) return setError("Pilih sumber dana");
    if (type !== "transfer" && !categoryId) return setError("Pilih kategori");
    if (type === "transfer" && (!toAccountId || toAccountId === accountId))
      return setError("Pilih akun tujuan yang berbeda");

    saveTransaction({
      id: initial?.id,
      type,
      amount,
      date,
      accountId,
      toAccountId: type === "transfer" ? toAccountId : undefined,
      categoryId: type === "transfer" ? undefined : categoryId,
      note: note.trim(),
    });
    onDone();
  }

  const amountColor = type === "income" ? "text-income" : type === "expense" ? "text-expense" : "text-transfer";

  return (
    <form onSubmit={submit} className="space-y-5">
      <Segmented value={type} onChange={changeType} options={TYPE_OPTIONS} />

      <div className="rounded-2xl bg-surface-2 px-4 py-3">
        <span className="text-xs font-medium text-muted">Nominal</span>
        <div className={`flex items-baseline gap-2 ${amountColor}`}>
          <span className="text-lg font-semibold">Rp</span>
          <input
            inputMode="numeric"
            autoFocus={!initial}
            aria-label="Nominal"
            placeholder="0"
            value={amount ? numberFmt.format(amount) : ""}
            onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, "")) || 0)}
            className="tabular w-full bg-transparent text-3xl font-bold outline-none placeholder:text-muted/50"
          />
        </div>
      </div>

      {type !== "transfer" && (
        <div>
          <span className="mb-2 block text-xs font-medium text-muted">Kategori</span>
          <div className="grid grid-cols-4 gap-2">
            {kindCategories.map((c) => {
              const active = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-center transition ${
                    active ? "border-primary bg-primary-soft" : "border-border"
                  }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  <span className="line-clamp-1 text-[11px] leading-tight">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={type === "transfer" ? "grid grid-cols-2 gap-3" : ""}>
        <Field label={type === "transfer" ? "Dari" : "Sumber dana"}>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
            {activeAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.icon} {a.name}
              </option>
            ))}
          </select>
        </Field>
        {type === "transfer" && (
          <Field label="Ke">
            <select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className={inputClass}>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon} {a.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-3">
        <Field label="Tanggal">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
        </Field>
        <Field label="Catatan">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" className={inputClass} />
        </Field>
      </div>

      {error && <p className="text-sm text-expense">{error}</p>}

      <div className="flex gap-3 pt-1">
        {initial && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Hapus transaksi ini?")) {
                deleteTransaction(initial.id);
                onDone();
              }
            }}
            className="rounded-xl border border-border px-4 py-3 font-medium text-expense"
          >
            Hapus
          </button>
        )}
        <button type="submit" className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground active:scale-[0.99]">
          Simpan
        </button>
      </div>
    </form>
  );
}
