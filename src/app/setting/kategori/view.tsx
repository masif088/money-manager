"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatRupiah } from "@/lib/format";
import type { Category, CategoryKind } from "@/lib/types";
import { Card, EmptyState, Field, PageHeader, Segmented, inputClass } from "@/components/ui";
import { Sheet } from "@/components/sheet";
import { ChevronRightIcon, PlusIcon } from "@/components/icons";
import { ColorPicker, EmojiPicker, Toggle } from "@/components/pickers";

export function KategoriView() {
  const { categories, transactions } = useStore();
  const [kind, setKind] = useState<CategoryKind>("expense");
  const [editing, setEditing] = useState<{ open: boolean; item?: Category; key: number }>({ open: false, key: 0 });

  const list = categories.filter((c) => c.kind === kind).sort((a, b) => Number(a.archived) - Number(b.archived) || a.order - b.order);
  const usage = (id: string) => transactions.filter((t) => t.categoryId === id).length;

  const open = (item?: Category) => setEditing((s) => ({ open: true, item, key: s.key + 1 }));
  const close = () => setEditing((s) => ({ ...s, open: false }));

  return (
    <>
      <PageHeader
        title="Kategori"
        back="/setting/"
        action={
          <button onClick={() => open()} className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            <PlusIcon className="size-4" /> Tambah
          </button>
        }
      />
      <div className="space-y-4 pt-1">
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: "expense", label: "Pengeluaran", activeClass: "text-expense" },
            { value: "income", label: "Pemasukan", activeClass: "text-income" },
          ]}
        />

        <Card className="divide-y divide-border overflow-hidden">
          {list.length === 0 && <EmptyState icon="🏷️" title="Belum ada kategori" />}
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => open(c)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2 ${c.archived ? "opacity-50" : ""}`}
            >
              <span className="grid size-10 place-items-center rounded-full text-lg" style={{ backgroundColor: `${c.color}22` }}>
                {c.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {c.name}
                  {c.archived && <span className="ml-2 text-xs font-normal text-muted">(diarsipkan)</span>}
                </span>
                <span className="block text-xs text-muted">
                  {usage(c.id)} transaksi{c.budget ? ` · budget ${formatRupiah(c.budget)}/bln` : ""}
                </span>
              </span>
              <span className="size-3 rounded-full" style={{ backgroundColor: c.color }} />
              <ChevronRightIcon className="size-5 text-muted" />
            </button>
          ))}
        </Card>
      </div>

      <Sheet open={editing.open} onClose={close} title={editing.item ? "Ubah kategori" : "Kategori baru"}>
        <CategoryForm key={editing.key} initial={editing.item} defaultKind={kind} usage={editing.item ? usage(editing.item.id) : 0} onDone={close} />
      </Sheet>
    </>
  );
}

const numberFmt = new Intl.NumberFormat("id-ID");

function CategoryForm({
  initial,
  defaultKind,
  usage,
  onDone,
}: {
  initial?: Category;
  defaultKind: CategoryKind;
  usage: number;
  onDone: () => void;
}) {
  const { saveCategory, deleteCategory } = useStore();
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<CategoryKind>(initial?.kind ?? defaultKind);
  const [icon, setIcon] = useState(initial?.icon ?? "🏷️");
  const [color, setColor] = useState(initial?.color ?? "#0d9488");
  const [budget, setBudget] = useState(initial?.budget ?? 0);
  const [archived, setArchived] = useState(initial?.archived ?? false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    saveCategory({
      id: initial?.id,
      name: name.trim(),
      kind,
      icon,
      color,
      budget: kind === "expense" && budget > 0 ? budget : undefined,
      archived,
    });
    onDone();
  }

  function remove() {
    if (!initial) return;
    const msg = usage
      ? `Kategori ini dipakai ${usage} transaksi. Transaksi tersebut akan jadi "Tanpa kategori". Lebih aman diarsipkan. Tetap hapus?`
      : "Hapus kategori ini?";
    if (confirm(msg)) {
      deleteCategory(initial.id);
      onDone();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl" style={{ backgroundColor: `${color}22` }}>
          {icon}
        </span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kategori" className={inputClass} autoFocus={!initial} required />
      </div>

      {!initial && (
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: "expense", label: "Pengeluaran", activeClass: "text-expense" },
            { value: "income", label: "Pemasukan", activeClass: "text-income" },
          ]}
        />
      )}

      <Field label="Ikon">
        <EmojiPicker value={icon} onChange={setIcon} />
      </Field>

      <Field label="Warna">
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      {kind === "expense" && (
        <Field label="Budget bulanan (opsional)">
          <div className="relative">
            <span className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">Rp</span>
            <input
              inputMode="numeric"
              value={budget ? numberFmt.format(budget) : ""}
              onChange={(e) => setBudget(Number(e.target.value.replace(/\D/g, "")) || 0)}
              placeholder="0"
              className={`${inputClass} tabular pl-10`}
            />
          </div>
        </Field>
      )}

      {initial && <Toggle checked={archived} onChange={setArchived} label="Arsipkan (sembunyikan dari form)" />}

      <div className="flex gap-3">
        {initial && (
          <button type="button" onClick={remove} className="rounded-xl border border-border px-4 py-3 font-medium text-expense">
            Hapus
          </button>
        )}
        <button type="submit" className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground">
          Simpan
        </button>
      </div>
    </form>
  );
}
