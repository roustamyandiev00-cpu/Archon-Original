"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";

const STORAGE_KEY = "archon-dashboard-side-panel-collapsed";

type SidePanelContextValue = {
  collapsed: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

export function dispatchOpenControlCenter() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("archon:open-control-center"));
}

const SidePanelContext = createContext<SidePanelContextValue | null>(null);

const subscribeToClient = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function readStoredCollapsed() {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "1") return true;
  if (stored === "0") return false;
  return true;
}

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
  const [collapsed, setCollapsed] = useState(() => readStoredCollapsed());
  const [hydrated, setHydrated] = useState(false);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!enabled || !hydrated) return;
    localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed, enabled, hydrated]);

  const setCollapsedUser = useCallback(
    (next: boolean | ((value: boolean) => boolean)) => {
      userInteractedRef.current = true;
      setCollapsed(next);
    },
    [],
  );

  const toggle = useCallback(
    () => setCollapsedUser((value) => !value),
    [setCollapsedUser],
  );
  const open = useCallback(() => setCollapsedUser(false), [setCollapsedUser]);
  const close = useCallback(() => setCollapsedUser(true), [setCollapsedUser]);

  useEffect(() => {
    if (!enabled) return;
    const handler = () => open();
    window.addEventListener("archon:open-control-center", handler);
    return () => window.removeEventListener("archon:open-control-center", handler);
  }, [enabled, open]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <SidePanelContext.Provider value={{ collapsed, toggle, open, close }}>
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
  const padWhenCollapsed =
    showSidePanel && collapsed ? "lg:pr-11" : "";

  return (
    <main id={id} tabIndex={tabIndex} className={`dashboard-main ${className} ${padWhenOpen} ${padWhenCollapsed}`}>
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
  const { collapsed, open, close } = useSidePanel();
  const mounted = useSyncExternalStore(
    subscribeToClient,
    clientSnapshot,
    serverSnapshot,
  );

  if (!mounted) return null;

  const panel = (
    <>
      {!collapsed && (
        <aside
          aria-label="AI Control Center"
          className={`dashboard-side-panel fixed bottom-0 right-0 z-40 hidden w-[min(22rem,26vw)] border-l border-zinc-800 bg-zinc-950 p-3.5 transition-transform duration-300 ease-in-out lg:block xl:w-[24rem] 2xl:w-[26rem] ${topbarOffset}`}
        >
          <button
            type="button"
            onClick={close}
            aria-expanded
            aria-label="AI Control Center inklappen"
            title="Inklappen"
            data-no-swipe
            className="dashboard-side-panel-handle absolute -left-3.5 top-5 z-50 flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
          >
            <ChevronRight size={15} />
          </button>
          <div className="h-full min-h-0">{children}</div>
        </aside>
      )}

      {collapsed && (
        <button
          type="button"
          onClick={open}
          aria-expanded={false}
          aria-label="AI Control Center openen"
          title="AI Control Center"
          data-no-swipe
          className="dashboard-side-panel-tab fixed right-0 top-1/2 z-50 hidden min-h-[4.5rem] min-w-[2.75rem] -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-l-xl border border-r-0 border-zinc-800 bg-zinc-950 px-2.5 py-3 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200 lg:flex"
        >
          <Radio size={14} className="text-zinc-500" />
          <ChevronLeft size={14} />
        </button>
      )}
    </>
  );

  return createPortal(panel, document.body);
}
