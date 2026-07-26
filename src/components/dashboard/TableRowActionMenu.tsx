"use client";

import { createPortal } from "react-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TableRowMenuItem = {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
};

const MENU_WIDTH = 176;

export default function TableRowActionMenu({
  label,
  items,
  open,
  onOpenChange,
}: {
  label: string;
  items: TableRowMenuItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setPosition(null);
        return;
      }
      const top = rect.bottom + 4;
      let left = rect.right - MENU_WIDTH;
      left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));
      setPosition({ top, left });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      onOpenChange(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  function closeMenu() {
    onOpenChange(false);
  }

  return (
    <>
      <div ref={triggerRef} className="relative inline-flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={(event) => {
            event.stopPropagation();
            onOpenChange(!open);
          }}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={label}
        >
          <MoreHorizontal size={16} />
        </Button>
      </div>

      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                width: MENU_WIDTH,
                zIndex: 60,
              }}
              className="overflow-hidden rounded-xl border border-white/10 bg-zinc-950 py-1 text-left shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              {items.map((item, index) => (
                <div key={item.label}>
                  {item.destructive &&
                  index > 0 &&
                  !items[index - 1]?.destructive ? (
                    <div className="my-1 h-px bg-white/10" />
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeMenu();
                      item.onClick();
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-white/5 ${
                      item.destructive
                        ? "text-rose-300 hover:text-rose-200"
                        : "text-zinc-300 hover:text-zinc-100"
                    }`}
                  >
                    {item.icon ? (
                      <span
                        className={
                          item.destructive ? "text-rose-400" : "text-zinc-500"
                        }
                      >
                        {item.icon}
                      </span>
                    ) : null}
                    {item.label}
                  </button>
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
