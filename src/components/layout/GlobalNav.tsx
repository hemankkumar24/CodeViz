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
        <Link to="/" aria-label="CodeViz home">
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
            href="https://github.com/hemankkumar24/CodeViz"
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
        <div className="absolute top-full inset-x-0 z-50 animate-panel-in border-b border-hairline bg-surface-1/85 backdrop-blur-2xl px-4 pb-5 pt-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)] md:hidden">
          <nav className="flex flex-col gap-1">
            {[...links, { to: "/about", label: "About" } as const].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-[10px] px-3.5 py-2.5 text-[14.5px] font-medium text-text-secondary transition-colors hover:bg-surface-2/70 hover:text-foreground"
                activeProps={{ className: "text-foreground bg-surface-2/80 font-semibold" }}
              >
                {l.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-between rounded-[10px] px-3.5 py-2.5 text-[14.5px] font-medium text-text-secondary transition-colors hover:bg-surface-2/70 hover:text-foreground"
            >
              <span>Appearance</span>
              <span className="flex items-center gap-1.5 rounded-full border border-hairline bg-surface-2 px-2.5 py-1 text-xs text-text-secondary">
                {isDark ? <Moon size={13} /> : <Sun size={13} className="text-amber-500" />}
                <span>{isDark ? "Dark" : "Light"}</span>
              </span>
            </button>
          </nav>
          {!inWorkspace ? (
            <Link to="/visualize" onClick={() => setOpen(false)} className="mt-3.5 block">
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