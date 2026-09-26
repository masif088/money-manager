import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { ChevronRightIcon, DatabaseIcon, SlidersIcon, TagIcon, WalletIcon } from "@/components/icons";
import { AccountCard } from "./account-card";

export const metadata: Metadata = { title: "Setting" };

const GROUPS = [
  {
    title: "Keuangan",
    items: [
      { href: "/setting/kategori/", icon: TagIcon, label: "Kategori", hint: "Kategori pemasukan & pengeluaran, budget" },
      { href: "/setting/sumber-dana/", icon: WalletIcon, label: "Sumber Dana", hint: "Tunai, rekening bank, e-wallet, kartu kredit" },
    ],
  },
  {
    title: "Aplikasi",
    items: [
      { href: "/setting/preferensi/", icon: SlidersIcon, label: "Preferensi", hint: "Mata uang, tanggal awal bulan" },
      { href: "/setting/data/", icon: DatabaseIcon, label: "Data", hint: "Export, import, reset" },
    ],
  },
];

export default function Page() {
  return (
    <>
      <PageHeader title="Setting" />
      <div className="space-y-6 pt-1">
        <AccountCard />

        {GROUPS.map((g) => (
          <div key={g.title}>
            <h2 className="mb-2 px-1 text-sm font-semibold text-muted">{g.title}</h2>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {g.items.map(({ href, icon: Icon, label, hint }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2 active:bg-surface-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{label}</span>
                    <span className="block truncate text-xs text-muted">{hint}</span>
                  </span>
                  <ChevronRightIcon className="size-5 text-muted" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-muted">Money Manager · v0.1.0</p>
      </div>
    </>
  );
}
