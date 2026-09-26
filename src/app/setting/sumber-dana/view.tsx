"use client";

import { useState } from "react";
import { computeBalances, useStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import { ACCOUNT_TYPE_ICON, ACCOUNT_TYPE_LABEL, type Account, type AccountType } from "@/lib/types";
import { Card, EmptyState, Field, PageHeader, inputClass } from "@/components/ui";
import { Sheet } from "@/components/sheet";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { ColorPicker, Toggle } from "@/components/pickers";

const TYPES = Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[];

export function SumberDanaView() {
  const { accounts, transactions } = useStore();
  const [editing, setEditing] = useState<{ open: boolean; item?: Account; key: number }>({ open: false, key: 0 });

  const balances = computeBalances(accounts, transactions);
  const list = [...accounts].sort((a, b) => Number(a.archived) - Number(b.archived) || a.order - b.order);
  const total = accounts.filter((a) => !a.archived).reduce((s, a) => s + (balances.get(a.id) ?? 0), 0);
  const usage = (id: string) => transactions.filter((t) => t.accountId === id || t.toAccountId === id).length;

  const open = (item?: Account) => setEditing((s) => ({ open: true, item, key: s.key + 1 }));
  const close = () => setEditing((s) => ({ ...s, open: false }));

  return (
    <>
      <PageHeader
        title="Sumber Dana"
        back="/setting/"
        action={
          <button onClick={() => open()} className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <PlusIcon className="size-4" /> Tambah
          </button>
        }
      />
      <div className="space-y-4 pt-1">
        <Card className="flex items-center justify-between p-4">
          <span className="text-sm text-muted">Total saldo aktif</span>
          <span className="tabular text-lg font-semibold">{formatRupiah(total)}</span>
        </Card>

        <Card className="divide-y divide-border overflow-hidden">
          {list.length === 0 && <EmptyState icon="👛" title="Belum ada sumber dana" hint="Tambahkan dompet, rekening, atau e-wallet." />}
          {list.map((a) => (
            <button
              key={a.id}
              onClick={() => open(a)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2 ${a.archived ? "opacity-50" : ""}`}
            >
              <span className="grid size-10 place-items-center rounded-xl text-lg" style={{ backgroundColor: `${a.color}22` }}>
                {a.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {a.name}
                  {a.archived && <span className="ml-2 text-xs font-normal text-muted">(diarsipkan)</span>}
                </span>
                <span className="block text-xs text-muted">{ACCOUNT_TYPE_LABEL[a.type]}</span>
              </span>
              <span className="tabular font-semibold">{formatRupiah(balances.get(a.id) ?? 0)}</span>
              <ChevronRightIcon className="size-5 text-muted" />
            </button>
          ))}
        </Card>
      </div>

      <Sheet open={editing.open} onClose={close} title={editing.item ? "Ubah sumber dana" : "Sumber dana baru"}>
        <AccountForm key={editing.key} initial={editing.item} usage={editing.item ? usage(editing.item.id) : 0} onDone={close} />
      </Sheet>
    </>
  );
}

const numberFmt = new Intl.NumberFormat("id-ID");

function AccountForm({ initial, usage, onDone }: { initial?: Account; usage: number; onDone: () => void }) {
  const { saveAccount, deleteAccount } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<AccountType>(initial?.type ?? "bank");
  const [initialBalance, setInitialBalance] = useState(initial?.initialBalance ?? 0);
  const [negative, setNegative] = useState((initial?.initialBalance ?? 0) < 0);
  const [color, setColor] = useState(initial?.color ?? "#2563eb");
  const [archived, setArchived] = useState(initial?.archived ?? false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const abs = Math.abs(initialBalance);
    saveAccount({
      id: initial?.id,
      name: name.trim(),
      type,
      icon: ACCOUNT_TYPE_ICON[type],
      initialBalance: negative ? -abs : abs,
      color,
      archived,
    });
    onDone();
  }

  function remove() {
    if (!initial) return;
    if (usage) {
      alert(`Sumber dana ini dipakai ${usage} transaksi. Arsipkan saja supaya riwayat tetap utuh.`);
      return;
    }
    if (confirm("Hapus sumber dana ini?")) {
      deleteAccount(initial.id);
      onDone();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Nama">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="mis. BCA, Dompet, GoPay" className={inputClass} autoFocus={!initial} required />
      </Field>

      <Field label="Jenis">
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-xs transition ${
                type === t ? "border-primary bg-primary-soft" : "border-border"
              }`}
            >
              <span className="text-xl">{ACCOUNT_TYPE_ICON[t]}</span>
              {ACCOUNT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </Field>

      <Field label={type === "credit" ? "Saldo awal (tagihan berjalan = minus)" : "Saldo awal"}>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setNegative((n) => !n)}
            className={`w-12 shrink-0 rounded-xl border border-border text-lg font-semibold ${negative ? "text-expense" : "text-muted"}`}
            aria-label="Tanda plus/minus"
          >
            {negative ? "−" : "+"}
          </button>
          <div className="relative flex-1">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">Rp</span>
            <input
              inputMode="numeric"
              value={initialBalance ? numberFmt.format(Math.abs(initialBalance)) : ""}
              onChange={(e) => setInitialBalance(Number(e.target.value.replace(/\D/g, "")) || 0)}
              placeholder="0"
              className={`${inputClass} tabular pl-10`}
            />
          </div>
        </div>
      </Field>

      <Field label="Warna">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      {initial && <Toggle checked={archived} onChange={setArchived} label="Arsipkan (sembunyikan dari form & total)" />}

      <div className="flex gap-3">
        {initial && (
          <button type="button" onClick={remove} className="rounded-xl border border-border px-4 py-3 font-medium text-expense">
            Hapus
          </button>
        )}
        <button type="submit" className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground">
          Simpan
        </button>
      </div>
    </form>
  );
}
