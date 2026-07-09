"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";

const STORAGE_KEY = "archon-dashboard-side-panel-collapsed";

type SidePanelContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

function useSidePanel() {
  const ctx = useContext(SidePanelContext);
  if (!ctx) {
    throw new Error("useSidePanel must be used within DashboardSidePanelProvider");
  }
  return ctx;
}

export function DashboardSidePanelProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed, enabled]);

  const toggle = () => setCollapsed((value) => !value);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <SidePanelContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidePanelContext.Provider>
  );
}

export function DashboardMain({
  children,
  className,
  showSidePanel,
  id,
  tabIndex,
}: {
  children: ReactNode;
  className: string;
  showSidePanel: boolean;
  id?: string;
  tabIndex?: number;
}) {
  const ctx = useContext(SidePanelContext);
  const collapsed = ctx?.collapsed ?? true;
  const padWhenOpen =
    showSidePanel && !collapsed
      ? "lg:pr-[min(22rem,26vw)] xl:pr-[24rem] 2xl:pr-[26rem]"
      : "";

  return (
    <main id={id} tabIndex={tabIndex} className={`${className} ${padWhenOpen}`}>
      {children}
    </main>
  );
}

export function DashboardSidePanel({
  children,
  topbarOffset,
}: {
  children: ReactNode;
  topbarOffset: string;
}) {
  const { collapsed, toggle } = useSidePanel();

  return (
    <>
      <aside
        aria-label="AI Control Center"
        aria-hidden={collapsed}
        className={`fixed bottom-0 right-0 z-20 hidden w-[min(22rem,26vw)] border-l border-white/10 bg-zinc-950/90 p-3.5 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:block xl:w-[24rem] 2xl:w-[26rem] ${topbarOffset} ${
          collapsed ? "pointer-events-none translate-x-full" : "translate-x-0"
        }`}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label="AI Control Center inklappen"
          title="Inklappen"
          className="absolute -left-3.5 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-900 text-zinc-300 shadow-lg transition-colors hover:border-sky-500/30 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <ChevronRight size={15} />
        </button>
        <div
          className={`h-full min-h-0 transition-opacity duration-200 ${
            collapsed ? "opacity-0" : "opacity-100"
          }`}
        >
          {children}
        </div>
      </aside>

      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label="AI Control Center openen"
        title="AI Control Center"
        className={`fixed right-0 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-1 rounded-l-xl border border-r-0 border-white/10 bg-zinc-950/95 px-2 py-3 text-zinc-300 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-sky-500/30 hover:bg-zinc-900 hover:text-zinc-100 lg:flex ${
          collapsed
            ? "translate-x-0 opacity-100"
            : "pointer-events-none translate-x-full opacity-0"
        }`}
      >
        <Radio size={14} className="text-emerald-400" />
        <ChevronLeft size={14} />
      </button>
    </>
  );
}
