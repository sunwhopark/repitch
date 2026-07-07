"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Megaphone,
  Wallet,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/dashboard/inbox", label: "역제안 인박스", icon: Inbox },
  { href: "/dashboard/influencers", label: "인플루언서 DB", icon: Users },
  { href: "/dashboard/campaigns", label: "캠페인", icon: Megaphone },
  { href: "/dashboard/settlement", label: "정산", icon: Wallet },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <div className="flex min-h-[100svh] w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-background transition-transform duration-200 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/repitch_wordmark_alpha.png"
              alt="repitch"
              className="h-6 w-auto dark:invert"
            />
          </Link>
          <button
            type="button"
            className="md:hidden"
            aria-label="사이드바 닫기"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="shrink-0 px-4 py-4">
          <span className="inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium tracking-wide text-muted-foreground">
            DEMO
          </span>
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
        {/* Mobile top bar */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 md:hidden">
          <button
            type="button"
            aria-label="메뉴 열기"
            onClick={() => setOpen(true)}
          >
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
