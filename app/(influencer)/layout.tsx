"use client";

import { usePathname } from "next/navigation";
import { Compass, LayoutList, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/campaigns", label: "캠페인", icon: Compass },
  { href: "/my", label: "내 활동", icon: LayoutList },
  { href: "/me", label: "프로필", icon: User },
];

// 인플루언서 워크스페이스 셸 — 모바일 우선. 브랜드 대시보드 셸과 무관(별도).
// 모바일: 상단 미니 헤더 + 하단 탭 바. 데스크탑(md+): 상단 헤더 네비, 콘텐츠 중앙 정렬.
export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-[100svh] flex-col bg-background text-foreground">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-xl items-center justify-between px-4">
          <a href="/campaigns" className="inline-flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/repitch_wordmark_alpha.png" alt="repitch" className="h-6 w-auto dark:invert" />
          </a>
          {/* 데스크탑 네비 */}
          <nav className="hidden items-center gap-1 md:flex">
            {TABS.map((t) => (
              <a
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(t.href) ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-24 pt-4 md:pb-10">{children}</main>

      {/* 하단 탭 바 (모바일) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto flex w-full max-w-xl">
          {TABS.map((t) => (
            <a
              key={t.href}
              href={t.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                isActive(t.href) ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <t.icon className={cn("size-5", isActive(t.href) ? "" : "opacity-70")} strokeWidth={1.75} />
              {t.label}
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
