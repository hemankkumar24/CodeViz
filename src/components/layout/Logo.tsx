import { cn } from "@/lib/utils";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-hairline bg-surface-2 font-mono text-[13px] text-primary">
        {"</>"}
      </span>
      {showWordmark ? (
        <span className="font-mono text-[15px] font-medium tracking-tight text-foreground">
          CodeVisualizer
        </span>
      ) : null}
    </span>
  );
}