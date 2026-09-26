"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { StoreProvider, useStore } from "@/lib/store";
import { AppShell } from "./app-shell";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <LoginScreen />;
  return (
    <StoreProvider key={user.uid} uid={user.uid}>
      <DataGate>
        <AppShell>{children}</AppShell>
      </DataGate>
    </StoreProvider>
  );
}

function DataGate({ children }: { children: React.ReactNode }) {
  const { ready, error } = useStore();
  if (!ready && error) return <Splash message={`Gagal memuat data: ${error}`} />;
  if (!ready) return <Splash message="Memuat data…" />;
  return children;
}

function Logo() {
  return (
    <span className="grid size-16 place-items-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg shadow-primary/30">
      Rp
    </span>
  );
}

function Splash({ message }: { message?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="animate-pulse">
        <Logo />
      </div>
      {message && <p className="max-w-xs text-sm text-muted">{message}</p>}
    </div>
  );
}

function LoginScreen() {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login() {
    setBusy(true);
    setError("");
    try {
      await signIn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col px-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Money Manager</h1>
        <p className="mt-2 max-w-xs text-muted">Catat pemasukan & pengeluaran, pantau saldo semua sumber dana, lihat laporan bulanan.</p>
        <ul className="mt-8 space-y-2 text-left text-sm">
          <li>☁️ Tersinkron di semua perangkat</li>
          <li>📴 Tetap bisa mencatat saat offline</li>
          <li>🔒 Data hanya bisa diakses akunmu</li>
        </ul>
      </div>
      <div className="mx-auto w-full max-w-sm pb-8">
        {error && <p className="mb-3 text-center text-sm text-expense">{error}</p>}
        <button
          onClick={login}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border bg-surface py-3.5 font-semibold shadow-sm transition active:scale-[0.99] disabled:opacity-60"
        >
          <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
            <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
          </svg>
          {busy ? "Membuka Google…" : "Masuk dengan Google"}
        </button>
      </div>
    </div>
  );
}
