import { cn } from "@/lib/utils";
import { ArrowDown, Pencil, Plus, Minus } from "lucide-react";
import type { ChangeType } from "@/types/execution";

export type CellTone = "default" | "current" | "compared" | "changed" | "dependency" | "muted";

const changeIcon: Record<ChangeType, typeof Pencil> = {
  update: Pencil,
  insert: Plus,
  delete: Minus,
};

export function Cell({
  value,
  tone = "default",
  changeType,
  size = "md",
  label,
}: {
  value: number | string | null | undefined;
  tone?: CellTone;
  changeType?: ChangeType | undefined;
  size?: "sm" | "md" | "lg";
  label?: string;
}) {
  const display = value === null || value === undefined ? "–" : String(value);
  const Icon = changeType ? changeIcon[changeType] : null;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-[8px] border font-mono tabular-nums transition-[background-color,border-color,color] duration-150",
        size === "sm" && "h-8 min-w-8 px-1.5 text-[12px]",
        size === "md" && "h-11 min-w-11 px-2 text-[14px]",
        size === "lg" && "h-14 min-w-14 px-2.5 text-[16px]",
        tone === "default" && "border-hairline bg-surface-1 text-foreground",
        tone === "muted" && "border-hairline/60 bg-surface-1/40 text-text-tertiary",
        tone === "current" && "border-primary bg-primary/12 text-foreground",
        tone === "compared" && "border-dashed border-primary/70 bg-primary/6 text-foreground",
        tone === "changed" &&
          "animate-change-pulse border-[var(--viz-update)] bg-[color-mix(in_oklab,var(--viz-update)_14%,transparent)] text-foreground",
        tone === "dependency" &&
          "border-[var(--viz-dep)] bg-[color-mix(in_oklab,var(--viz-dep)_12%,transparent)] text-foreground",
      )}
      aria-label={label}
      data-tone={tone}
    >
      <span key={display} className="animate-value-in">
        {display}
      </span>
      {Icon ? (
        <span
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-hairline bg-surface-2 text-[var(--viz-update)]"
          title={`${changeType} on this step`}
        >
          <Icon size={9} strokeWidth={2} />
        </span>
      ) : null}
    </div>
  );
}

export function PointerLabel({
  name,
  active,
  direction = "down",
}: {
  name: string;
  active?: boolean;
  direction?: "down" | "up";
}) {
  return (
    <span
      className={cn(
        "flex flex-col items-center gap-0.5 font-mono text-[11px] leading-none",
        active ? "text-primary" : "text-text-tertiary",
        direction === "up" && "flex-col-reverse",
      )}
    >
      <span>{name}</span>
      <ArrowDown
        size={11}
        strokeWidth={2}
        className={direction === "up" ? "rotate-180" : undefined}
      />
    </span>
  );
}

export function IndexLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-center font-mono text-[11px] text-text-tertiary tabular-nums">
      {children}
    </span>
  );
}