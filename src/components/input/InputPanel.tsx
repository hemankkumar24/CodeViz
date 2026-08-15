import { AlertCircle, Check, Code2, Sliders, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pill, SegmentedControl } from "@/components/ui/cv";
import { useWorkspace, getDefaultParamValue } from "@/state/executionStore";
import type { InputData } from "@/types/execution";

const KINDS: { value: InputData["kind"]; label: string }[] = [
  { value: "variables", label: "Variables" },
  { value: "array", label: "Array" },
  { value: "matrix", label: "Matrix" },
];

const TYPE_LABELS: Record<string, string> = {
  "number": "number",
  "number[]": "number[]",
  "number[][]": "number[][]",
  "string": "string",
  "string[]": "string[]",
  "boolean": "boolean",
  "unknown": "any",
};

export function InputPanel() {
  const {
    inputMode,
    inputKind,
    inputText,
    paramValues,
    paramErrors,
    parsed,
    dispatch,
    detectedFunction,
    detectedParams,
  } = useWorkspace();

  const hasParams = detectedParams.length > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Header with Mode Switching */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-tertiary">
            Inputs
          </p>
          {detectedFunction && (
            <span className="rounded-[6px] border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-primary">
              {detectedFunction.name}()
            </span>
          )}
        </div>

        {hasParams ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => dispatch({ type: "setInputMode", mode: "form" })}
              className={cn(
                "flex items-center gap-1 rounded-[6px] px-2 py-1 font-mono text-[11px] transition-colors",
                inputMode === "form"
                  ? "bg-surface-2 text-foreground font-semibold shadow-sm border border-hairline"
                  : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <Sliders size={11} />
              <span>Params ({detectedParams.length})</span>
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "setInputMode", mode: "raw" })}
              className={cn(
                "flex items-center gap-1 rounded-[6px] px-2 py-1 font-mono text-[11px] transition-colors",
                inputMode === "raw"
                  ? "bg-surface-2 text-foreground font-semibold shadow-sm border border-hairline"
                  : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <FileText size={11} />
              <span>Raw</span>
            </button>
          </div>
        ) : (
          <SegmentedControl
            value={inputKind}
            options={KINDS}
            onChange={(kind) => dispatch({ type: "setInputKind", kind })}
            size="sm"
          />
        )}
      </div>

      {/* PARAMETER FORM VIEW (A box for every parameter) */}
      {hasParams && inputMode === "form" ? (
        <div className="flex flex-col gap-2.5">
          {detectedParams.map((param) => {
            const val = paramValues[param.name] ?? "";
            const err = paramErrors[param.name];
            const isMultiline = param.inferredType === "number[][]" || (param.inferredType === "number[]" && val.length > 35);
            const placeholder = getDefaultParamValue(param.name, param.inferredType, param.defaultValue);

            return (
              <div
                key={param.name}
                className="flex flex-col gap-1 rounded-[10px] border border-hairline/80 bg-surface-1/70 p-2.5 transition-colors focus-within:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor={`param-${param.name}`}
                      className="font-mono text-[12px] font-semibold text-foreground"
                    >
                      {param.name}
                    </label>
                    <span className="rounded px-1.5 py-0.2 font-mono text-[10.5px] text-text-tertiary bg-surface-2 border border-hairline/50">
                      {TYPE_LABELS[param.inferredType] ?? param.inferredType}
                    </span>
                  </div>

                  {err ? (
                    <span className="flex items-center gap-1 font-mono text-[10.5px] text-[var(--viz-delete)]">
                      <AlertCircle size={10} className="shrink-0" />
                      {err}
                    </span>
                  ) : val.trim() ? (
                    <span className="flex items-center gap-1 font-mono text-[10.5px] text-[var(--viz-insert)]">
                      <Check size={10} strokeWidth={2.5} />
                      valid
                    </span>
                  ) : null}
                </div>

                {isMultiline ? (
                  <textarea
                    id={`param-${param.name}`}
                    value={val}
                    onChange={(e) => dispatch({ type: "setParamValue", name: param.name, value: e.target.value })}
                    placeholder={placeholder}
                    rows={param.inferredType === "number[][]" ? 3 : 2}
                    className={cn(
                      "w-full resize-none rounded-[7px] border bg-surface-2/60 px-2.5 py-1.5 font-mono text-[12.5px] text-foreground outline-none transition-colors placeholder:text-text-tertiary/60",
                      err ? "border-[var(--viz-delete)]/60" : "border-hairline focus:border-primary/60"
                    )}
                  />
                ) : (
                  <input
                    id={`param-${param.name}`}
                    type="text"
                    value={val}
                    onChange={(e) => dispatch({ type: "setParamValue", name: param.name, value: e.target.value })}
                    placeholder={placeholder}
                    className={cn(
                      "w-full rounded-[7px] border bg-surface-2/60 px-2.5 py-1.5 font-mono text-[12.5px] text-foreground outline-none transition-colors placeholder:text-text-tertiary/60",
                      err ? "border-[var(--viz-delete)]/60" : "border-hairline focus:border-primary/60"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* RAW / SCRIPT TEXTAREA VIEW */
        <div className="flex flex-col gap-2">
          <textarea
            value={inputText}
            onChange={(e) => dispatch({ type: "setInputText", text: e.target.value })}
            placeholder={
              hasParams
                ? detectedParams.map((p) => `${p.name} = ${getDefaultParamValue(p.name, p.inferredType, p.defaultValue)}`).join("\n")
                : "nums = [5, 2, 4, 1]\ntarget = 11"
            }
            rows={hasParams ? Math.min(Math.max(detectedParams.length + 1, 3), 6) : 3}
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
                {parsed.summary}
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
      )}
    </div>
  );
}