import { useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { highlightLineToHtml } from "@/lib/highlight";
import type { SupportedLanguage } from "@/types/languages";

export type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language?: SupportedLanguage;
  activeLine?: number | undefined;
  errorLine?: number | undefined;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
};

export function CodeEditor({
  value,
  onChange,
  language = "cpp",
  activeLine,
  errorLine,
  readOnly,
  className,
  minHeight = 260,
}: CodeEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lines = useMemo(() => value.split("\n"), [value]);

  // Keep the active line visible while stepping.
  useLayoutEffect(() => {
    if (!activeLine || !scrollRef.current) return;
    const top = (activeLine - 1) * 22;
    const el = scrollRef.current;
    if (top < el.scrollTop || top > el.scrollTop + el.clientHeight - 44) {
      el.scrollTo({ top: Math.max(0, top - el.clientHeight / 2), behavior: "smooth" });
    }
  }, [activeLine]);

  return (
    <div
      ref={scrollRef}
      className={cn("relative overflow-auto font-mono text-[13px] leading-[22px]", className)}
      style={{ minHeight }}
    >
      <div className="relative flex min-h-full w-full">
        {/* gutter */}
        <div className="sticky left-0 z-10 select-none bg-surface-1/80 py-3 text-right backdrop-blur-sm">
          {lines.map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-11 pr-3 tabular-nums transition-colors",
                i + 1 === errorLine
                  ? "font-semibold text-[var(--viz-delete)]"
                  : i + 1 === activeLine
                    ? "font-semibold text-primary"
                    : "text-text-tertiary/70",
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 py-3 pl-3 pr-4">
          {/* highlight layer */}
          <div aria-hidden className="pointer-events-none absolute inset-0 py-3 pl-3 pr-4 overflow-hidden select-none">
            {lines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "-mx-3 whitespace-pre px-3 transition-colors h-[22px] leading-[22px]",
                  i + 1 === activeLine && "cv-active-line",
                  i + 1 === errorLine && "cv-error-line",
                )}
                dangerouslySetInnerHTML={{ __html: highlightLineToHtml(line, language) }}
              />
            ))}
          </div>

          <textarea
            ref={taRef}
            value={value}
            readOnly={readOnly}
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            onChange={(e) => onChange(e.target.value)}
            aria-label="Code editor"
            className="relative block w-full resize-none overflow-hidden whitespace-pre bg-transparent font-mono text-[13px] leading-[22px] text-transparent caret-primary outline-none selection:bg-primary/25 border-0 p-0 m-0"
            style={{ height: Math.max(lines.length, 14) * 22 }}
          />
        </div>
      </div>
    </div>
  );
}