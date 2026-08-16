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
        "inline-flex items-center justify-center rounded-[8px] transition-colors disabled:opacity-30",
        primary
          ? "h-8 w-8 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          : "h-7 w-7 text-text-secondary hover:bg-surface-2 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function PlaybackControls() {
  const { events, currentStep, isPlaying, speed, mutationSteps, dispatch, jumpChange } = useWorkspace();
  const total = events.length;
  const atEnd = currentStep >= total - 1;

  const pct = total > 1 ? (currentStep / (total - 1)) * 100 : 100;

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

  if (!total) {
    return (
      <div className="flex flex-col gap-2 p-1 text-center font-mono text-[11.5px] text-text-tertiary">
        <span>Timeline & Controls</span>
        <span className="text-[11px] text-text-tertiary/70">Execute code to start playback</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* 1. Header with step and line indicators */}
      <div className="flex items-center justify-between font-mono text-[11px] text-text-tertiary">
        <span className="font-semibold text-text-secondary">
          Step {currentStep + 1} <span className="text-text-tertiary font-normal">/ {total}</span>
        </span>
        <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-text-secondary border border-hairline/60">
          Line {events[currentStep]?.line ?? "—"}
        </span>
      </div>

      {/* 2. Scrubbable Timeline slider with mutation ticks */}
      <div className="relative h-5">
        <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-surface-2" />
        <div
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-primary/80"
          style={{ width: `${pct}%` }}
        />
        {mutationSteps.map((s) => (
          <span
            key={s}
            className="absolute top-1/2 h-2 w-[2px] -translate-y-1/2 rounded-full bg-[var(--viz-update)]/80"
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
            "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:shadow-sm",
            "[&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background",
          )}
        />
      </div>

      {/* 3. Playback buttons & Speed selector */}
      <div className="flex items-center justify-between gap-1 pt-0.5">
        <div className="flex items-center gap-0.5">
          <IconBtn label="Restart" onClick={() => dispatch({ type: "restart" })}>
            <RotateCcw size={13} strokeWidth={2} />
          </IconBtn>
          <IconBtn label="Previous mutation" onClick={() => jumpChange(-1)} disabled={currentStep === 0}>
            <ChevronFirst size={14} strokeWidth={2} />
          </IconBtn>
          <IconBtn label="Step back" onClick={() => dispatch({ type: "stepBack" })} disabled={currentStep === 0}>
            <ChevronLeft size={15} strokeWidth={2} />
          </IconBtn>

          <IconBtn
            primary
            label={isPlaying ? "Pause" : atEnd ? "Replay" : "Play"}
            onClick={() => dispatch({ type: atEnd && !isPlaying ? "restart" : isPlaying ? "pause" : "play" })}
          >
            {isPlaying ? <Pause size={14} strokeWidth={2.5} /> : <Play size={14} strokeWidth={2.5} className="ml-0.5 fill-current" />}
          </IconBtn>

          <IconBtn label="Step forward" onClick={() => dispatch({ type: "stepForward" })} disabled={atEnd}>
            <ChevronRight size={15} strokeWidth={2} />
          </IconBtn>
          <IconBtn label="Next mutation" onClick={() => jumpChange(1)} disabled={atEnd}>
            <ChevronLast size={14} strokeWidth={2} />
          </IconBtn>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-0.5 rounded-[7px] border border-hairline/80 bg-surface-1 p-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => dispatch({ type: "setSpeed", speed: s })}
              className={cn(
                "rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] font-medium transition-colors",
                s === speed
                  ? "bg-surface-2 text-foreground font-semibold shadow-xs"
                  : "text-text-tertiary hover:text-text-secondary",
              )}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}