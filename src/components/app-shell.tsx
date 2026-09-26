"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useState } from "react";
import { useStore } from "@/lib/store";
import type { Transaction } from "@/lib/types";
import { ChartIcon, HomeIcon, ListIcon, PlusIcon, SettingsIcon } from "./icons";
import { Sheet } from "./sheet";
import { TransactionForm } from "./transaction-form";

const NAV = [
  { href: "/", label: "Dashboard", icon: HomeIcon },
  { href: "/pencatatan", label: "Pencatatan", icon: ListIcon },
  { href: "/pelaporan", label: "Pelaporan", icon: ChartIcon },
  { href: "/setting", label: "Setting", icon: SettingsIcon },
];

interface SheetCtx {
  openTransaction: (tx?: Transaction) => void;
}

const TransactionSheetContext = createContext<SheetCtx | null>(null);

export function useTransactionSheet() {
  const ctx = useContext(TransactionSheetContext);
  if (!ctx) throw new Error("useTransactionSheet must be used inside <AppShell>");
  return ctx;
}

function isActive(pathname: string, href: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  return href === "/" ? p === "/" : p === href || p.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { error } = useStore();
  const [sheet, setSheet] = useState<{ open: boolean; tx?: Transaction; key: number }>({ open: false, key: 0 });

  const openTransaction = useCallback((tx?: Transaction) => {
    setSheet((s) => ({ open: true, tx, key: s.key + 1 }));
  }, []);
  const close = useCallback(() => setSheet((s) => ({ ...s, open: false })), []);

  return (
    <TransactionSheetContext.Provider value={{ openTransaction }}>
      <div className="flex min-h-dvh">
        {/* Sidebar — tablet/desktop */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 md:flex">
          <div className="mb-6 flex items-center gap-2 px-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              Rp
            </span>
            <span className="font-semibold">Money Manager</span>
          </div>
          <button
            onClick={() => openTransaction()}
            className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 font-semibold text-primary-foreground"
          >
            <PlusIcon className="size-5" /> Catat transaksi
          </button>
          <nav className="space-y-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-28 md:px-8 md:pb-10">
          <div className="mx-auto w-full max-w-3xl">
            {error && (
              <p className="mt-3 rounded-xl bg-expense/10 px-3 py-2 text-sm text-expense">Sinkronisasi gagal: {error}</p>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur md:hidden">
        <div className="relative grid grid-cols-5 items-end">
          {NAV.slice(0, 2).map((item) => (
            <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
          <div className="flex justify-center">
            <button
              onClick={() => openTransaction()}
              aria-label="Catat transaksi"
              className="-mt-6 mb-1 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 active:scale-95"
            >
              <PlusIcon className="size-7" />
            </button>
          </div>
          {NAV.slice(2).map((item) => (
            <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
          ))}
        </div>
      </nav>

      <Sheet open={sheet.open} onClose={close} title={sheet.tx ? "Ubah transaksi" : "Catat transaksi"}>
        <TransactionForm key={sheet.key} initial={sheet.tx} onDone={close} />
      </Sheet>
    </TransactionSheetContext.Provider>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-primary" : "text-muted"}`}
    >
      <Icon className="size-6" />
      {label}
    </Link>
  );
}
