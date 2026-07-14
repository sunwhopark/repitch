"use client";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Hash,
  ChevronDown,
  ChevronRight,
  Inbox,
  Megaphone,
  Package,
  Wallet,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { scoreAll, passesFilters } from "@/lib/scoring";
import {
  DashboardProvider,
  useDashboard,
} from "@/components/dashboard/dashboard-context";
import { CreateWorkspaceModal } from "@/components/ui/create-workspace-modal";

type NavItemData = {
  id: string;
  title: string;
  icon: React.ElementType;
  href?: string;
  badge?: number | string;
  shortcut?: string;
  defaultOpen?: boolean;
  children?: NavItemData[];
};

type NavGroupData = {
  heading?: string;
  items: NavItemData[];
};

const DEMO_WORKSPACE = "데모 브랜드";

function buildNavGroups(
  proposalCount: number | null,
  pathname: string,
): NavGroupData[] {
  const inboxBadge =
    proposalCount !== null && proposalCount > 0 ? proposalCount : undefined;

  return [
    {
      items: [
        { id: "search", title: "검색", icon: Search, shortcut: "⌘K" },
        { id: "home", title: "대시보드", icon: LayoutDashboard, href: "/dashboard" },
        {
          id: "inbox",
          title: "역제안 인박스",
          icon: Inbox,
          href: "/dashboard/inbox",
          badge: inboxBadge,
        },
      ],
    },
    {
      heading: "워크스페이스",
      items: [
        {
          id: "influencers",
          title: "인플루언서 DB",
          icon: Users,
          href: "/dashboard/influencers",
        },
        {
          id: "products",
          title: "제품",
          icon: Package,
          href: "/dashboard/products",
        },
        {
          id: "campaigns",
          title: "캠페인",
          icon: Megaphone,
          href: "/dashboard/campaigns",
          defaultOpen: pathname.startsWith("/dashboard/campaigns"),
          children: [
            { id: "c-active", title: "진행 중", icon: Hash, href: "/dashboard/campaigns?status=active" },
            { id: "c-ended", title: "종료", icon: Hash, href: "/dashboard/campaigns?status=ended" },
          ],
        },
      ],
    },
    {
      heading: "관리",
      items: [
        { id: "settlement", title: "정산", icon: Wallet, href: "/dashboard/settlement" },
      ],
    },
  ];
}

const bottomItems: NavItemData[] = [
  { id: "settings", title: "설정", icon: Settings },
  { id: "exit", title: "랜딩으로 나가기", icon: LogOut },
];

