import { useLayoutEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const KEYWORDS = new Set([
  "function", "const", "let", "var", "return", "for", "while", "if", "else",
  "of", "in", "new", "class", "break", "continue", "null", "undefined",
  "true", "false",
]);

/**
 * Minimal, SSR-safe syntax highlighting layered under a transparent textarea.
 * Single tokenizing pass — sequential replaces would rewrite emitted markup.
 */
const TOKEN =
  /(\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)/g;

function highlight(line: string) {
  let out = "";
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const [text, comment, str, num, word] = m;
    out += escapeHtml(line.slice(last, m.index));
    last = m.index + text.length;
    const escaped = escapeHtml(text);
    if (comment) out += `<span class="tok-comment">${escaped}</span>`;
    else if (str) out += `<span class="tok-string">${escaped}</span>`;
    else if (num) out += `<span class="tok-number">${escaped}</span>`;
    else if (word && KEYWORDS.has(word)) out += `<span class="tok-keyword">${escaped}</span>`;
    else if (word && line[last] === "(") out += `<span class="tok-fn">${escaped}</span>`;
    else out += escaped;
  }
  out += escapeHtml(line.slice(last));
  return out || "&nbsp;";
}

export type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  activeLine?: number | undefined;
  errorLine?: number | undefined;
  readOnly?: boolean;
  className?: string;
  minHeight?: number;
};

export function CodeEditor({
  value,
  onChange,
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
                "w-11 pr-3 tabular-nums",
                i + 1 === errorLine
                  ? "text-[var(--viz-delete)]"
                  : i + 1 === activeLine
                    ? "text-primary"
                    : "text-text-tertiary/70",
              )}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 py-3 pl-3 pr-4">
          {/* highlight layer */}
          <div aria-hidden className="pointer-events-none absolute inset-0 py-3 pl-3 pr-4">
            {lines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "-mx-3 whitespace-pre px-3",
                  i + 1 === activeLine && "cv-active-line",
                  i + 1 === errorLine && "cv-error-line",
                )}
                dangerouslySetInnerHTML={{ __html: highlight(line) }}
              />
            ))}
          </div>

          <textarea
            ref={taRef}
            value={value}
            readOnly={readOnly}
            spellCheck={false}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Code editor"
            className="relative block w-full resize-none bg-transparent font-mono text-[13px] leading-[22px] text-transparent caret-primary outline-none"
            style={{ height: Math.max(lines.length, 12) * 22 }}
          />
        </div>
      </div>
    </div>
  );
}