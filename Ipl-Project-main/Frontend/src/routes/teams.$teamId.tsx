import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getTeam, listMatches } from "@/lib/api";
import { TeamLogo } from "@/components/team-logo";
import { MatchCard } from "@/components/match-card";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/teams/$teamId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.teamId} — IPL 2026 Squad & Fixtures | CrickPredict` },
      { name: "description", content: `${params.teamId} full squad, fixtures and results.` },
    ],
  }),
  component: TeamDetail,
});

const ROLE_ORDER = ["Batsman", "Wicket-keeper", "All-rounder", "Bowler"];

function roleColor(role: string) {
  switch (role) {
    case "Batsman":       return "bg-blue-500/10 text-blue-400";
    case "Wicket-keeper": return "bg-yellow-500/10 text-yellow-400";
    case "All-rounder":   return "bg-green-500/10 text-green-400";
    case "Bowler":        return "bg-red-500/10 text-red-400";
    default:              return "bg-secondary text-muted-foreground";
  }
}

function TeamDetail() {
  const { teamId } = Route.useParams();

  const teamQ = useQuery({
    queryKey: ["team", teamId],
    queryFn: () => getTeam(decodeURIComponent(teamId)),
    staleTime: 60_000,
  });

  const matchesQ = useQuery({
    queryKey: ["matches"],
    queryFn: () => listMatches(),
    staleTime: 60_000,
  });

  const team = teamQ.data;
  if (teamQ.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading team...</span>
      </div>
    );
  }
  if (!team) return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Team not found</h1>
      <Link to="/teams" className="mt-4 inline-block text-primary underline">All teams</Link>
    </div>
  );

  const byRole = ROLE_ORDER.reduce((acc, role) => {
    acc[role] = (team.squad ?? []).filter((p) => p.role === role);
    return acc;
  }, {} as Record<string, typeof team.squad>);

  const matches = (matchesQ.data ?? []).filter(
    (m) => m.teamA.id === team.id || m.teamB.id === team.id
  );

  return (
    <div>
      <div className="border-b border-border bg-gradient-to-r from-secondary/80 to-background">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-8">
          <div className="rounded-full bg-white/95 p-2 shadow">
            <TeamLogo teamId={team.id} size={88} />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{team.name}</h1>
            <p className="text-sm text-muted-foreground">{team.shortName} · IPL 2026 · {team.city}</p>
            <p className="mt-1 text-sm text-muted-foreground">{team.squad.length} players in squad</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <section>
            <h2 className="mb-4 text-lg font-bold tracking-tight">Full Squad</h2>
            {team.squad.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading players... (takes ~60s on first server start)</span>
              </div>
            ) : (
              <div className="space-y-6">
                {ROLE_ORDER.map((role) => {
                  const players = byRole[role];
                  if (!players || players.length === 0) return null;
                  return (
                    <div key={role}>
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${roleColor(role)}`}>
                          {role}s
                        </span>
                        <span className="text-xs text-muted-foreground">{players.length} players</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {players.map((p) => (
                          <Link
                            key={p.id}
                            to="/players/$playerId"
                            params={{ playerId: p.id }}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-all hover:border-primary/40 hover:shadow-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.battingStyle || "Right Hand Bat"}
                                {p.bowlingStyle ? ` · ${p.bowlingStyle}` : ""}
                              </p>
                            </div>
                            <span className="shrink-0 rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              {p.wickets > 0 && (role === "Bowler" || role === "All-rounder")
                                ? `${p.wickets} wkts`
                                : p.runs > 0 ? `${p.runs} runs` : "—"}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            {team.squad.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Squad breakdown</p>
                <div className="space-y-2">
                  {ROLE_ORDER.map((role) => {
                    const count = byRole[role]?.length ?? 0;
                    if (count === 0) return null;
                    return (
                      <div key={role} className="flex items-center justify-between text-sm">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleColor(role)}`}>{role}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {matches.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Fixtures & Results</h3>
                <div className="space-y-3">
                  {matches.slice(0, 5).map((m) => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}