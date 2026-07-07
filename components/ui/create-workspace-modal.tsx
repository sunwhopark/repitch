'use client';
import React from 'react';
import {
	Modal,
	ModalBody,
	ModalContent,
	ModalHeader,
	ModalTitle,
} from '@/components/ui/modal';
import Link from 'next/link';
import { Input } from './input';
import { Grid2x2Plus } from 'lucide-react';
import { Label } from './label';

// Controlled: opened from the sidebar WorkspaceSwitcher; onCreate adds the
// workspace (demo, in-memory) and selects it.
// Surface styling matches our other modals — per-modal className overrides
// (border removed → shadow only, plain white card, dark pill CTA).
export function CreateWorkspaceModal({
	open,
	onOpenChange,
	onCreate,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onCreate: (name: string) => void;
}) {
	const [name, setName] = React.useState('');

	React.useEffect(() => {
		if (open) setName('');
	}, [open]);

	const canCreate = name.trim().length > 0;

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalContent className="md:max-w-md md:rounded-2xl md:border-0 md:shadow-xl">
				{/* Override the shadcn header band → plain white card */}
				<ModalHeader className="items-center gap-3 border-b-0 bg-transparent py-9">
					<Grid2x2Plus className="size-9" />
					<div className="flex flex-col items-center space-y-1">
						<ModalTitle className="text-2xl font-medium">
							워크스페이스 만들기
						</ModalTitle>
						<Link
							href="#"
							className="text-muted-foreground underline transition-colors"
						>
							워크스페이스란?
						</Link>
					</div>
				</ModalHeader>
				<ModalBody className="space-y-5 p-4 pb-6 md:p-4 md:pb-6">
					<div className="grid gap-2">
						<Label>워크스페이스 이름</Label>
						<Input
							placeholder="예: 데모 브랜드"
							className="rounded-xl focus-visible:border-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0"
							autoComplete="off"
							value={name}
							onChange={(e) => setName(e.target.value)}
							autoFocus
						/>
					</div>

					<button
						type="button"
						disabled={!canCreate}
						onClick={() => onCreate(name.trim())}
						className="h-11 w-full rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:bg-muted"
					>
						만들기
					</button>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
