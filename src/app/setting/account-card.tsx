"use client";

import { useAuth } from "@/lib/auth";
import { UserIcon } from "@/components/icons";

export function AccountCard() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  return (
    <section className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      {user.photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote avatar, static export
        <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className="size-12 rounded-full" />
      ) : (
        <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
          <UserIcon className="size-6" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{user.displayName ?? "Pengguna"}</p>
        <p className="truncate text-sm text-muted">{user.email}</p>
      </div>
      <button
        onClick={() => confirm("Keluar dari akun ini?") && signOut()}
        className="rounded-xl border border-border px-3 py-2 text-sm font-medium text-expense"
      >
        Keluar
      </button>
    </section>
  );
}
