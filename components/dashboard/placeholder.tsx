// Compact placeholder for a workspace page (content lands in later steps).
export function DashboardPlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
        {title}
      </h1>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      )}

      <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border text-center">
        <p className="text-sm font-medium">준비 중</p>
        <p className="text-xs text-muted-foreground">
          이 화면은 다음 단계에서 채워집니다.
        </p>
      </div>
    </div>
  );
}
