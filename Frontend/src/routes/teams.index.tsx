import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listTeams } from "@/lib/api";
import { TeamLogo } from "@/components/team-logo";

export const Route = createFileRoute("/teams/")({
  component: TeamsPage,
});

function TeamsPage() {
  const q = useQuery({ queryKey: ["teams"], queryFn: () => listTeams() });
  const teams = q.data ?? [];
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">IPL 2026 Franchises</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tap any franchise to see its squad, recent form and fixtures.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((t) => (
          <Link
            key={t.id}
            to="/teams/$teamId"
            params={{ teamId: t.id }}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <TeamLogo teamId={t.id} size={56} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-bold">{t.name}</h2>
              <p className="text-xs text-muted-foreground">Squad: {t.squad.length} players</p>
              <div className="mt-2 flex gap-1">
                {t.recentForm.map((r, i) => (
                  <span
                    key={i}
                    className={`grid h-5 w-5 place-items-center rounded text-[10px] font-bold text-white ${
                      r === "W" ? "bg-pitch" : "bg-primary"
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
