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
import type { Decision } from "@/components/dashboard/proposal-detail";

type DashboardCtx = {
  filters: DashboardFilters;
  setFilters: (f: DashboardFilters) => void;
  openFilter: () => void;
  // Campaigns live here (not just the list page) so a newly-created one
  // survives navigation and the home "진행 중 캠페인" stat can reflect it.
  campaigns: Campaign[];
  addCampaign: (c: Campaign) => void;
  updateCampaign: (c: Campaign) => void;
  // Functional update by id — safe from stale closures (선정/발송/배송 시뮬).
  mutateCampaign: (id: string, fn: (c: Campaign) => Campaign) => void;
  removeCampaign: (id: string) => void;
  // 역제안 응답 상태 — 인박스와 캠페인 상세 패널이 공유(양쪽 동기화).
  decisions: Record<string, Decision>;
  setDecision: (id: string, d: Decision) => void;
  // 인플루언서 DB 관심 표시(메모리) — 페이지 이동에도 유지.
  favorites: string[];
  toggleFavorite: (id: string) => void;
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
  const mutateCampaign = useCallback(
    (id: string, fn: (c: Campaign) => Campaign) =>
      setCampaigns((prev) => prev.map((x) => (x.id === id ? fn(x) : x))),
    [],
  );
  const removeCampaign = useCallback(
    (id: string) => setCampaigns((prev) => prev.filter((x) => x.id !== id)),
    [],
  );

  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const setDecision = useCallback(
    (id: string, d: Decision) => setDecisions((prev) => ({ ...prev, [id]: d })),
    [],
  );

  const [favorites, setFavorites] = useState<string[]>([]);
  const toggleFavorite = useCallback(
    (id: string) =>
      setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [],
  );

  // Demo: no persistence — the filter modal auto-opens on first entry each
  // session; "필터 다시 설정" reopens it, and completing/skipping closes it.
  useEffect(() => {
    setOpen(true);
  }, []);

  const openFilter = useCallback(() => setOpen(true), []);

  return (
    <Ctx.Provider value={{ filters, setFilters, openFilter, campaigns, addCampaign, updateCampaign, mutateCampaign, removeCampaign, decisions, setDecision, favorites, toggleFavorite }}>
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
