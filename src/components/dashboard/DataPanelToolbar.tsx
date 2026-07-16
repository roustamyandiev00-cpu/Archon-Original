"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  const customizeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customizeOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!customizeRef.current?.contains(event.target as Node)) {
        setCustomizeOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
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
          {showFilters ? "Hide" : "Filters"}
        </span>
      </Button>

      {canCustomize && (
        <div className="relative" ref={customizeRef}>
          <Button
            type="button"
            variant="ghost"
            aria-label="Kolommen aanpassen"
            aria-expanded={customizeOpen}
            onClick={() => setCustomizeOpen((value) => !value)}
          >
            <Cog size={15} />
            <span className="hidden sm:inline">Customize</span>
          </Button>

          {customizeOpen && (
            <div
              role="menu"
              className="dashboard-panel-menu absolute right-0 top-[calc(100%+0.35rem)] z-50 w-52 rounded-xl border border-white/10 bg-zinc-950 py-2 shadow-2xl"
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
                      onColumnVisibilityChange(column.id, event.target.checked)
                    }
                    className="h-4 w-4 rounded border-white/20 bg-zinc-950 accent-sky-500"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        aria-label={exportLabel}
        onClick={onExport}
      >
        <Download size={15} />
        <span className="hidden sm:inline">Export</span>
      </Button>

      {children}
    </div>
  );
}
