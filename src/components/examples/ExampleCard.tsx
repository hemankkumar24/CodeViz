import { Link } from "@tanstack/react-router";
import { DifficultyDots, Pill } from "@/components/ui/cv";
import type { Example } from "@/data/examples";
import { cn } from "@/lib/utils";

function Preview({ kind }: { kind: Example["previewKind"] }) {
  if (kind === "grid") {
    return (
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 15 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-3.5 rounded-[3px]",
              i % 4 === 0 ? "bg-primary/35" : "bg-surface-2",
            )}
          />
        ))}
      </div>
    );
  }
  if (kind === "tree" || kind === "graph") {
    return (
      <svg viewBox="0 0 120 46" className="h-[46px] w-full text-primary/50">
        <g stroke="currentColor" strokeWidth="1">
          <line x1="60" y1="10" x2="34" y2="34" />
          <line x1="60" y1="10" x2="86" y2="34" />
        </g>
        {[[60, 10], [34, 34], [86, 34]].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5" fill="currentColor" opacity={0.6} />
        ))}
      </svg>
    );
  }
  if (kind === "variables") {
    return (
      <div className="flex flex-col gap-1.5">
        {["n", "sum", "best"].map((v) => (
          <span key={v} className="flex items-center gap-2 font-mono text-[11px] text-text-tertiary">
            {v}
            <span className="h-1.5 flex-1 rounded-full bg-surface-2" />
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-end gap-1">
      {[6, 14, 9, 20, 12, 17, 8].map((h, i) => (
        <span
          key={i}
          className={cn("w-4 rounded-[3px]", i === 3 ? "bg-primary/50" : "bg-surface-2")}
          style={{ height: h * 2 }}
        />
      ))}
    </div>
  );
}

export function ExampleCard({ example }: { example: Example }) {
  return (
    <Link
      to="/visualize"
      search={{ example: example.slug }}
      className="group flex flex-col gap-4 rounded-[16px] border border-hairline bg-surface-1/60 p-5 transition-colors hover:border-hairline-strong hover:bg-surface-1"
    >
      <div className="h-[46px]">
        <Preview kind={example.previewKind} />
      </div>

      <div>
        <h3 className="text-[15px] font-medium text-foreground">{example.title}</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{example.description}</p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        <DifficultyDots level={example.difficulty} />
        <Pill>{example.visualizationLabel}</Pill>
        {!example.traced ? <Pill tone="glass">preview</Pill> : null}
      </div>
    </Link>
  );
}