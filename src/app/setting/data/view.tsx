"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";

export function DataView() {
  const { accounts, categories, transactions, preferences, replaceData, clearTransactions } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function exportJson() {
    const blob = new Blob([JSON.stringify({ accounts, categories, transactions, preferences }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `money-manager-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    setMessage(`${label}…`);
    try {
      await fn();
      setMessage(`${label} selesai.`);
    } catch (err) {
      setMessage(`${label} gagal: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function importJson(file: File) {
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      return setMessage("File bukan JSON yang valid.");
    }
    if (!Array.isArray(data.accounts) || !Array.isArray(data.categories) || !Array.isArray(data.transactions)) {
      return setMessage("Format file tidak dikenali.");
    }
    if (!confirm(`Import ${data.transactions.length} transaksi akan menimpa SEMUA data saat ini. Lanjutkan?`)) return;
    await run("Import", () => replaceData({ ...data, preferences: data.preferences ?? preferences }));
  }

  return (
    <>
      <PageHeader title="Data" back="/setting/" />
      <div className="space-y-3 pt-1">
        <Card className="p-4">
          <p className="text-sm text-muted">
            {accounts.length} sumber dana · {categories.length} kategori · {transactions.length} transaksi
          </p>
          <p className="mt-1 text-xs text-muted">Tersimpan di Firestore & cache offline perangkat ini.</p>
        </Card>

        <Card className="divide-y divide-border overflow-hidden">
          <button onClick={exportJson} className="block w-full px-4 py-3.5 text-left hover:bg-surface-2">
            <span className="block font-medium">Export JSON</span>
            <span className="block text-xs text-muted">Unduh cadangan semua data</span>
          </button>
          <button disabled={busy} onClick={() => fileRef.current?.click()} className="block w-full px-4 py-3.5 text-left hover:bg-surface-2 disabled:opacity-50">
            <span className="block font-medium">Import JSON</span>
            <span className="block text-xs text-muted">Pulihkan dari file cadangan (menimpa data)</span>
          </button>
          <button
            disabled={busy}
            onClick={() => confirm("Hapus SEMUA transaksi? Kategori & sumber dana tetap ada. Tidak bisa dibatalkan.") && run("Hapus transaksi", clearTransactions)}
            className="block w-full px-4 py-3.5 text-left hover:bg-surface-2 disabled:opacity-50"
          >
            <span className="block font-medium text-expense">Hapus semua transaksi</span>
            <span className="block text-xs text-muted">Kategori & sumber dana tidak ikut terhapus</span>
          </button>
        </Card>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
            e.target.value = "";
          }}
        />
        {message && <p className="px-1 text-sm">{message}</p>}
      </div>
    </>
  );
}
