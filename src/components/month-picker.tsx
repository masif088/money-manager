"use client";

import { formatMonth, shiftMonth } from "@/lib/format";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export function MonthPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-surface p-1">
      <button onClick={() => onChange(shiftMonth(value, -1))} className="rounded-xl p-2 hover:bg-surface-2" aria-label="Bulan sebelumnya">
        <ChevronLeftIcon className="size-5" />
      </button>
      <span className="font-medium capitalize">{formatMonth(value)}</span>
      <button onClick={() => onChange(shiftMonth(value, 1))} className="rounded-xl p-2 hover:bg-surface-2" aria-label="Bulan berikutnya">
        <ChevronRightIcon className="size-5" />
      </button>
    </div>
  );
}
