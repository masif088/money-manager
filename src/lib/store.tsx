"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";
import type { Account, Category, Preferences, Transaction } from "./types";
import { defaultAccounts, defaultCategories, defaultPreferences } from "./seed";
import { toISODate } from "./format";
import { firestore } from "./firebase";

// Firestore-backed store. Layout: users/{uid}/{accounts,categories,transactions}
// (see docs/rancangan-data.md). Writes are fire-and-forget: the persistent local
// cache updates snapshots immediately and syncs when the device is online.

export interface Data {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  preferences: Preferences;
}

interface Store extends Data {
  ready: boolean;
  error: string | null;
  saveTransaction: (tx: Omit<Transaction, "id"> & { id?: string }) => void;
  deleteTransaction: (id: string) => void;
  saveAccount: (a: Omit<Account, "id" | "order"> & { id?: string }) => void;
  deleteAccount: (id: string) => void;
  saveCategory: (c: Omit<Category, "id" | "order"> & { id?: string }) => void;
  deleteCategory: (id: string) => void;
  savePreferences: (p: Preferences) => void;
  clearTransactions: () => Promise<void>;
  replaceData: (d: Data) => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

type Col = "accounts" | "categories" | "transactions";

function fromDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Timestamp.fromDate(new Date(y, m - 1, d));
}

function txFromDoc(id: string, d: DocumentData): Transaction {
  return {
    id,
    type: d.type,
    amount: d.amount,
    date: d.date instanceof Timestamp ? toISODate(d.date.toDate()) : String(d.date),
    accountId: d.accountId,
    toAccountId: d.toAccountId ?? undefined,
    categoryId: d.categoryId ?? undefined,
    note: d.note ?? "",
  };
}

function txToDoc(t: Transaction) {
  const tx = withoutId(t);
  return { ...tx, date: fromDate(tx.date), toAccountId: tx.toAccountId ?? null, categoryId: tx.categoryId ?? null };
}

function withoutId<T extends { id: string }>(item: T): Omit<T, "id"> {
  const rest: Partial<T> = { ...item };
  delete rest.id;
  return rest as Omit<T, "id">;
}

/** Commit many writes in chunks under Firestore's 500-ops-per-batch limit. */
async function commitChunked(db: Firestore, ops: ((b: ReturnType<typeof writeBatch>) => void)[]) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db);
    ops.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}

