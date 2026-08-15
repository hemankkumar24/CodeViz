import { cn } from '@/lib/utils'

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-white/[0.04] font-mono text-[13px] font-semibold tracking-tight text-accent">
        {'<'}
        <span className="h-3.5 w-px bg-accent animate-cursor-blink" aria-hidden />
        {'>'}
      </span>
      {showWordmark ? (
        <span className="font-mono text-[15px] font-semibold tracking-tight text-foreground">
          CodeVisualizer
        </span>
      ) : null}
    </span>
  )
}
