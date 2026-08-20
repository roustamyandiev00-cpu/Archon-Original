"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Cog, Download, EyeOff, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ColumnOption = {
  id: string;
  label: string;
};

export default function DataPanelToolbar({
  showFilters,
  onToggleFilters,
  columns,
  columnVisibility,
  onColumnVisibilityChange,
  onExport,
  exportLabel,
  children,
}: {
  showFilters: boolean;
  onToggleFilters: () => void;
  columns?: readonly ColumnOption[];
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (id: string, visible: boolean) => void;
  onExport: () => void;
  exportLabel: string;
  children?: ReactNode;
}) {
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!customizeOpen || !triggerRef.current) {
      setMenuPos(null);
      return;
    }

    function update() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = 208;
      let left = rect.right - width;
      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
      setMenuPos({ top: rect.bottom + 6, left });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [customizeOpen]);

  useEffect(() => {
    if (!customizeOpen) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setCustomizeOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCustomizeOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [customizeOpen]);

  const canCustomize =
    columns &&
    columnVisibility &&
    onColumnVisibilityChange &&
    columns.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
      <Button
        type="button"
        variant="ghost"
        aria-label={showFilters ? "Filters verbergen" : "Filters tonen"}
        onClick={onToggleFilters}
      >
        {showFilters ? <EyeOff size={15} /> : <SlidersHorizontal size={15} />}
        <span className="hidden sm:inline">
          {showFilters ? "Verbergen" : "Filters"}
        </span>
      </Button>

      {canCustomize && (
        <div className="relative" ref={triggerRef}>
          <Button
            type="button"
            variant="ghost"
            aria-label="Kolommen aanpassen"
            aria-expanded={customizeOpen}
            aria-haspopup="menu"
            onClick={() => setCustomizeOpen((value) => !value)}
          >
            <Cog size={15} />
            <span className="hidden sm:inline">Kolommen</span>
          </Button>

          {customizeOpen && menuPos
            ? createPortal(
                <div
                  ref={menuRef}
                  role="menu"
                  style={{
                    position: "fixed",
                    top: menuPos.top,
                    left: menuPos.left,
                    width: 208,
                    zIndex: 70,
                  }}
                  className="dashboard-panel-menu rounded-xl border border-white/10 bg-zinc-950 py-2 shadow-2xl"
                >
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    Kolommen
                  </p>
                  {columns.map((column) => (
                    <label
                      key={column.id}
                      className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={columnVisibility[column.id] ?? true}
                        onChange={(event) =>
                          onColumnVisibilityChange(
                            column.id,
                            event.target.checked,
                          )
                        }
                        className="h-4 w-4 rounded border-white/20 bg-zinc-950 accent-sky-500"
                      />
                      {column.label}
                    </label>
                  ))}
                </div>,
                document.body,
              )
            : null}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        aria-label={exportLabel}
        onClick={onExport}
      >
        <Download size={15} />
        <span className="hidden sm:inline">Exporteren</span>
      </Button>

      {children}
    </div>
  );
}
