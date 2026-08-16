import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/* --------------------------------- Button --------------------------------- */

export const cvButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        primary:
          "sheen bg-primary text-primary-foreground hover:brightness-110 active:brightness-95",
        ghost:
          "text-text-secondary hover:text-foreground hover:bg-surface-2/70 border border-transparent hover:border-hairline",
        outline:
          "border border-hairline text-foreground hover:border-hairline-strong hover:bg-surface-2/60",
        glass:
          "glass text-foreground hover:border-hairline-strong",
        danger:
          "border border-hairline text-destructive/90 hover:bg-destructive/10",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-[15px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

export type CvButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof cvButtonVariants>;

export function CvButton({ className, variant, size, ...props }: CvButtonProps) {
  return <button className={cn(cvButtonVariants({ variant, size }), className)} {...props} />;
}

/* ------------------------------- Glass panel ------------------------------ */

export function GlassPanel({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("glass rounded-[14px]", className)} {...rest}>
      {children}
    </div>
  );
}

/* --------------------------------- Surface -------------------------------- */

export function Surface({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[14px] border border-hairline bg-surface-1", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ---------------------------------- Pill ---------------------------------- */

export function Pill({
  children,
  className,
  tone = "muted",
}: {
  children: ReactNode;
  className?: string;
  tone?: "muted" | "accent" | "glass";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] tracking-tight",
        tone === "muted" && "border border-hairline bg-surface-2/70 text-text-secondary",
        tone === "accent" && "border border-primary/40 bg-primary/12 text-primary",
        tone === "glass" && "glass text-text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------- Segmented control ---------------------------- */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-[10px] border border-hairline bg-surface-1 p-1",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-[7px] px-3 font-medium transition-colors duration-150",
            size === "sm" ? "h-6 text-[12px]" : "h-7 text-[13px]",
            value === o.value
              ? "bg-primary/15 text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  title,
  description,
  action,
  visual,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  visual?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-4 px-6 text-center">
      {visual ?? <GhostCells />}
      <div className="space-y-1.5">
        <p className="text-[15px] font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto max-w-[46ch] text-[13px] leading-relaxed text-text-tertiary">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function GhostCells({ count = 4 }: { count?: number }) {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-10 w-10 rounded-[8px] border border-dashed border-hairline-strong bg-surface-1/40"
        />
      ))}
      <span className="ml-1 inline-block h-5 w-[2px] animate-pulse bg-primary/70" />
    </div>
  );
}

/* --------------------------- Difficulty indicator ------------------------- */

export function DifficultyDots({ level }: { level: "Easy" | "Medium" | "Hard" }) {
  const filled = level === "Easy" ? 1 : level === "Medium" ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-1.5" title={level} aria-label={`Difficulty: ${level}`}>
      <span className="flex items-center gap-[3px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "h-[3px] w-3 rounded-full",
              i < filled ? "bg-text-secondary" : "bg-surface-3",
            )}
          />
        ))}
      </span>
      <span className="font-mono text-[11px] text-text-tertiary">{level}</span>
    </span>
  );
}