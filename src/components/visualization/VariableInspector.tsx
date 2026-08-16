import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export type VariableInspectorProps = {
  variables: Record<string, unknown>;
  previous?: Record<string, unknown> | undefined;
  layout?: "list" | "strip";
  className?: string;
};

const fmt = (v: unknown) => (v === undefined || v === null ? "–" : String(v));

/** Used both as the canvas view ("Variables") and the persistent bottom strip. */
export function VariableInspector({
  variables,
  previous,
  layout = "list",
  className,
}: VariableInspectorProps) {
  const entries = Object.entries(variables);

  if (!entries.length) {
    return (
      <p className={cn("font-mono text-[12.5px] text-text-tertiary", className)}>
        No variables tracked yet.
      </p>
    );
  }

  if (layout === "strip") {
    return (
      <div className={cn("flex items-center gap-2 overflow-x-auto pb-1", className)}>
        {entries.map(([name, value]) => {
          const changed = previous && fmt(previous[name]) !== fmt(value) && name in previous;
          return (
            <span
              key={name}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-[8px] border px-2.5 py-1.5 font-mono text-[12.5px] transition-colors duration-150",
                changed
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-hairline bg-surface-1 text-text-secondary",
              )}
            >
              <span className="text-text-tertiary">{name}</span>
              {changed ? (
                <>
                  <span className="text-text-tertiary line-through">{fmt(previous?.[name])}</span>
                  <ArrowRight size={11} strokeWidth={2} className="text-primary" />
                </>
              ) : null}
              <span className={changed ? "text-primary" : "text-foreground"}>{fmt(value)}</span>
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-md", className)}>
      <p className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-tertiary">
        Variables
      </p>
      <ul className="divide-y divide-[var(--hairline)] overflow-hidden rounded-[12px] border border-hairline bg-surface-1">
        {entries.map(([name, value]) => {
          const changed = previous && name in previous && fmt(previous[name]) !== fmt(value);
          return (
            <li key={name} className="flex items-center justify-between gap-6 px-3.5 py-2.5">
              <span className="font-mono text-[13px] text-text-secondary">{name}</span>
              <span className="flex items-center gap-2 font-mono text-[13px] tabular-nums">
                {changed ? (
                  <>
                    <span className="text-text-tertiary line-through">{fmt(previous?.[name])}</span>
                    <ArrowRight size={12} strokeWidth={2} className="text-primary" />
                    <span className="animate-value-in text-primary">{fmt(value)}</span>
                  </>
                ) : (
                  <span className="text-foreground">{fmt(value)}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}