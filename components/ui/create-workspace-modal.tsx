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
import { Button } from './button';
import { Input } from './input';
import { Grid2x2Plus } from 'lucide-react';
import { Label } from './label';

// Controlled: opened from the sidebar WorkspaceSwitcher; onCreate adds the
// workspace (demo, in-memory) and selects it.
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
	const [slug, setSlug] = React.useState('');

	React.useEffect(() => {
		if (open) {
			setName('');
			setSlug('');
		}
	}, [open]);

	const canCreate = name.trim().length > 0;

	return (
		<Modal open={open} onOpenChange={onOpenChange}>
			<ModalContent className="md:max-w-md">
				<ModalHeader className="items-center py-10">
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
				<ModalBody className="space-y-4 p-4 md:p-4">
					<div className="grid gap-2">
						<Label>워크스페이스 이름</Label>
						<Input
							placeholder="예: 데모 브랜드"
							value={name}
							onChange={(e) => setName(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="grid gap-2">
						<Label>워크스페이스 주소</Label>

						<div className="flex rounded-md shadow-xs">
							<span className="border-input bg-input/30 text-muted-foreground inline-flex items-center rounded-s-md border px-3 text-sm">
								repitch.kr/
							</span>
							<Input
								placeholder="예: demo-brand"
								className="-ms-px rounded-s-none shadow-none"
								value={slug}
								onChange={(e) => setSlug(e.target.value)}
							/>
						</div>
					</div>

					<Button
						size="lg"
						className="w-full"
						disabled={!canCreate}
						onClick={() => onCreate(name.trim())}
					>
						만들기
					</Button>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
