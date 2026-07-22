"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Package, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { won, type VisibleProduct } from "@/components/influencer/types";

export function ProductDetail({ product: p, loggedIn, isInfluencer }: { product: VisibleProduct; loggedIn: boolean; isInfluencer: boolean }) {
  const router = useRouter();
  return (
    <div className="pb-4">
      <button type="button" onClick={() => router.push("/campaigns")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> 둘러보기
      </button>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-[16/10] w-full bg-muted">
          {p.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.image_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package className="size-10" /></div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2">
            {p.category && <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">{p.category}</span>}
            <span className="text-xs text-muted-foreground">{p.brand_name}</span>
          </div>
          <h1 className="mt-1.5 text-xl font-bold tracking-tight">{p.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-medium text-foreground tabular-nums">{won(p.price)}</span>
            {p.sales_channel && <span>{p.sales_channel}</span>}
            {p.product_url && (
              <a href={p.product_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground underline underline-offset-2">
                제품 페이지 <ExternalLink className="size-3" />
              </a>
            )}
          </div>
          {p.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{p.description}</p>}
        </div>
      </div>

      <div className="sticky bottom-20 mt-4 md:bottom-4">
        {!loggedIn ? (
          <Button type="button" onClick={() => router.push("/login")} className="h-12 w-full rounded-full font-bold">로그인하고 역제안 보내기</Button>
        ) : !isInfluencer ? (
          <div className="rounded-full border border-border px-4 py-3 text-center text-sm text-muted-foreground">인플루언서 계정으로 제안할 수 있어요</div>
        ) : (
          <Button type="button" onClick={() => router.push(`/proposals/new?product=${p.id}`)} className="h-12 w-full rounded-full font-bold">역제안 보내기</Button>
        )}
      </div>
    </div>
  );
}