export function StoreProvider({ uid, children }: { uid: string; children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const seeding = useRef(false);

  const db = firestore();
  const userRef = useMemo(() => doc(db, "users", uid), [db, uid]);
  const col = useCallback((name: Col) => collection(userRef, name), [userRef]);

  const fail = useCallback((err: unknown) => {
    console.error(err);
    setError((err as Error).message ?? String(err));
  }, []);

  useEffect(() => {
    const mark = (key: string) => setLoaded((s) => (s.has(key) ? s : new Set(s).add(key)));

    const unsubs = [
      onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            setPreferences({ ...defaultPreferences, ...(snap.data().preferences ?? {}) });
          } else if (!snap.metadata.fromCache && !seeding.current) {
            // First sign-in: create the profile plus default categories and account.
            seeding.current = true;
            const batch = writeBatch(db);
            batch.set(userRef, { preferences: defaultPreferences, createdAt: serverTimestamp() });
            for (const a of defaultAccounts) batch.set(doc(col("accounts"), a.id), { ...withoutId(a), createdAt: serverTimestamp() });
            for (const c of defaultCategories) batch.set(doc(col("categories"), c.id), { ...withoutId(c), createdAt: serverTimestamp() });
            batch.commit().catch(fail);
          }
          mark("user");
        },
        fail,
      ),
      onSnapshot(
        col("accounts"),
        (snap) => {
          setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Account));
          mark("accounts");
        },
        fail,
      ),
      onSnapshot(
        col("categories"),
        (snap) => {
          setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category));
          mark("categories");
        },
        fail,
      ),
      onSnapshot(
        col("transactions"),
        (snap) => {
          setTransactions(snap.docs.map((d) => txFromDoc(d.id, d.data())));
          mark("transactions");
        },
        fail,
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [db, userRef, col, fail]);

  const write = useCallback(
    (ref: DocumentReference, data: DocumentData, isNew: boolean) => {
      const stamps = isNew ? { createdAt: serverTimestamp(), updatedAt: serverTimestamp() } : { updatedAt: serverTimestamp() };
      setDoc(ref, { ...data, ...stamps }, { merge: true }).catch(fail);
    },
    [fail],
  );

  const saveTransaction = useCallback<Store["saveTransaction"]>(
    (tx) => {
      const ref = tx.id ? doc(col("transactions"), tx.id) : doc(col("transactions"));
      write(ref, txToDoc({ ...tx, id: ref.id }), !tx.id);
    },
    [col, write],
  );

  const saveAccount = useCallback<Store["saveAccount"]>(
    (a) => {
      const ref = a.id ? doc(col("accounts"), a.id) : doc(col("accounts"));
      const order = accounts.find((x) => x.id === a.id)?.order ?? accounts.length;
      write(ref, { ...a, id: undefined, order }, !a.id);
    },
    [accounts, col, write],
  );

  const saveCategory = useCallback<Store["saveCategory"]>(
    (c) => {
      const ref = c.id ? doc(col("categories"), c.id) : doc(col("categories"));
      const order = categories.find((x) => x.id === c.id)?.order ?? categories.filter((x) => x.kind === c.kind).length;
      // `budget: null` clears a previously set budget (undefined would be ignored by merge).
      write(ref, { ...c, id: undefined, budget: c.budget ?? null, order }, !c.id);
    },
    [categories, col, write],
  );

  const remove = useCallback((name: Col, id: string) => deleteDoc(doc(col(name), id)).catch(fail), [col, fail]);
  const deleteTransaction = useCallback((id: string) => void remove("transactions", id), [remove]);
  const deleteAccount = useCallback((id: string) => void remove("accounts", id), [remove]);
  const deleteCategory = useCallback((id: string) => void remove("categories", id), [remove]);

  const savePreferences = useCallback(
    (p: Preferences) => {
      setDoc(userRef, { preferences: p }, { merge: true }).catch(fail);
    },
    [userRef, fail],
  );

  const clearTransactions = useCallback(async () => {
    const snap = await getDocs(col("transactions"));
    await commitChunked(db, snap.docs.map((d) => (b) => b.delete(d.ref)));
  }, [col, db]);

  const replaceData = useCallback(
    async (data: Data) => {
      const existing = await Promise.all((["accounts", "categories", "transactions"] as const).map((n) => getDocs(col(n))));
      const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = existing.flatMap((s) => s.docs.map((d) => (b: ReturnType<typeof writeBatch>) => b.delete(d.ref)));
      for (const a of data.accounts) ops.push((b) => b.set(doc(col("accounts"), a.id), withoutId(a)));
      for (const c of data.categories) ops.push((b) => b.set(doc(col("categories"), c.id), withoutId(c)));
      for (const t of data.transactions) ops.push((b) => b.set(doc(col("transactions"), t.id), { ...txToDoc(t), createdAt: serverTimestamp() }));
      ops.push((b) => b.set(userRef, { preferences: data.preferences }, { merge: true }));
      await commitChunked(db, ops);
    },
    [col, db, userRef],
  );

  const value = useMemo<Store>(
    () => ({
      accounts,
      categories,
      transactions,
      preferences,
      ready: loaded.size === 4,
      error,
      saveTransaction,
      deleteTransaction,
      saveAccount,
      deleteAccount,
      saveCategory,
      deleteCategory,
      savePreferences,
      clearTransactions,
      replaceData,
    }),
    [accounts, categories, transactions, preferences, loaded, error, saveTransaction, deleteTransaction, saveAccount, deleteAccount, saveCategory, deleteCategory, savePreferences, clearTransactions, replaceData],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/** Current balance per account: initial balance plus all movements. */
export function computeBalances(accounts: Account[], transactions: Transaction[]) {
  const balances = new Map(accounts.map((a) => [a.id, a.initialBalance]));
  const add = (id: string | undefined, v: number) => {
    if (id && balances.has(id)) balances.set(id, balances.get(id)! + v);
  };
  for (const t of transactions) {
    if (t.type === "income") add(t.accountId, t.amount);
    else if (t.type === "expense") add(t.accountId, -t.amount);
    else {
      add(t.accountId, -t.amount);
      add(t.toAccountId, t.amount);
    }
  }
  return balances;
}

export function summarize(transactions: Transaction[]) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else if (t.type === "expense") expense += t.amount;
  }
  return { income, expense, net: income - expense };
}
