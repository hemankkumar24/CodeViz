import { useEffect, useRef, useState } from 'react'

/** Lightweight autoplay for landing/demo traces. Loops, pauses on hover/blur,
 *  respects prefers-reduced-motion (falls back to a static frame). */
export function useTracePlayer(
  total: number,
  {
    intervalMs = 900,
    loop = true,
    enabled = true,
    staticFrame = 0,
  }: { intervalMs?: number; loop?: boolean; enabled?: boolean; staticFrame?: number } = {},
) {
  const [step, setStep] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = useRef(false)

  useEffect(() => {
    reduced.current =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced.current) setStep(staticFrame)
  }, [staticFrame])

  useEffect(() => {
    if (!enabled || paused || reduced.current || total <= 1) return
    const id = setInterval(() => {
      setStep((s) => {
        if (s + 1 >= total) return loop ? 0 : s
        return s + 1
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [enabled, paused, total, intervalMs, loop])

  return {
    step: Math.min(step, Math.max(total - 1, 0)),
    paused,
    setPaused,
    setStep,
  }
}
