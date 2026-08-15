import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { tokenClass, tokenizeLine } from '@/lib/highlight'

export function CodeView({
  code,
  currentLine,
  errorLine,
  className,
  fontSize = 'text-[13px]',
  autoScroll = true,
  showGutter = true,
}: {
  code: string
  currentLine?: number
  errorLine?: number
  className?: string
  fontSize?: string
  autoScroll?: boolean
  showGutter?: boolean
}) {
  const lines = code.replace(/\n$/, '').split('\n')
  const activeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentLine, autoScroll])

  return (
    <div
      className={cn(
        'cv-scrollbar overflow-auto font-mono leading-[1.6]',
        fontSize,
        className,
      )}
    >
      <pre className="min-w-full">
        <code>
          {lines.map((line, i) => {
            const lineNo = i + 1
            const isCurrent = lineNo === currentLine
            const isError = lineNo === errorLine
            return (
              <div
                key={i}
                ref={isCurrent ? activeRef : undefined}
                className={cn(
                  'group relative flex items-stretch whitespace-pre transition-colors',
                  isCurrent && 'bg-accent/[0.10]',
                  isError && 'bg-viz-delete/[0.12]',
                )}
              >
                {/* left gutter bar */}
                <span
                  aria-hidden
                  className={cn(
                    'w-[3px] shrink-0',
                    isError ? 'bg-viz-delete' : isCurrent ? 'bg-accent' : 'bg-transparent',
                  )}
                />
                {showGutter ? (
                  <span
                    className={cn(
                      'w-10 shrink-0 select-none pr-3 text-right tabular-nums',
                      isCurrent ? 'text-accent' : isError ? 'text-viz-delete' : 'text-tertiary',
                    )}
                    aria-hidden
                  >
                    {isCurrent ? '▶' : isError ? '✕' : lineNo}
                  </span>
                ) : null}
                <span className="flex-1 pr-4 pl-2">
                  {line.length === 0 ? (
                    <span> </span>
                  ) : (
                    tokenizeLine(line).map((t, ti) => (
                      <span key={ti} className={tokenClass[t.kind]}>
                        {t.value}
                      </span>
                    ))
                  )}
                </span>
              </div>
            )
          })}
        </code>
      </pre>
    </div>
  )
}
