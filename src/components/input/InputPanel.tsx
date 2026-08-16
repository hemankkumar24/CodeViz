import { AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill, SegmentedControl } from "@/components/ui/cv";
import { useWorkspace } from "@/state/executionStore";
import type { InputData } from "@/types/execution";

const KINDS: { value: InputData["kind"]; label: string }[] = [
  { value: "array", label: "Array" },
  { value: "matrix", label: "Matrix" },
  { value: "variables", label: "Variables" },
];

const PLACEHOLDER: Record<InputData["kind"], string> = {
  array: "5, 2, 4, 1  or  [5, 2, 4, 1]",
  matrix: "1, 2, 3\n4, 5, 6",
  variables: "n = 8\ntarget = 11",
};

export function InputPanel() {
  const { inputKind, inputText, parsed, dispatch } = useWorkspace();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-tertiary">
          Input
        </p>
        <SegmentedControl
          value={inputKind}
          options={KINDS}
          onChange={(kind) => dispatch({ type: "setInputKind", kind })}
          size="sm"
        />
      </div>

      <textarea
        value={inputText}
        onChange={(e) => dispatch({ type: "setInputText", text: e.target.value })}
        placeholder={PLACEHOLDER[inputKind]}
        rows={inputKind === "array" ? 2 : 4}
        aria-label="Input data"
        aria-invalid={inputText.trim().length > 0 && !parsed.ok}
        className={cn(
          "w-full resize-none rounded-[10px] border bg-surface-1 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-text-tertiary/70",
          inputText.trim() && !parsed.ok
            ? "border-[var(--viz-delete)]/70 focus:border-[var(--viz-delete)]"
            : "border-hairline focus:border-primary/60",
        )}
      />

      {inputText.trim() ? (
        parsed.ok ? (
          <p className="flex items-center gap-1.5 font-mono text-[11.5px] text-[var(--viz-insert)]">
            <Check size={12} strokeWidth={2.2} />
            {parsed.data.kind === "array"
              ? `${parsed.data.values.length} values parsed`
              : parsed.data.kind === "matrix"
                ? `${parsed.data.values.length}×${parsed.data.values[0]?.length ?? 0} matrix parsed`
                : `${Object.keys(parsed.data.values).length} variables parsed`}
          </p>
        ) : (
          <p className="flex items-start gap-1.5 font-mono text-[11.5px] text-[var(--viz-delete)]">
            <AlertCircle size={12} strokeWidth={2.2} className="mt-0.5 shrink-0" />
            {parsed.message}
          </p>
        )
      ) : (
        <Pill>Awaiting input</Pill>
      )}
    </div>
  );
}