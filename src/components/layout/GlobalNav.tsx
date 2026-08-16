import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Github, Menu, Moon, Sun, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CvButton } from "@/components/ui/cv";
import { useTheme } from "@/hooks/useTheme";
import { Logo } from "./Logo";

const links = [
  { to: "/visualize", label: "Visualize" },
  { to: "/examples", label: "Examples" },
  { to: "/learn", label: "Learn" },
] as const;

export function GlobalNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inWorkspace = pathname.startsWith("/visualize");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,backdrop-filter] duration-200",
        scrolled || inWorkspace ? "glass-strong" : "glass-subtle",
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <Link to="/" aria-label="CodeVisualizer home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-[8px] px-3 py-1.5 text-[13.5px] text-text-secondary transition-colors hover:bg-surface-2/60 hover:text-foreground"
              activeProps={{ className: "text-foreground bg-surface-2/60" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden h-9 w-9 items-center justify-center rounded-[9px] text-text-tertiary transition-colors hover:bg-surface-2/70 hover:text-foreground sm:inline-flex"
            aria-label={isDark ? "Switch to Light theme" : "Switch to Dark theme"}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <Moon size={16} strokeWidth={1.5} />
            ) : (
              <Sun size={16} strokeWidth={1.5} />
            )}
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 w-9 items-center justify-center rounded-[9px] text-text-tertiary transition-colors hover:bg-surface-2/70 hover:text-foreground sm:inline-flex"
            aria-label="GitHub"
          >
            <Github size={16} strokeWidth={1.5} />
          </a>
          <button
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-hairline text-text-tertiary transition-colors hover:border-hairline-strong hover:text-foreground sm:inline-flex"
            aria-label="Account (coming soon)"
          >
            <User size={15} strokeWidth={1.5} />
          </button>

          {!inWorkspace ? (
            <Link to="/visualize" className="hidden md:block">
              <CvButton variant="primary" size="sm">
                Start Visualizing
              </CvButton>
            </Link>
          ) : null}

          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] text-text-secondary md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="glass animate-panel-in border-t border-hairline px-4 pb-4 pt-2 md:hidden">
          <nav className="flex flex-col">
            {[...links, { to: "/about", label: "About" } as const].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-[9px] px-3 py-2.5 text-[14px] text-text-secondary hover:bg-surface-2/60 hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-between rounded-[9px] px-3 py-2.5 text-[14px] text-text-secondary hover:bg-surface-2/60 hover:text-foreground"
            >
              <span>Appearance</span>
              <span className="flex items-center gap-1.5 text-xs text-text-tertiary">
                {isDark ? <Moon size={14} /> : <Sun size={14} className="text-amber-500" />}
                {isDark ? "Dark" : "Light"}
              </span>
            </button>
          </nav>
          {!inWorkspace ? (
            <Link to="/visualize" className="mt-3 block">
              <CvButton variant="primary" className="w-full">
                Start Visualizing
              </CvButton>
            </Link>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}