function WorkspaceSwitcher({
  workspaces,
  selected,
  onSelectWorkspace,
  onCreateClick,
}: {
  workspaces: string[];
  selected: string;
  onSelectWorkspace: (ws: string) => void;
  onCreateClick: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const current = selected;

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-2 py-2 mb-4 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors select-none group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[6px] bg-foreground text-background flex items-center justify-center font-semibold text-[13px] shadow-sm">
            {current.charAt(0)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-[13px] font-medium leading-none mb-1 text-foreground truncate max-w-[120px]">
              {current}
            </span>
            <span className="text-[11px] text-muted-foreground leading-none">
              DEMO
            </span>
          </div>
        </div>
        <ChevronDown
          className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors shrink-0"
          strokeWidth={1.5}
        />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[52px] left-0 w-full bg-card border border-border/50 rounded-lg shadow-xl z-50 py-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
            {workspaces.map((ws) => (
              <div
                key={ws}
                onClick={() => {
                  onSelectWorkspace(ws);
                  setIsOpen(false);
                }}
                className={cn(
                  "px-3 py-2 mx-1 text-[13px] rounded-md cursor-pointer transition-colors",
                  current === ws
                    ? "bg-foreground/10 text-foreground font-medium"
                    : "text-foreground/80 hover:bg-black/5 dark:hover:bg-white/5",
                )}
              >
                {ws}
              </div>
            ))}
            <div className="h-px bg-border/50 my-1 mx-2" />
            <div
              onClick={() => {
                onCreateClick();
                setIsOpen(false);
              }}
              className="px-3 py-2 mx-1 text-[13px] text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer flex items-center gap-2 transition-colors"
            >
              <span className="text-[16px] leading-none mb-0.5">+</span> 워크스페이스
              만들기
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NavItem({
  item,
  activeId,
  onSelect,
  level = 0,
}: {
  item: NavItemData;
  activeId: string;
  onSelect: (id: string) => void;
  level?: number;
}) {
  const isActive = activeId === item.id;
  const hasChildren = !!item.children;
  const [isOpen, setIsOpen] = useState(!!item.defaultOpen);

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
      if (item.href) onSelect(item.id); // parent with a route also navigates (전체)
    } else {
      onSelect(item.id);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div
        className={cn(
          "group flex items-center justify-between px-2.5 py-[7px] rounded-[6px] cursor-pointer transition-all duration-200 select-none",
          isActive
            ? "bg-black/5 dark:bg-white/10 text-foreground font-medium"
            : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground/90",
        )}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2.5">
          <item.icon
            className={cn(
              "w-[16px] h-[16px] transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground/70 group-hover:text-foreground/70",
            )}
            strokeWidth={1.5}
          />
          <span className="text-[13px] tracking-wide truncate">{item.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {item.shortcut && (
            <kbd className="hidden group-hover:inline-flex items-center justify-center h-5 px-1.5 text-[10px] font-medium font-mono text-muted-foreground/60 bg-background/50 border border-border/50 rounded-[4px] shadow-xs">
              {item.shortcut}
            </kbd>
          )}
          {item.badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-medium rounded-full bg-foreground/10 text-foreground">
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight
              className={cn(
                "w-3.5 h-3.5 text-muted-foreground/50 transition-transform duration-200",
                isOpen && "rotate-90",
              )}
              strokeWidth={2}
            />
          )}
        </div>
      </div>

      {hasChildren && (
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden min-h-0 relative flex flex-col gap-0.5 mt-0.5">
            <div
              className="absolute top-0 bottom-0 border-l border-black/5 dark:border-white/5"
              style={{ left: `${level * 12 + 17.5}px` }}
            />
            {item.children!.map((child) => (
              <NavItem
                key={child.id}
                item={child}
                activeId={activeId}
                onSelect={onSelect}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarNav({
  groups,
  activeId,
  onSelect,
  workspaces,
  selectedWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
}: {
  groups: NavGroupData[];
  activeId: string;
  onSelect: (id: string) => void;
  workspaces: string[];
  selectedWorkspace: string;
  onSelectWorkspace: (ws: string) => void;
  onCreateWorkspace: () => void;
}) {
  return (
    <div className="flex flex-col w-[260px] h-full bg-card/50 p-3">
      <WorkspaceSwitcher
        workspaces={workspaces}
        selected={selectedWorkspace}
        onSelectWorkspace={onSelectWorkspace}
        onCreateClick={onCreateWorkspace}
      />

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col gap-4 mt-2">
        {groups.map((group, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="px-2.5 mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
                {group.heading}
              </span>
            )}
            {group.items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                activeId={activeId}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-border/50 flex flex-col gap-0.5">
        {bottomItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            activeId={activeId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function activeIdFromPath(pathname: string, status: string | null): string {
  if (pathname === "/dashboard") return "home";
  if (pathname.startsWith("/dashboard/inbox")) return "inbox";
  if (pathname.startsWith("/dashboard/influencers")) return "influencers";
  if (pathname.startsWith("/dashboard/products")) return "products";
  if (pathname.startsWith("/dashboard/campaigns")) {
    if (status === "active") return "c-active";
    if (status === "ended") return "c-ended";
    return "campaigns";
  }
  if (pathname.startsWith("/dashboard/settlement")) return "settlement";
  return "";
}

const ROUTE_BY_ID: Record<string, string> = {
  home: "/dashboard",
  inbox: "/dashboard/inbox",
  influencers: "/dashboard/influencers",
  products: "/dashboard/products",
  settlement: "/dashboard/settlement",
  campaigns: "/dashboard/campaigns",
  "c-active": "/dashboard/campaigns?status=active",
  "c-ended": "/dashboard/campaigns?status=ended",
};

const TITLE_BY_ID: Record<string, string> = {
  home: "대시보드",
  inbox: "역제안 인박스",
  influencers: "인플루언서 DB",
  products: "제품",
  campaigns: "캠페인",
  "c-active": "캠페인",
  "c-ended": "캠페인",
  settlement: "정산",
};

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openFilter, filters, decisions } = useDashboard();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<string[]>([DEMO_WORKSPACE]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(DEMO_WORKSPACE);
  const [createOpen, setCreateOpen] = useState(false);

  const createWorkspace = (name: string) => {
    setWorkspaces((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setSelectedWorkspace(name);
    setCreateOpen(false);
  };

  const activeId = activeIdFromPath(pathname, searchParams.get("status"));
  const activeTitle = TITLE_BY_ID[activeId] ?? "대시보드";
  // Inbox badge = 받은 제안(무응답) 수 — 필터를 통과하고 아직 응답 안 한 제안.
  // 응답하면 줄어든다(데모 컨텍스트 기준).
  const inboxCount = useMemo(
    () => scoreAll().filter((s) => passesFilters(s.proposal, filters) && !decisions[s.proposal.id]).length,
    [filters, decisions],
  );
  const groups = buildNavGroups(inboxCount, pathname);

  // Start collapsed (drawer closed) on mobile.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    if (mq.matches) setIsOpen(false);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ⌘K / Ctrl+K opens the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = (id: string) => {
    if (id === "search") {
      setIsSearchOpen(true);
      return;
    }
    if (id === "settings") {
      // Temporary: reuse the filter modal until a real settings page exists.
      openFilter();
      if (isMobile) setIsOpen(false);
      return;
    }
    if (id === "exit") {
      router.push("/");
      return;
    }
    const href = ROUTE_BY_ID[id];
    if (href) {
      router.push(href);
      if (isMobile) setIsOpen(false);
    }
  };

  return (
    <div className="flex h-[100svh] w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar — desktop: width collapse; mobile: slide-in drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 shrink-0 overflow-hidden border-r border-border/50 bg-background transition-[width,transform] duration-300 ease-in-out md:static md:z-auto",
          "w-[260px]",
          isOpen
            ? "translate-x-0 opacity-100 md:w-[260px]"
            : "-translate-x-full opacity-100 md:w-0 md:translate-x-0 md:opacity-0 md:border-none",
        )}
      >
        <SidebarNav
          groups={groups}
          activeId={activeId}
          onSelect={handleSelect}
          workspaces={workspaces}
          selectedWorkspace={selectedWorkspace}
          onSelectWorkspace={setSelectedWorkspace}
          onCreateWorkspace={() => setCreateOpen(true)}
        />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header — collapse toggle + breadcrumb */}
        <div className="h-14 border-b border-border/50 flex items-center px-4 justify-between bg-card shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="사이드바 토글"
              className="p-1.5 rounded-md text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors shrink-0"
            >
              {isOpen ? (
                <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.5} />
              ) : (
                <PanelLeftOpen className="w-[18px] h-[18px]" strokeWidth={1.5} />
              )}
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
              <span className="truncate">{selectedWorkspace}</span>
              <span>/</span>
              <span className="font-medium text-foreground truncate">
                {activeTitle}
              </span>
            </div>
          </div>
        </div>

        {/* Pages own their scroll/padding (inbox is a full-bleed split view). */}
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>

      {/* Create workspace (responsive Dialog/Drawer) */}
      <CreateWorkspaceModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={createWorkspace}
      />

      {/* ⌘K command palette */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/40 backdrop-blur-sm px-4">
          <div className="absolute inset-0" onClick={() => setIsSearchOpen(false)} />
          <div className="relative w-full max-w-xl bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center px-4 border-b border-border/50">
              <Search
                className="w-[18px] h-[18px] text-muted-foreground/70 mr-3 shrink-0"
                strokeWidth={1.5}
              />
              <input
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsSearchOpen(false);
                }}
                className="flex-1 bg-transparent py-4 outline-none text-[14px] text-foreground placeholder:text-muted-foreground/50"
                placeholder="프로젝트, 문서, 액션 검색..."
              />
              <kbd
                onClick={() => setIsSearchOpen(false)}
                className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 ml-2 text-[10px] font-medium font-mono text-muted-foreground/70 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-[4px] cursor-pointer hover:text-foreground hover:bg-black/10 dark:hover:bg-white/20 transition-colors"
              >
                ESC
              </kbd>
              <button
                onClick={() => setIsSearchOpen(false)}
                aria-label="검색 닫기"
                className="ml-3 p-1 rounded-md text-muted-foreground/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground transition-colors"
              >
                <X className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-2 py-8 flex flex-col items-center justify-center">
              <Command
                className="w-6 h-6 text-muted-foreground/30 mb-2"
                strokeWidth={1.5}
              />
              <p className="text-[13px] text-muted-foreground font-medium">
                명령어를 입력하거나 검색하세요...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardProvider>
      <Suspense fallback={null}>
        <DashboardShell>{children}</DashboardShell>
      </Suspense>
    </DashboardProvider>
  );
}
