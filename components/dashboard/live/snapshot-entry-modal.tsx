"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// 지표 직접 입력 — 오늘 날짜 스냅샷(source='manual') upsert. 매출/주문은 비공개라 이 경로가 실경로.
export function SnapshotEntryModal({
  open, onOpenChange, productId, defaultPrice,
}: {
  open: boolean; onOpenChange: (o: boolean) => void; productId: string; defaultPrice: number | null;
}) {
  const router = useRouter();
  const [reviewCount, setReviewCount] = useState("");
  const [rating, setRating] = useState("");
  const [price, setPrice] = useState("");
  const [revenue, setRevenue] = useState("");
  const [orderCount, setOrderCount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReviewCount(""); setRating(""); setPrice(defaultPrice != null ? String(defaultPrice) : "");
      setRevenue(""); setOrderCount(""); setError("");
    }
  }, [open, defaultPrice]);

  const numOrNull = (s: string) => (s.trim() ? Number(s) : null);
  const canSave = [reviewCount, rating, price, revenue, orderCount].some((s) => s.trim() !== "");

  async function save() {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const captured_at = new Date().toISOString().slice(0, 10);
    const { error: e } = await supabase.from("product_snapshots").upsert(
      {
        product_id: productId,
        captured_at,
        source: "manual",
        review_count: numOrNull(reviewCount),
        rating: numOrNull(rating),
        price: numOrNull(price),
        revenue: numOrNull(revenue),
        order_count: numOrNull(orderCount),
      },
      { onConflict: "product_id,captured_at" },
    );
    setSaving(false);
    if (e) { setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요."); return; }
    onOpenChange(false);
    router.refresh();
  }

  const int = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value.replace(/[^0-9]/g, ""));

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-md md:rounded-2xl">
        <ModalHeader className="text-left">
          <ModalTitle className="text-lg font-semibold">지표 직접 입력</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4 px-4 pb-6 md:px-6">
          <p className="text-[12px] text-muted-foreground">오늘 날짜로 저장돼요. 매출·주문 수는 비공개 데이터라 판매자만 입력할 수 있어요. (판매자 연동 시 자동화 예정)</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-[13px]">매출액(원)</Label>
              <Input inputMode="numeric" value={revenue} onChange={int(setRevenue)} placeholder="예: 3200000" className="rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[13px]">주문 수</Label>
              <Input inputMode="numeric" value={orderCount} onChange={int(setOrderCount)} placeholder="예: 128" className="rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[13px]">리뷰 수</Label>
              <Input inputMode="numeric" value={reviewCount} onChange={int(setReviewCount)} placeholder="예: 842" className="rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[13px]">평점(0~5)</Label>
              <Input inputMode="decimal" value={rating} onChange={(e) => setRating(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="예: 4.6" className="rounded-xl" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[13px]">판매가(원)</Label>
              <Input inputMode="numeric" value={price} onChange={int(setPrice)} placeholder="예: 22000" className="rounded-xl" />
            </div>
          </div>
          {error && <p className="text-[13px] text-destructive">{error}</p>}
          <Button type="button" disabled={!canSave || saving} onClick={save} className="h-11 w-full rounded-full font-bold">
            {saving ? "저장 중…" : "오늘 지표 저장"}
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
