import { cn } from '@/lib/utils'

export function GlassCard({
  className,
  strong,
  subtle,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { strong?: boolean; subtle?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl',
        strong ? 'glass-strong' : subtle ? 'glass-subtle' : 'glass',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
