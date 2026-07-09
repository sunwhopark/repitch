"use client";
import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import type { Campaign } from "@/components/dashboard/seed-campaigns";
import { CreateCampaignModal } from "@/components/ui/create-campaign-modal";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";

// ⋯ dropdown (same overlay+absolute pattern as the sidebar WorkspaceSwitcher).
// Seed campaigns get a disabled marker with a tooltip — they stay fixed so the
// home stat + inbox deep links keep working. The menu only fires callbacks; the
// edit/delete modals are hosted once per page via useCampaignEditDelete.
export function CampaignMenu({ campaign, onEdit, onDelete }: {
  campaign: Campaign;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  if (!campaign.custom) {
    return (
      <span
        title="데모 캠페인은 수정할 수 없어요"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground/30"
        aria-hidden
      >
        <MoreHorizontal className="size-4" />
      </span>
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="캠페인 메뉴"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 top-9 z-50 w-32 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-xl">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <Pencil className="size-3.5" /> 수정
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Trash2 className="size-3.5" /> 삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ConfirmDeleteDialog({ campaign, onOpenChange, onConfirm }: {
  campaign: Campaign | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={!!campaign} onOpenChange={onOpenChange}>
      <ModalContent className="md:max-w-sm md:rounded-2xl md:border-0 md:shadow-xl">
        <ModalHeader className="gap-1 border-b-0 bg-transparent text-left">
          <ModalTitle className="text-lg font-semibold">캠페인 삭제</ModalTitle>
          <p className="text-sm text-muted-foreground">
            ‘{campaign?.product}’ 캠페인을 삭제할까요? 되돌릴 수 없어요.
          </p>
        </ModalHeader>
        <ModalBody className="flex flex-row gap-2.5 px-4 pb-5 pt-2 md:px-6">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-full border border-border text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-full bg-foreground text-sm font-semibold text-background hover:bg-foreground/90"
          >
            삭제
          </button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// Page-level single-instance host for the edit wizard + delete confirm. The
// list previously mounted one modal per card; this keeps a single instance and
// just tracks which campaign is being acted on. `modals` is rendered once by
// the page; startEdit/startDelete are wired to each row's CampaignMenu.
export function useCampaignEditDelete(onDeleted?: (c: Campaign) => void) {
  const { updateCampaign, removeCampaign } = useDashboard();
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [deleting, setDeleting] = useState<Campaign | null>(null);

  const modals = (
    <>
      <CreateCampaignModal
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        initial={editing ?? undefined}
        onSubmit={(c) => {
          updateCampaign(c);
          setEditing(null);
        }}
      />
      <ConfirmDeleteDialog
        campaign={deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null); }}
        onConfirm={() => {
          if (!deleting) return;
          const d = deleting;
          removeCampaign(d.id);
          setDeleting(null);
          onDeleted?.(d);
        }}
      />
    </>
  );

  return { startEdit: setEditing, startDelete: setDeleting, modals };
}
