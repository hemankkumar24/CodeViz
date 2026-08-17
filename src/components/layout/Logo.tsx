import { cn } from "@/lib/utils";

export function Logo({ className, showWordmark = true }: { className?: string; showWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none group", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[9px] border border-primary/25 bg-gradient-to-b from-surface-2 via-surface-2/80 to-surface-3 shadow-[0_0_12px_rgba(76,140,255,0.15)] ring-1 ring-white/10 transition-all duration-200 group-hover:border-primary/45 group-hover:shadow-[0_0_16px_rgba(76,140,255,0.25)]">
        {/* Sleek VizCode Symbol: Stylized Code Bracket + Data Waveform / Step Bars */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary transition-transform duration-200 group-hover:scale-105"
        >
          {/* Left code chevron */}
          <path
            d="M8.5 7L3.5 12L8.5 17"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Step 1 bar */}
          <path
            d="M13 14V17"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="opacity-60"
          />
          {/* Step 2 bar (taller) */}
          <path
            d="M16.5 10V17"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="opacity-85"
          />
          {/* Step 3 bar / right bracket node */}
          <path
            d="M20 6.5V17"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Top pulse dot */}
          <circle cx="20" cy="4.5" r="1.5" fill="currentColor" />
        </svg>
      </span>

      {showWordmark ? (
        <span className="font-mono text-[15.5px] font-semibold tracking-tight text-foreground flex items-center">
          <span>Code</span>
          <span className="text-primary font-bold">Viz</span>
        </span>
      ) : null}
    </span>
  );
}