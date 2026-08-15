import type { ReactNode } from "react"
import { SiteNav } from "./site-nav"
import { SiteFooter } from "./site-footer"

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div aria-hidden className="ambient-grid pointer-events-none fixed inset-0 -z-10" />
      <SiteNav />
      <main className="flex-1 pt-16">{children}</main>
      <SiteFooter />
    </div>
  )
}
