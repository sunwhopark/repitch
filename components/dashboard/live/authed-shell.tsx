"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Package,
  Megaphone,
  Wallet,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { ProfileEditModal, type BrandProfile } from "@/components/dashboard/live/profile-edit-modal";

const NAV = [
  { title: "대시보드", icon: LayoutDashboard, href: "/dashboard" },
  { title: "역제안 인박스", icon: Inbox, href: "/dashboard/inbox" },
  { title: "인플루언서 DB", icon: Users, href: "/dashboard/influencers" },
  { title: "제품", icon: Package, href: "/dashboard/products" },
  { title: "캠페인", icon: Megaphone, href: "/dashboard/campaigns" },
  { title: "정산", icon: Wallet, href: "/dashboard/settlement" },
];

function titleFor(pathname: string) {
  const hit = [...NAV].sort((a, b) => b.href.length - a.href.length).find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
  return hit?.title ?? "대시보드";
}

export function AuthedShell({ brand, inboxCount = 0, children }: { brand: BrandProfile; inboxCount?: number; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 인박스 산출 근거의 "설정에서 조정" 링크(?settings=…) → 프로필 모달 열고 파라미터 제거.
  useEffect(() => {
    if (searchParams.get("settings")) {
      setSettingsOpen(true);
      router.replace(pathname);
    }
  }, [searchParams, pathname, router]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isActive = (href: string) => (href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  return (
    <div className="flex h-[100svh] w-full overflow-hidden bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 shrink-0 overflow-hidden border-r border-border/50 bg-background transition-[width,transform] duration-300 ease-in-out md:static md:z-auto w-[260px]",
          open ? "translate-x-0 md:w-[260px]" : "-translate-x-full md:w-0 md:translate-x-0 md:opacity-0 md:border-none",
        )}
      >
        <div className="flex h-full w-[260px] flex-col bg-card/50 p-3">
          {/* 브랜드 프로필 카드 (1계정 1브랜드 — 스위처/워크스페이스 없음) */}
          <div className="mb-4 flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex size-8 items-center justify-center rounded-[6px] bg-foreground text-[13px] font-semibold text-background shadow-sm">
              {(brand.brand_name ?? "B").charAt(0)}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="mb-1 max-w-[150px] truncate text-[13px] font-medium leading-none text-foreground">
                {brand.brand_name ?? "브랜드"}
              </span>
              <span className="text-[11px] leading-none text-muted-foreground">{brand.category ?? "브랜드 계정"}</span>
            </div>
          </div>

          <nav className="mt-2 flex flex-1 flex-col gap-0.5">
            {NAV.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => router.push(item.href)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-[6px] px-2.5 py-[7px] text-left transition-colors",
                  isActive(item.href)
                    ? "bg-black/5 font-medium text-foreground dark:bg-white/10"
                    : "text-muted-foreground hover:bg-black/5 hover:text-foreground/90 dark:hover:bg-white/5",
                )}
              >
                <item.icon className="size-[16px]" strokeWidth={1.5} />
                <span className="truncate text-[13px] tracking-wide">{item.title}</span>
                {item.href === "/dashboard/inbox" && inboxCount > 0 && (
                  <span className="ml-auto flex min-w-[20px] items-center justify-center rounded-full bg-foreground/10 px-1.5 text-[10px] font-medium text-foreground">{inboxCount}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-0.5 border-t border-border/50 pt-4">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2.5 rounded-[6px] px-2.5 py-[7px] text-left text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground/90 dark:hover:bg-white/5"
            >
              <Settings className="size-[16px]" strokeWidth={1.5} />
              <span className="text-[13px] tracking-wide">설정</span>
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2.5 rounded-[6px] px-2.5 py-[7px] text-left text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground/90 dark:hover:bg-white/5"
            >
              <LogOut className="size-[16px]" strokeWidth={1.5} />
              <span className="text-[13px] tracking-wide">로그아웃</span>
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-foreground/40 md:hidden" aria-hidden onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border/50 bg-card px-4">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="사이드바 토글"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
          >
            {open ? <PanelLeftClose className="size-[18px]" strokeWidth={1.5} /> : <PanelLeftOpen className="size-[18px]" strokeWidth={1.5} />}
          </button>
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <span className="truncate">{brand.brand_name ?? "브랜드"}</span>
            <span>/</span>
            <span className="truncate font-medium text-foreground">{titleFor(pathname)}</span>
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>

      <ProfileEditModal open={settingsOpen} onOpenChange={setSettingsOpen} brand={brand} />
    </div>
  );
}
