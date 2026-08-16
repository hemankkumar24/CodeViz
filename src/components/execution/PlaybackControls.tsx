import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/state/executionStore";
import type { PlaybackSpeed } from "@/types/execution";
import { useEffect } from "react";

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 4];

function IconBtn({
  label,
  onClick,
  disabled,
  children,
  primary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-35",
        primary
          ? "h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90"
          : "h-8 w-8 text-text-secondary hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function PlaybackControls() {
  const { events, currentStep, isPlaying, speed, dispatch, jumpChange } = useWorkspace();
  const total = events.length;
  const atEnd = currentStep >= total - 1;

  // Keyboard shortcuts: space / arrows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (!total) return;
      if (e.code === "Space") {
        e.preventDefault();
        dispatch({ type: isPlaying ? "pause" : "play" });
      } else if (e.key === "ArrowRight") {
        dispatch({ type: "stepForward" });
      } else if (e.key === "ArrowLeft") {
        dispatch({ type: "stepBack" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch, isPlaying, total]);

  if (!total) return null;

  return (
    <div className="pointer-events-auto glass-strong flex flex-wrap items-center gap-1.5 rounded-full px-2.5 py-2 shadow-[0_16px_40px_-24px_oklch(0_0_0/0.9)]">
      <IconBtn label="Restart" onClick={() => dispatch({ type: "restart" })}>
        <RotateCcw size={15} strokeWidth={1.8} />
      </IconBtn>
      <IconBtn label="Previous change" onClick={() => jumpChange(-1)}>
        <ChevronFirst size={16} strokeWidth={1.8} />
      </IconBtn>
      <IconBtn label="Step back" onClick={() => dispatch({ type: "stepBack" })} disabled={currentStep === 0}>
        <ChevronLeft size={17} strokeWidth={1.8} />
      </IconBtn>

      <IconBtn
        primary
        label={isPlaying ? "Pause" : atEnd ? "Replay" : "Play"}
        onClick={() => dispatch({ type: atEnd && !isPlaying ? "restart" : isPlaying ? "pause" : "play" })}
      >
        {isPlaying ? <Pause size={16} strokeWidth={2} /> : <Play size={16} strokeWidth={2} className="ml-0.5" />}
      </IconBtn>

      <IconBtn label="Step forward" onClick={() => dispatch({ type: "stepForward" })} disabled={atEnd}>
        <ChevronRight size={17} strokeWidth={1.8} />
      </IconBtn>
      <IconBtn label="Next change" onClick={() => jumpChange(1)}>
        <ChevronLast size={16} strokeWidth={1.8} />
      </IconBtn>

      <span className="mx-1 h-5 w-px bg-hairline" />

      <span className="px-1 font-mono text-[11.5px] tabular-nums text-text-secondary">
        {currentStep + 1}/{total}
      </span>

      <div className="flex items-center gap-0.5 rounded-full bg-surface-1/70 p-0.5">
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => dispatch({ type: "setSpeed", speed: s })}
            className={cn(
              "rounded-full px-2 py-1 font-mono text-[11px] transition-colors",
              s === speed ? "bg-surface-2 text-foreground" : "text-text-tertiary hover:text-text-secondary",
            )}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}