import { ArrowLeft } from "lucide-react";

// 법적 문서용 공통 레이아웃 — 랜딩 헤더/푸터 없이 심플하게, 모노톤 문서 가독.
// 자식은 시맨틱 마크업(h1/h2/p/ul/table)만 쓰고, 타이포는 이 래퍼가 입힌다.
export function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100svh] bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 md:py-16">
        <a href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" /> repitch.kr
        </a>

        <article
          className={[
            "mt-8",
            "[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:tracking-tight",
            "[&_h2]:mt-10 [&_h2]:mb-1 [&_h2]:text-base [&_h2]:font-semibold",
            "[&_p]:mt-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-foreground/80",
            "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
            "[&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
            "[&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-foreground/80",
            "[&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[13px]",
            "[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
            "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:text-foreground/80",
            "[&_strong]:font-semibold [&_strong]:text-foreground",
            "[&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2",
          ].join(" ")}
        >
          {children}
        </article>
      </div>
    </div>
  );
}

// 가로 스크롤 가능한 표 래퍼 (모바일에서 넘칠 때).
export function LegalTable({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}
