"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/components/ui/utils";

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error("Popover.* moet binnen <Popover> gebruikt worden.");
  return ctx;
}

export function Popover({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (controlledOpen === undefined) setUncontrolledOpen(next);
  };

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block w-full">{children}</div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({
  children,
  asChild,
}: {
  children: ReactNode;
  asChild?: boolean;
}) {
  const { open, setOpen, triggerRef } = usePopoverContext();

  if (asChild) {
    return (
      <div
        ref={(node) => {
          triggerRef.current = node;
        }}
        onClick={() => setOpen(!open)}
      >
        {children}
      </div>
    );
  }

  return (
    <button
      type="button"
      ref={(node) => {
        triggerRef.current = node;
      }}
      onClick={() => setOpen(!open)}
    >
      {children}
    </button>
  );
}

export function PopoverContent({
  className,
  children,
  align = "start",
}: {
  className?: string;
  children: ReactNode;
  align?: "start" | "end";
}) {
  const { open, setOpen, triggerRef } = usePopoverContext();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (contentRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "absolute top-[calc(100%+0.375rem)] z-50 w-full rounded-xl border border-zinc-200/80 bg-white shadow-xl shadow-black/5 dark:border-white/10 dark:bg-zinc-900 dark:shadow-black/40",
        align === "end" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
