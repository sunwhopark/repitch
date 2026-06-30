'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

type WWavePathProps = React.ComponentProps<'div'>;

export function WavePath({ className, ...props }: WWavePathProps) {
	const path = useRef<SVGPathElement>(null);
	let progress = 0;
	let x = 0.2;
	let time = Math.PI / 2;
	let reqId: number | null = null;

	useEffect(() => {
		setPath(progress);
	}, []);

	const setPath = (progress: number) => {
		const width = window.innerWidth * 0.7;
		if (path.current) {
			path.current.setAttributeNS(
				null,
				'd',
				`M0 100 Q${width * x} ${100 + progress * 0.6}, ${width} 100`,
			);
		}
	};

	const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

	const manageMouseEnter = () => {
		if (reqId) {
			cancelAnimationFrame(reqId);
			resetAnimation();
		}
	};

	const manageMouseMove = (e: React.MouseEvent) => {
		const { movementY, clientX } = e;
		if (path.current) {
			const pathBound = path.current.getBoundingClientRect();
			x = (clientX - pathBound.left) / pathBound.width;
			progress += movementY;
			setPath(progress);
		}
	};

	const manageMouseLeave = () => {
		animateOut();
	};

	const animateOut = () => {
		const newProgress = progress * Math.sin(time);
		progress = lerp(progress, 0, 0.025);
		time += 0.2;
		setPath(newProgress);
		if (Math.abs(progress) > 0.75) {
			reqId = requestAnimationFrame(animateOut);
		} else {
			resetAnimation();
		}
	};

	const resetAnimation = () => {
		time = Math.PI / 2;
		progress = 0;
	};

	return (
		<div className={cn('relative h-px w-[70vw]', className)} {...props}>
			<div
				onMouseEnter={manageMouseEnter}
				onMouseMove={manageMouseMove}
				onMouseLeave={manageMouseLeave}
				className="relative -top-5 z-10 h-10 w-full hover:-top-[150px] hover:h-[300px]"
			/>
			<svg className="absolute -top-[100px] h-[300px] w-full">
				<path ref={path} className="fill-none stroke-current" strokeWidth={2} />
			</svg>
		</div>
	);
}

export function WaveSection() {
	return (
		<section className="relative w-full flex flex-col items-center justify-center py-24">
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -top-10 left-1/2 size-full -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-foreground)_10%,transparent),transparent_50%)] blur-[30px]"
			/>

			<div className="flex w-[70vw] flex-col items-center">
				<WavePath className="mb-16" />
				<p className="text-foreground/80 text-2xl md:text-4xl text-center">
					처음 보는 제품을 광고하는 일,
					<br />
					이제 힘들지 않으신가요?
				</p>
			</div>
		</section>
	);
}
