import type { Account, Category, Preferences } from "./types";

// Defaults written to Firestore the first time a user signs in.

export const defaultAccounts: Account[] = [
  { id: "dompet", name: "Dompet", type: "cash", initialBalance: 0, color: "#16a34a", icon: "💵", archived: false, order: 0 },
];

export const defaultCategories: Category[] = [
  { id: "makan", name: "Makan & Minum", kind: "expense", icon: "🍜", color: "#ea580c", archived: false, order: 0 },
  { id: "transportasi", name: "Transportasi", kind: "expense", icon: "🛵", color: "#0284c7", archived: false, order: 1 },
  { id: "belanja", name: "Belanja", kind: "expense", icon: "🛍️", color: "#db2777", archived: false, order: 2 },
  { id: "tagihan", name: "Tagihan", kind: "expense", icon: "🧾", color: "#7c3aed", archived: false, order: 3 },
  { id: "hiburan", name: "Hiburan", kind: "expense", icon: "🎬", color: "#ca8a04", archived: false, order: 4 },
  { id: "kesehatan", name: "Kesehatan", kind: "expense", icon: "💊", color: "#dc2626", archived: false, order: 5 },
  { id: "lainnya-keluar", name: "Lainnya", kind: "expense", icon: "📦", color: "#64748b", archived: false, order: 6 },
  { id: "gaji", name: "Gaji", kind: "income", icon: "💼", color: "#16a34a", archived: false, order: 0 },
  { id: "bonus", name: "Bonus", kind: "income", icon: "🎁", color: "#059669", archived: false, order: 1 },
  { id: "freelance", name: "Freelance", kind: "income", icon: "💻", color: "#0d9488", archived: false, order: 2 },
  { id: "lainnya-masuk", name: "Lainnya", kind: "income", icon: "💰", color: "#64748b", archived: false, order: 3 },
];

export const defaultPreferences: Preferences = { currency: "IDR", monthStartDay: 1 };
