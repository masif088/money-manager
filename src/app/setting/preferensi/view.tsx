"use client";

import { useStore } from "@/lib/store";
import { Card, Field, PageHeader, inputClass } from "@/components/ui";

export function PreferensiView() {
  const { preferences, savePreferences } = useStore();

  return (
    <>
      <PageHeader title="Preferensi" back="/setting/" />
      <Card className="mt-1 space-y-5 p-4">
        <Field label="Mata uang">
          <select value={preferences.currency} onChange={(e) => savePreferences({ ...preferences, currency: e.target.value })} className={inputClass}>
            <option value="IDR">IDR — Rupiah</option>
          </select>
        </Field>
        <Field label="Tanggal awal bulan (mis. tanggal gajian)">
          <select
            value={preferences.monthStartDay}
            onChange={(e) => savePreferences({ ...preferences, monthStartDay: Number(e.target.value) })}
            className={inputClass}
          >
            {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                Tanggal {d}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-xs text-muted">
          Periode bulanan custom akan dipakai di laporan & budget setelah sinkron Firestore aktif.
        </p>
      </Card>
    </>
  );
}
