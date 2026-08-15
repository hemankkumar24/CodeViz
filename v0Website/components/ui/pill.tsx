import { cn } from '@/lib/utils'

export function Pill({
  className,
  active,
  as: As = 'span',
  ...props
}: React.HTMLAttributes<HTMLElement> & { active?: boolean; as?: React.ElementType }) {
  return (
    <As
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
        active
          ? 'border border-accent/40 bg-accent/15 text-accent'
          : 'border border-border bg-white/[0.03] text-muted-foreground hover:border-border-strong hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'accent' | 'insert' | 'update' | 'delete' | 'dep'
}) {
  const tones: Record<string, string> = {
    neutral: 'border-border bg-white/[0.03] text-muted-foreground',
    accent: 'border-accent/40 bg-accent/15 text-accent',
    insert: 'border-viz-insert/40 bg-viz-insert/15 text-viz-insert',
    update: 'border-viz-update/40 bg-viz-update/15 text-viz-update',
    delete: 'border-viz-delete/40 bg-viz-delete/15 text-viz-delete',
    dep: 'border-viz-dep/40 bg-viz-dep/15 text-viz-dep',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
