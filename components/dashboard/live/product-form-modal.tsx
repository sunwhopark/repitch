"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/browser";
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BRAND_CATEGORIES } from "@/lib/brand-application-options";
import { SALES_CHANNELS, type Product } from "@/components/dashboard/live/types";

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

// 제품 등록/수정. 이미지는 Storage(product-images/{brand_id}/…) 업로드 후 public URL 저장.
export function ProductFormModal({
  open,
  onOpenChange,
  brandId,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  brandId: string;
  initial?: Product | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [salesChannel, setSalesChannel] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [visible, setVisible] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null); // 기존/미리보기 URL
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setCategory(initial?.category ?? "");
      setDescription(initial?.description ?? "");
      setPrice(initial?.price != null ? String(initial.price) : "");
      setSalesChannel(initial?.sales_channel ?? "");
      setProductUrl(initial?.product_url ?? "");
      setVisible(initial?.visible ?? false);
      setImageUrl(initial?.image_url ?? null);
      setFile(null);
      setError("");
    }
  }, [open, initial]);

  const canSave = name.trim() !== "" && category !== "";

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setImageUrl(URL.createObjectURL(f)); // 미리보기
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    const supabase = createClient();

    let finalImageUrl = initial?.image_url ?? null;
    if (file) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${brandId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
      if (upErr) {
        setError("이미지 업로드에 실패했어요. (버킷 product-images 확인)");
        setSaving(false);
        return;
      }
      finalImageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }

    const row = {
      brand_id: brandId,
      name: name.trim(),
      category,
      description: description.trim() || null,
      price: price ? Number(price) : null,
      sales_channel: salesChannel || null,
      product_url: productUrl.trim() || null,
      image_url: finalImageUrl,
      visible,
    };

    const { error: dbErr } = initial
      ? await supabase.from("products").update(row).eq("id", initial.id)
      : await supabase.from("products").insert(row);

    if (dbErr) {
      setError("저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setSaving(false);
      return;
    }
    onOpenChange(false);
    router.refresh();
    setSaving(false);
  }

  const inputCls = "rounded-xl";

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-lg md:rounded-2xl">
        <ModalHeader className="text-left">
          <ModalTitle className="text-lg font-semibold">{initial ? "제품 수정" : "제품 등록"}</ModalTitle>
        </ModalHeader>
        <ModalBody className="max-h-[64vh] space-y-5 overflow-y-auto px-4 pb-6 md:px-6">
          {/* 이미지 */}
          <div className="grid gap-2">
            <Label className="text-[13px]">제품 이미지</Label>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
            {imageUrl ? (
              <div className="relative w-full overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageUrl(null); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                  className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1 text-background"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-40 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground"
              >
                <ImagePlus className="size-6" />
                <span className="text-xs">이미지 업로드</span>
              </button>
            )}
          </div>

          <div className="grid gap-2">
            <Label className="text-[13px]">이름 *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 데일리 토너 200ml" className={inputCls} />
          </div>

          <div className="grid gap-2">
            <Label className="text-[13px]">카테고리 *</Label>
            <div className="flex flex-wrap gap-2">
              {BRAND_CATEGORIES.map((c) => <Chip key={c} label={c} active={category === c} onClick={() => setCategory(c)} />)}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-[13px]">설명</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="제품 소개"
              className="rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-foreground/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-[13px]">가격(원)</Label>
              <Input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} placeholder="예: 19000" className={inputCls} />
            </div>
            <div className="grid gap-2">
              <Label className="text-[13px]">판매 채널</Label>
              <select
                value={salesChannel}
                onChange={(e) => setSalesChannel(e.target.value)}
                className="h-10 rounded-xl border border-border bg-transparent px-3 text-sm outline-none focus:border-foreground/40"
              >
                <option value="">선택 안 함</option>
                {SALES_CHANNELS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-[13px]">상세 URL</Label>
            <Input value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="https://…" className={inputCls} />
          </div>

          {/* visible 토글 */}
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex items-center justify-between rounded-xl border border-border px-3.5 py-3 text-left"
          >
            <div>
              <div className="text-sm font-medium">인플루언서에게 공개</div>
              <div className="text-xs text-muted-foreground">공개하면 카탈로그에서 인플루언서가 볼 수 있어요.</div>
            </div>
            <span className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", visible ? "bg-foreground" : "bg-muted")}>
              <span className={cn("absolute top-0.5 size-5 rounded-full bg-background transition-all", visible ? "left-[18px]" : "left-0.5")} />
            </span>
          </button>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <Button type="button" disabled={!canSave || saving} onClick={save} className="h-11 w-full rounded-full font-bold">
            {saving ? "저장 중…" : initial ? "수정 완료" : "제품 등록"}
          </Button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
