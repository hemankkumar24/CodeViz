import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Visualize", to: "/visualize" as const },
      { label: "Examples", to: "/examples" as const },
      { label: "Learn", to: "/learn" as const },
    ],
  },
  {
    title: "Examples",
    links: [
      { label: "Sorting", to: "/examples" as const, search: { category: "Sorting" } },
      { label: "Dynamic Programming", to: "/examples" as const, search: { category: "Dynamic Programming" } },
      { label: "Graphs", to: "/examples" as const, search: { category: "Graphs" } },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Understanding DP", to: "/learn" as const },
      { label: "How Recursion Unfolds", to: "/learn" as const },
      { label: "Sliding Window", to: "/learn" as const },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-background">
      <div className="mx-auto grid w-full max-w-[1400px] gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-[13.5px] text-text-secondary transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
            About
          </h3>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link to="/about" className="text-[13.5px] text-text-secondary hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="text-[13.5px] text-text-secondary hover:text-foreground"
              >
                GitHub
              </a>
            </li>
            <li>
              <a
                href="mailto:hello@codevisualizer.dev"
                className="text-[13.5px] text-text-secondary hover:text-foreground"
              >
                Feedback
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-6 py-6 text-[12px] text-text-tertiary sm:flex-row sm:items-center sm:justify-between">
          <Logo showWordmark={false} />
          <p className="font-mono">© {new Date().getFullYear()} CodeVisualizer</p>
          <p>Built for developers.</p>
        </div>
      </div>
    </footer>
  );
}