"use client";

export const COLORS = [
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#059669", "#0d9488",
  "#0891b2", "#0284c7", "#2563eb", "#7c3aed", "#db2777", "#64748b",
];

export const EMOJIS = [
  "🍜", "☕", "🛒", "🛍️", "🛵", "🚗", "⛽", "🏠", "💡", "🧾", "📱", "🌐",
  "🎬", "🎮", "✈️", "💊", "🏥", "🎓", "📚", "👶", "🐱", "🎁", "💇", "👕",
  "💼", "💰", "💻", "📈", "🏦", "💵", "💳", "🪙", "🤝", "❤️", "🔧", "📦",
];

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={c}
          onClick={() => onChange(c)}
          className={`aspect-square rounded-full transition ${value === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-surface" : ""}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

export function EmojiPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          className={`grid aspect-square place-items-center rounded-lg text-lg transition ${
            value === e ? "bg-primary-soft ring-2 ring-primary" : "bg-surface-2"
          }`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-left"
    >
      <span className="text-sm">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-primary" : "bg-border"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-5.5" : "left-0.5"}`} />
      </span>
    </button>
  );
}
