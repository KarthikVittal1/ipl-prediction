import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPlayer, getTeam } from "@/lib/api";
import { TeamLogo } from "@/components/team-logo";

export const Route = createFileRoute("/players/$playerId")({
  loader: async ({ params, context }) => {
    const res = await context.queryClient.ensureQueryData({
      queryKey: ["player", params.playerId],
      queryFn: () => getPlayer(params.playerId),
    });
    if (!res) throw notFound();
    return res;
  },

  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} - IPL 2026 Stats | CrickPredict` },
          { name: "description", content: `${loaderData.name} batting and bowling stats, recent form and team.` },
        ]
      : [],
  }),

  component: PlayerDetail,
});

function PlayerDetail() {
  const { playerId } = Route.useParams();
  const playerQ = useQuery({
    queryKey: ["player", playerId],
    queryFn: () => getPlayer(playerId),
  });

  const player = playerQ.data;

  const teamQ = useQuery({
    queryKey: ["team", player?.teamId],
    queryFn: () => getTeam(player?.teamId ?? ""),
    enabled: !!player?.teamId,
  });

  const team = teamQ.data;

  if (!player) return <div className="p-8 text-center">Loading player...</div>;

  const max = Math.max(...(player.recentScores || [1]), 1);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-5">
        <TeamLogo teamId={player.teamId} size={64} />
        <div>
          <h1 className="text-2xl font-bold">{player.name}</h1>
          <p className="text-sm text-muted-foreground">
            {player.role}{" "}
            {team && (
              <>
                -{" "}
                <Link
                  to="/teams/$teamId"
                  params={{ teamId: team.id }}
                  className="text-primary hover:underline"
                >
                  {team.name}
                </Link>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {player.battingStyle}
            {player.bowlingStyle ? ` - ${player.bowlingStyle}` : ""}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Matches" value={player.matches} />
        <Stat label="Runs" value={player.runs?.toLocaleString()} />
        <Stat label="Bat Avg" value={player.battingAverage?.toFixed(1)} />
        <Stat label="Strike Rate" value={player.strikeRate?.toFixed(1)} />
        <Stat label="100s / 50s" value={`${player.hundreds} / ${player.fifties}`} />
        <Stat label="Wickets" value={player.wickets} />
        {player.bowlingAverage !== undefined && (
          <Stat label="Bowl Avg" value={player.bowlingAverage.toFixed(1)} />
        )}
        {player.economy !== undefined && <Stat label="Economy" value={player.economy.toFixed(2)} />}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Last 5 innings
        </h2>
        <div className="mt-4 flex items-end gap-3">
          {(player.recentScores || []).map((score: number, index: number) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-semibold tabular">{score}</span>
              <div
                className="w-full rounded-t bg-primary"
                style={{ height: `${(score / max) * 80 + 12}px` }}
              />
              <span className="text-[10px] text-muted-foreground">M{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular">{value ?? "-"}</p>
    </div>
  );
}
