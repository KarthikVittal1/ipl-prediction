import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Trophy } from "lucide-react";
import { getMatch, getPrediction, getStadium } from "@/lib/api";
import { TeamLogo } from "@/components/team-logo";
import type { Match, Prediction } from "@/lib/api";

export const Route = createFileRoute("/matches/$matchId")({
  loader: async ({ params, context }) => {
    const match = await context.queryClient.ensureQueryData({
      queryKey: ["match", params.matchId],
      queryFn: () => getMatch(params.matchId),
    });
    if (!match) throw notFound();
    return match;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: `${loaderData.teamA.shortName} vs ${loaderData.teamB.shortName} — ${loaderData.series} | CrickPredict`,
          },
          {
            name: "description",
            content: `${loaderData.teamA.name} vs ${loaderData.teamB.name} live scorecard and AI prediction.`,
          },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Match not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Back to home
      </Link>
    </div>
  ),
  component: MatchDetail,
});

function MatchDetail() {
  const matchId = Route.useParams().matchId;

  const matchQ = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatch(matchId),
    refetchInterval: 20_000,
  });

  const predQ = useQuery({
    queryKey: ["prediction", matchId],
    queryFn: () => getPrediction(matchId),
    staleTime: 10 * 60 * 1000,
  });

  const match = matchQ.data;
  const prediction = predQ.data;
  if (!match) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/40 px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="rounded bg-foreground/5 px-1.5 py-0.5 font-semibold uppercase tracking-wider text-muted-foreground">
              {match.format}
            </span>
            <span className="text-muted-foreground">{match.series}</span>
          </div>
          {match.status === "live" && (
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <span className="live-dot inline-block h-2 w-2 rounded-full bg-primary" />
              LIVE
            </span>
          )}
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto_1fr]">
          <TeamPanel match={match} side="A" />
          <div className="grid place-items-center text-2xl font-bold text-muted-foreground">VS</div>
          <TeamPanel match={match} side="B" />
        </div>

        {match.summary && match.status === "live" && (
          <div className="border-t border-border px-6 py-3 text-sm font-medium">{match.summary}</div>
        )}
        {match.result && (
          <div className="flex items-center gap-2 border-t border-border bg-pitch/10 px-6 py-3 text-sm font-semibold text-pitch">
            <Trophy className="h-4 w-4" />
            {match.result}
          </div>
        )}
      </div>

      {/* Prediction panel */}
      {prediction && match.status !== "completed" && (
        <PredictionPanel match={match} prediction={prediction} />
      )}

      {/* Venue */}
      <VenueCard venueId={match.venueId} venueName={match.venue} />
    </div>
  );
}

function VenueCard({ venueId, venueName }: { venueId: string; venueName: string }) {
  const { data: stadium } = useQuery({
    queryKey: ["stadium", venueId],
    queryFn: () => getStadium(venueId),
  });

  if (!stadium) {
    return (
      <Card title="Venue" className="mt-6">
        <p className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          {venueName}
        </p>
      </Card>
    );
  }

  return (
    <Card title="Venue" className="mt-6">
      <Link
        to="/stadiums/$stadiumId"
        params={{ stadiumId: stadium.id }}
        className="flex items-start gap-4 group"
      >
        <div className="flex-1">
          <h3 className="font-semibold group-hover:text-primary">{stadium.name}</h3>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {stadium.city}, {stadium.country}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{stadium.pitch}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Capacity: <span className="font-semibold text-foreground">{stadium.capacity.toLocaleString()}</span>
          </p>
        </div>
      </Link>
    </Card>
  );
}

function TeamPanel({ match, side }: { match: Match; side: "A" | "B" }) {
  const team = side === "A" ? match.teamA : match.teamB;
  const inn = match.innings.find((i) => i.teamId === team.id);
  return (
    <Link
      to="/teams/$teamId"
      params={{ teamId: team.id }}
      className="flex flex-col items-center gap-2"
    >
      <TeamLogo teamId={team.id} size={72} />
      <p className="font-bold">{team.name}</p>
      {inn ? (
        <p className="tabular text-2xl font-bold">
          {inn.runs}/{inn.wickets}{" "}
          <span className="text-base font-normal text-muted-foreground">({inn.overs})</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Yet to bat</p>
      )}
    </Link>
  );
}

function PredictionPanel({ match, prediction }: { match: Match; prediction: Prediction }) {
  const a = Math.round(prediction.probA * 100);
  const b = 100 - a;
  // predictedWinnerId is the team name string from backend
  const winnerName = prediction.predictedWinnerId;
  return (
    <div className="mt-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <Trophy className="h-4 w-4" />
        </span>
        <h2 className="font-bold">AI Match Prediction</h2>
        <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
          Live model
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Predicted winner: <span className="font-semibold text-foreground">{winnerName}</span>
      </p>
      <div className="mt-3 flex items-center gap-3">
        <span className="w-12 text-right font-bold tabular">{a}%</span>
        <div className="flex h-3 flex-1 overflow-hidden rounded-full bg-border">
          <div className="bg-primary" style={{ width: `${a}%` }} />
          <div className="bg-pitch" style={{ width: `${b}%` }} />
        </div>
        <span className="w-12 font-bold tabular">{b}%</span>
      </div>
      <div className="mt-1 flex justify-between text-xs font-medium text-muted-foreground">
        <span>{match.teamA.shortName}</span>
        <span>{match.teamB.shortName}</span>
      </div>
      {prediction.factors && prediction.factors.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {prediction.factors.map((f) => (
            <div key={f.label} className="rounded-md border border-border bg-card px-3 py-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {f.label}
              </p>
              <p className="text-sm font-semibold text-pitch">
                {(f.weight * 100).toFixed(0)}%
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border bg-card ${className}`}>
      <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
