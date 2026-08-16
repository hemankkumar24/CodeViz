import { useWorkspace } from "@/state/executionStore";
import { ArrowRight } from "lucide-react";

export function StepExplanation() {
  const { viz, events } = useWorkspace();
  if (!events.length || !viz) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-tertiary">
        This step
      </p>
      <p className="text-[13.5px] leading-relaxed text-text-secondary">
        {viz.explanation ?? `Executing line ${viz.line}.`}
      </p>
      {viz.changes.length ? (
        <ul className="mt-1 space-y-1.5">
          {viz.changes.map((c, i) => (
            <li
              key={i}
              className="flex items-center gap-2 font-mono text-[12.5px] text-text-secondary"
            >
              <span className="text-foreground">
                {c.structure}[{c.path.join("][")}]
              </span>
              <span className="text-text-tertiary line-through">{String(c.previousValue ?? "–")}</span>
              <ArrowRight size={11} className="text-[var(--viz-update)]" />
              <span className="text-[var(--viz-update)]">{String(c.nextValue)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}