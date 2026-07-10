"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type DashboardTourContextValue = {
  showTour: boolean;
  isReplay: boolean;
  startTour: (options?: { replay?: boolean }) => void;
  dismissTour: () => void;
};

const DashboardTourContext = createContext<DashboardTourContextValue | null>(
  null,
);

export function DashboardTourProvider({ children }: { children: ReactNode }) {
  const [showTour, setShowTour] = useState(false);
  const [isReplay, setIsReplay] = useState(false);

  const startTour = useCallback((options?: { replay?: boolean }) => {
    setIsReplay(options?.replay ?? false);
    setShowTour(true);
  }, []);

  const dismissTour = useCallback(() => setShowTour(false), []);

  return (
    <DashboardTourContext.Provider
      value={{ showTour, isReplay, startTour, dismissTour }}
    >
      {children}
    </DashboardTourContext.Provider>
  );
}

export function useDashboardTour() {
  const ctx = useContext(DashboardTourContext);
  if (!ctx) {
    throw new Error("useDashboardTour must be used within DashboardTourProvider");
  }
  return ctx;
}
