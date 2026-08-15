import Link from 'next/link'
import { Logo } from '@/components/logo'

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Visualize', href: '/visualize' },
      { label: 'Examples', href: '/examples' },
      { label: 'Learn', href: '/learn' },
    ],
  },
  {
    title: 'Examples',
    links: [
      { label: 'Sorting', href: '/examples?category=Sorting' },
      { label: 'Dynamic Programming', href: '/examples?category=Dynamic+Programming' },
      { label: 'Recursion', href: '/examples?category=Recursion' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Understanding DP', href: '/learn' },
      { label: 'How Recursion Unfolds', href: '/learn' },
      { label: 'Two Pointers', href: '/learn' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'About', href: '/about' },
      { label: 'GitHub', href: 'https://github.com' },
      { label: 'Feedback', href: 'https://github.com' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface-1/40">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-xs font-semibold tracking-wide text-tertiary uppercase">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <Logo />
          <p className="text-xs text-tertiary">
            © {new Date().getFullYear()} CodeVisualizer · Built for developers
          </p>
        </div>
      </div>
    </footer>
  )
}
