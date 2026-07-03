'use client';
import { cn } from '@/lib/utils';
import { useScroll } from '@/components/ui/use-scroll';

export type Audience = 'influencer' | 'brand';

type HeaderProps = {
  audience: Audience;
  onAudienceChange: (audience: Audience) => void;
};

export function Header({ audience, onAudienceChange }: HeaderProps) {
  const scrolled = useScroll(10);

  return (
    <header
      className={cn('sticky top-0 z-50 w-full border-b border-transparent', {
        'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg':
          scrolled,
      })}
    >
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <a href="/" className="inline-flex items-center">
          <img src="/repitch_wordmark.png" alt="repitch" className="h-7 w-auto dark:invert" />
        </a>
        <AudienceToggle audience={audience} onAudienceChange={onAudienceChange} />
      </nav>
    </header>
  );
}

const options: { label: string; value: Audience }[] = [
  { label: 'influencer', value: 'influencer' },
  { label: 'brand', value: 'brand' },
];

function AudienceToggle({ audience, onAudienceChange }: HeaderProps) {
  return (
    <div
      role="tablist"
      aria-label="Audience"
      className="inline-flex items-center gap-1 rounded-full bg-muted p-1"
    >
      {options.map((option) => {
        const selected = audience === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onAudienceChange(option.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors sm:px-4',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ring) focus-visible:ring-offset-1',
              selected
                ? 'bg-foreground text-background'
                : 'bg-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
