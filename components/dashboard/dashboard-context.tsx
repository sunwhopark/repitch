"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  FilterModal,
  DEFAULT_FILTERS,
  type DashboardFilters,
} from "@/components/dashboard/filter-modal";

type DashboardCtx = {
  filters: DashboardFilters;
  openFilter: () => void;
};

const Ctx = createContext<DashboardCtx | null>(null);

// Consumed by workspace pages (e.g. the inbox, next step) to read the filters.
export function useDashboard() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDashboard must be used within <DashboardProvider>");
  return c;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [open, setOpen] = useState(false);

  // Demo: no persistence — the filter modal auto-opens on first entry each
  // session; "필터 다시 설정" reopens it, and completing/skipping closes it.
  useEffect(() => {
    setOpen(true);
  }, []);

  const openFilter = useCallback(() => setOpen(true), []);

  return (
    <Ctx.Provider value={{ filters, openFilter }}>
      {children}
      <FilterModal
        open={open}
        initial={filters}
        onSkip={() => setOpen(false)}
        onComplete={(f) => {
          setFilters(f);
          setOpen(false);
        }}
      />
    </Ctx.Provider>
  );
}
