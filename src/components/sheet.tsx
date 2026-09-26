"use client";

import { useEffect, useRef } from "react";
import { CloseIcon } from "./icons";

/** Bottom sheet on mobile, centered dialog from md up. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const openedAt = useRef(0);

  useEffect(() => {
    if (!open) return;
    openedAt.current = performance.now();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Tutup"
        className="animate-fade absolute inset-0 bg-black/40"
        // Ignore the ghost click from the tap that opened the sheet.
        onClick={(e) => e.timeStamp - openedAt.current > 350 && onClose()}
      />
      <div className="animate-sheet relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-surface shadow-xl md:max-w-lg md:rounded-3xl">
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-border md:hidden" />
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="-mr-2 rounded-full p-2 text-muted hover:bg-surface-2" aria-label="Tutup">
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pt-1 pb-[calc(env(safe-area-inset-bottom)+1.75rem)]">{children}</div>
      </div>
    </div>
  );
}
