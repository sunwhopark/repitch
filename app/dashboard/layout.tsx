"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Megaphone,
  Wallet,
  Settings,
  LogOut,
  SlidersHorizontal,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import {
  DashboardProvider,
  useDashboard,
} from "@/components/dashboard/dashboard-context";

// Static for the demo — swap for the real brand account later.
const DEMO_BRAND = { name: "데모 브랜드", sublabel: "DEMO" };

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: "proposal";
};

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: "워크스페이스",
    items: [
      { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
      { href: "/dashboard/inbox", label: "역제안 인박스", icon: Inbox, badge: "proposal" },
      { href: "/dashboard/influencers", label: "인플루언서 DB", icon: Users },
    ],
  },
  {
    heading: "관리",
    items: [
      { href: "/dashboard/campaigns", label: "캠페인", icon: Megaphone },
      { href: "/dashboard/settlement", label: "정산", icon: Wallet },
    ],
  },
];

const itemBase =
  "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors";
const itemActive = "bg-foreground/10 text-foreground font-medium";
const itemIdle = "text-muted-foreground hover:bg-foreground/5 hover:text-foreground";

function SidebarContent({
  pathname,
  proposalCount,
  onNavigate,
  onReconfigure,
}: {
  pathname: string;
  proposalCount: number | null;
  onNavigate: () => void;
  onReconfigure: () => void;
}) {
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col">
      {/* Brand identity + switcher */}
      <div className="shrink-0 px-3 pt-4">
        <Link href="/" className="inline-flex items-center px-1">
          <img
            src="/repitch_wordmark_alpha.png"
            alt="repitch"
            className="h-5 w-auto dark:invert"
          />
        </Link>
        <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-border px-2.5 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-[13px] font-semibold text-background">
            {DEMO_BRAND.name.charAt(0)}
          </div>
          <div className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-[13px] font-medium text-foreground">
              {DEMO_BRAND.name}
            </span>
            <span className="mt-1 text-[11px] tracking-wide text-muted-foreground">
              {DEMO_BRAND.sublabel}
            </span>
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} className="space-y-0.5">
            <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.heading}
            </span>
            {group.items.map(({ href, label, icon: Icon, badge }) => {
              const showBadge =
                badge === "proposal" &&
                proposalCount !== null &&
                proposalCount > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(itemBase, isActive(href) ? itemActive : itemIdle)}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                  <span className="flex-1 truncate">{label}</span>
                  {showBadge && (
                    <span className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-foreground/10 px-1.5 py-0.5 text-[11px] font-medium text-foreground">
                      {proposalCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="shrink-0 space-y-0.5 border-t border-border px-3 py-3">
        <button
          type="button"
          className={cn(itemBase, itemIdle)}
          onClick={() => {
            onNavigate();
            onReconfigure();
          }}
        >
          <SlidersHorizontal className="size-4 shrink-0" strokeWidth={1.75} />
          <span className="flex-1 text-left">필터 다시 설정</span>
        </button>
        <button
          type="button"
          className={cn(itemBase, itemIdle, "cursor-default")}
          title="준비 중"
        >
          <Settings className="size-4 shrink-0" strokeWidth={1.75} />
          <span className="flex-1 text-left">설정</span>
        </button>
        <Link href="/" className={cn(itemBase, itemIdle)}>
          <LogOut className="size-4 shrink-0" strokeWidth={1.75} />
          <span className="flex-1 text-left">랜딩으로 나가기</span>
        </Link>
      </div>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { openFilter } = useDashboard();
  const [proposalCount, setProposalCount] = useState<number | null>(null);

  // Inbox badge = proposal_submissions count (reuse the counts RPC). Hidden on failure.
  useEffect(() => {
    let active = true;
    supabase.rpc("get_application_counts").then(({ data, error }) => {
      if (!active || error || !data) return;
      setProposalCount(Number(data.proposal) || 0);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-[100svh] w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 border-r border-border bg-background transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col">
          {/* mobile close */}
          <div className="flex justify-end px-3 pt-3 md:hidden">
            <button type="button" aria-label="사이드바 닫기" onClick={() => setOpen(false)}>
              <X className="size-5" />
            </button>
          </div>
          <SidebarContent
            pathname={pathname}
            proposalCount={proposalCount}
            onNavigate={() => setOpen(false)}
            onReconfigure={openFilter}
          />
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 md:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:hidden">
          <button type="button" aria-label="메뉴 열기" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </button>
          <img
            src="/repitch_wordmark_alpha.png"
            alt="repitch"
            className="h-5 w-auto dark:invert"
          />
        </div>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
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
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
