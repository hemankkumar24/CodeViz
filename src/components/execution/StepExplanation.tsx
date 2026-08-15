import { useWorkspace } from "@/state/executionStore";
import { ArrowRight, History } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepExplanation() {
  const { currentStep, events, dispatch } = useWorkspace();

  if (!events.length) return null;

  // Sliced from 0 to currentStep, reversed so current step is always at index 0 (the top)
  const history = events
    .slice(0, currentStep + 1)
    .map((event, index) => ({ event, originalIndex: index }))
    .reverse();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-tertiary">
          <History size={11} className="text-primary" />
          <span>This Step & History</span>
        </div>
        <span className="font-mono text-[10.5px] text-text-tertiary">
          step {currentStep + 1} of {events.length}
        </span>
      </div>

      <div className="flex max-h-[440px] flex-col gap-2 overflow-y-auto pr-1 cv-scrollbar">
        {history.map(({ event, originalIndex }, idx) => {
          const isCurrent = idx === 0;

          return (
            <div
              key={originalIndex}
              onClick={() => !isCurrent && dispatch({ type: "goto", step: originalIndex })}
              className={cn(
                "group relative flex flex-col gap-1.5 rounded-[10px] p-2.5 transition-all",
                isCurrent
                  ? "border border-primary/50 bg-primary/10 shadow-sm ring-1 ring-primary/20"
                  : "cursor-pointer border border-hairline/60 bg-surface-1/40 opacity-70 hover:border-hairline hover:bg-surface-1/80 hover:opacity-100",
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "font-mono text-[10.5px] font-semibold",
                      isCurrent ? "text-primary" : "text-text-tertiary",
                    )}
                  >
                    Step {event.step}
                  </span>
                  <span className="rounded bg-surface-2 px-1 py-0.2 font-mono text-[9.5px] text-text-tertiary border border-hairline/40">
                    Line {event.line}
                  </span>
                </div>
                {isCurrent && (
                  <span className="flex items-center gap-1 font-mono text-[9.5px] font-semibold text-primary">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    current
                  </span>
                )}
              </div>

              <p
                className={cn(
                  "text-[12.5px] leading-snug",
                  isCurrent ? "font-medium text-foreground" : "text-text-secondary",
                )}
              >
                {event.explanation ?? `Executing line ${event.line}.`}
              </p>

              {event.changes.length ? (
                <ul className="mt-0.5 space-y-1">
                  {event.changes.map((c, ci) => (
                    <li
                      key={ci}
                      className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary"
                    >
                      <span className="text-foreground">
                        {c.structure}[{c.path.join("][")}]
                      </span>
                      <span className="text-text-tertiary line-through">{String(c.previousValue ?? "–")}</span>
                      <ArrowRight size={10} className="text-[var(--viz-update)]" />
                      <span className="font-semibold text-[var(--viz-update)]">{String(c.nextValue)}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}