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
import { SEED_CAMPAIGNS, type Campaign } from "@/components/dashboard/seed-campaigns";

type DashboardCtx = {
  filters: DashboardFilters;
  setFilters: (f: DashboardFilters) => void;
  openFilter: () => void;
  // Campaigns live here (not just the list page) so a newly-created one
  // survives navigation and the home "진행 중 캠페인" stat can reflect it.
  campaigns: Campaign[];
  addCampaign: (c: Campaign) => void;
  updateCampaign: (c: Campaign) => void;
  removeCampaign: (id: string) => void;
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
  const [campaigns, setCampaigns] = useState<Campaign[]>(SEED_CAMPAIGNS);

  const addCampaign = useCallback(
    (c: Campaign) => setCampaigns((prev) => [c, ...prev]),
    [],
  );
  const updateCampaign = useCallback(
    (c: Campaign) => setCampaigns((prev) => prev.map((x) => (x.id === c.id ? c : x))),
    [],
  );
  const removeCampaign = useCallback(
    (id: string) => setCampaigns((prev) => prev.filter((x) => x.id !== id)),
    [],
  );

  // Demo: no persistence — the filter modal auto-opens on first entry each
  // session; "필터 다시 설정" reopens it, and completing/skipping closes it.
  useEffect(() => {
    setOpen(true);
  }, []);

  const openFilter = useCallback(() => setOpen(true), []);

  return (
    <Ctx.Provider value={{ filters, setFilters, openFilter, campaigns, addCampaign, updateCampaign, removeCampaign }}>
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
