"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { EmptyState } from "@/components/dashboard/live/empty-state";
import { ProductFormModal } from "@/components/dashboard/live/product-form-modal";
import { won, type Product } from "@/components/dashboard/live/types";

function VisibleBadge({ visible }: { visible: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
      visible ? "bg-foreground text-background" : "border border-border text-muted-foreground",
    )}>
      {visible ? "공개" : "비공개"}
    </span>
  );
}

export function ProductsClient({ products, brandId }: { products: Product[]; brandId: string }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  async function remove(p: Product) {
    if (!window.confirm(`"${p.name}" 제품을 삭제할까요?`)) return;
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", p.id);
    setMenuId(null);
    router.refresh();
  }

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">제품</h1>
            <p className="mt-1 text-sm text-muted-foreground">체험단·캠페인에 쓸 제품을 관리해요.</p>
          </div>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 text-sm font-bold text-background hover:bg-foreground/90"
          >
            <Plus className="size-4" /> 제품 등록
          </button>
        </div>

        <div className="mt-6">
          {products.length === 0 ? (
            <EmptyState
              icon={Package}
              title="첫 제품을 등록해보세요"
              description="제품을 등록하면 캠페인에 연결하고, 공개 시 인플루언서 카탈로그에 노출돼요."
              action={
                <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex h-10 items-center justify-center rounded-full bg-foreground px-5 text-sm font-bold text-background hover:bg-foreground/90">
                  제품 등록
                </button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <div key={p.id} className="group relative overflow-hidden rounded-xl border border-border bg-card">
                  <button type="button" onClick={() => router.push(`/dashboard/products/${p.id}`)} className="block w-full text-left">
                    <div className="aspect-[4/3] w-full bg-muted">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground/40"><Package className="size-8" /></div>
                      )}
                    </div>
                    <div className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold">{p.name}</span>
                        <VisibleBadge visible={p.visible} />
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {p.category && <span>{p.category}</span>}
                        <span className="tabular-nums">{won(p.price)}</span>
                      </div>
                    </div>
                  </button>

                  {/* ⋯ 메뉴 */}
                  <div className="absolute right-2 top-2">
                    <button
                      type="button"
                      onClick={() => setMenuId(menuId === p.id ? null : p.id)}
                      className="rounded-full bg-background/80 p-1.5 text-foreground shadow-sm backdrop-blur hover:bg-background"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                    {menuId === p.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuId(null)} />
                        <div className="absolute right-0 z-50 mt-1 w-28 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg">
                          <button type="button" onClick={() => { setEditing(p); setMenuId(null); }} className="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent">수정</button>
                          <button type="button" onClick={() => remove(p)} className="block w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-accent">삭제</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductFormModal open={createOpen} onOpenChange={setCreateOpen} brandId={brandId} />
      <ProductFormModal open={!!editing} onOpenChange={(o) => !o && setEditing(null)} brandId={brandId} initial={editing} />
    </div>
  );
}
