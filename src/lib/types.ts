// Mirrors the Firestore schema in docs/rancangan-data.md.
// Dates are "YYYY-MM-DD" strings in the UI; convert to Timestamp at the Firestore boundary.

export type AccountType = "cash" | "bank" | "ewallet" | "credit" | "investment";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  color: string;
  icon: string;
  archived: boolean;
  order: number;
}

export type CategoryKind = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  budget?: number;
  archived: boolean;
  order: number;
}

export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  accountId: string;
  toAccountId?: string;
  categoryId?: string;
  note: string;
}

export interface Preferences {
  currency: string;
  monthStartDay: number;
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  cash: "Tunai",
  bank: "Bank",
  ewallet: "E-Wallet",
  credit: "Kartu Kredit",
  investment: "Investasi",
};

export const ACCOUNT_TYPE_ICON: Record<AccountType, string> = {
  cash: "💵",
  bank: "🏦",
  ewallet: "📱",
  credit: "💳",
  investment: "📈",
};
