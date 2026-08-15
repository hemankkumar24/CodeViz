'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'

const navLinks = [
  { href: '/visualize', label: 'Visualize' },
  { href: '/examples', label: 'Examples' },
  { href: '/learn', label: 'Learn' },
]

export function SiteNav() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  const isWorkspace = pathname === '/visualize'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-all duration-300',
        scrolled || isWorkspace
          ? 'glass-strong border-border'
          : 'border-transparent bg-background/40 backdrop-blur-md',
      )}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-7">
          <Link href="/" aria-label="CodeVisualizer home" className="shrink-0">
            <Logo />
          </Link>
          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((l) => {
              const active = pathname === l.href
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
                      active
                        ? 'bg-white/[0.06] text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Source on GitHub"
            render={<a href="https://github.com" target="_blank" rel="noreferrer" />} nativeButton={false}
            className="hidden text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            <GitHubMark />
          </Button>

          {!isWorkspace ? (
            <Button
              size="sm"
              className="ml-1 hidden bg-accent text-accent-foreground hover:bg-accent/90 md:inline-flex"
              render={<Link href="/visualize" />} nativeButton={false}
            >
              Start Visualizing
              <ArrowRight />
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {/* mobile sheet */}
      {open ? (
        <div className="glass-strong border-t border-border md:hidden">
          <ul className="flex flex-col gap-1 p-3">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-white/[0.06]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 flex items-center gap-2 px-1">
              <Button
                size="sm"
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                render={<Link href="/visualize" />} nativeButton={false}
              >
                Start Visualizing
                <ArrowRight />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Source on GitHub"
                render={<a href="https://github.com" target="_blank" rel="noreferrer" />} nativeButton={false}
              >
                <GitHubMark />
              </Button>
            </li>
          </ul>
        </div>
      ) : null}
    </header>
  )
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden className="h-4 w-4">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}
