import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/matches", label: "Matches" },
  { to: "/teams", label: "Teams" },
  { to: "/players", label: "Players" },
  { to: "/stadiums", label: "Stadiums" },
  { to: "/points", label: "Points Table" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Trophy className="h-4 w-4" />
          </span>
          <span className="text-lg">
            Crick<span className="text-primary">Predict</span>
          </span>
          <span className="ml-2 hidden rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline">
            IPL 2026
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} CrickPredict — IPL 2026 coverage with AI predictions.</p>
        <p>Live scores update every 20 seconds. Predictions powered by logistic regression.</p>
      </div>
    </footer>
  );
}
