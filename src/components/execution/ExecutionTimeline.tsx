import { cn } from "@/lib/utils";
import { useWorkspace } from "@/state/executionStore";

/** Scrubbable step timeline; change-steps are marked so users can find mutations. */
export function ExecutionTimeline() {
  const { events, currentStep, mutationSteps, dispatch } = useWorkspace();
  const total = events.length;
  if (!total) return null;

  const pct = total > 1 ? (currentStep / (total - 1)) * 100 : 100;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-text-tertiary">
        <span>step {currentStep + 1}</span>
        <span>line {events[currentStep]?.line ?? "—"}</span>
      </div>

      <div className="relative h-6">
        <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-surface-2" />
        <div
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary/80"
          style={{ width: `${pct}%` }}
        />
        {mutationSteps.map((s) => (
          <span
            key={s}
            className="absolute top-1/2 h-2 w-[2px] -translate-y-1/2 rounded-full bg-[var(--viz-update)]/70"
            style={{ left: `${total > 1 ? (s / (total - 1)) * 100 : 0}%` }}
          />
        ))}
        <input
          type="range"
          min={0}
          max={total - 1}
          value={currentStep}
          onChange={(e) => dispatch({ type: "goto", step: Number(e.target.value) })}
          aria-label="Execution timeline"
          className={cn(
            "absolute inset-0 w-full cursor-pointer appearance-none bg-transparent",
            "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background",
            "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background",
          )}
        />
      </div>
    </div>
  );
}