"use client";

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Search } from "lucide-react";
import { cn } from "@/components/ui/utils";

type QueryContextValue = {
  query: string;
  setQuery: (value: string) => void;
};

const QueryContext = createContext<QueryContextValue>({
  query: "",
  setQuery: () => {},
});

export function Command({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [query, setQuery] = useState("");

  return (
    <QueryContext.Provider value={{ query, setQuery }}>
      <div className={cn("flex flex-col", className)}>{children}</div>
    </QueryContext.Provider>
  );
}

export function CommandInput({
  placeholder = "Zoeken...",
  autoFocus = true,
  className,
  inputClassName,
}: {
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  const { query, setQuery } = useContext(QueryContext);

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-zinc-700/45 px-3 py-2",
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-zinc-500" />
      <input
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500",
          inputClassName,
        )}
      />
    </div>
  );
}

type CommandItemElement = ReactElement<{ value: string; hidden?: boolean }>;

function isCommandItem(
  child: ReactNode,
  displayName: string,
): child is CommandItemElement {
  return (
    isValidElement(child) &&
    typeof child.type !== "string" &&
    (child.type as { displayName?: string }).displayName === displayName
  );
}

export function CommandList({ children }: { children: ReactNode }) {
  const { query } = useContext(QueryContext);
  const needle = query.trim().toLowerCase();

  let visibleCount = 0;
  const items = Children.map(children, (child) => {
    if (isCommandItem(child, "CommandEmpty")) return null;
    if (isCommandItem(child, "CommandItem")) {
      const matches = !needle || child.props.value.toLowerCase().includes(needle);
      if (matches) visibleCount += 1;
      return matches ? child : cloneElement(child, { hidden: true });
    }
    return child;
  });

  const emptyState = Children.map(children, (child) =>
    isCommandItem(child, "CommandEmpty") ? child : null,
  )?.find(Boolean);

  return (
    <div className="max-h-64 overflow-y-auto p-1">
      {visibleCount === 0 ? emptyState : items}
    </div>
  );
}

export function CommandEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 py-6 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}
CommandEmpty.displayName = "CommandEmpty";

export function CommandItem({
  value,
  onSelect,
  children,
  className,
  hidden,
}: {
  value: string;
  onSelect: () => void;
  children: ReactNode;
  className?: string;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-white/[0.06]",
        className,
      )}
    >
      {children}
    </button>
  );
}
CommandItem.displayName = "CommandItem";
