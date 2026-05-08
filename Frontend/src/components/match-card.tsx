import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { Match, Prediction } from "@/lib/api";
import { TeamLogo } from "./team-logo";
import { WeatherDisplay } from "./weather-display";

function fmtScore(s?: { runs: number; wickets: number; overs: string }) {
  if (!s) return "Yet to bat";
  return `${s.runs}/${s.wickets} (${s.overs})`;
}

function fmtTime(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

interface Props {
  match: Match;
  prediction?: Prediction | null;
}

export function MatchCard({ match, prediction }: Props) {
  const innA = match.innings.find((i) => i.teamId === match.teamA.id);
  const innB = match.innings.find((i) => i.teamId === match.teamB.id);

  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: match.id }}
      className="group block overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/40 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="rounded bg-foreground/5 px-1.5 py-0.5 font-semibold uppercase tracking-wider text-muted-foreground">
            {match.format}
          </span>
          <span className="truncate text-muted-foreground">{match.series}</span>
        </div>
        {match.status === "live" ? (
          <span className="flex items-center gap-1.5 font-semibold text-primary">
            <span className="live-dot inline-block h-2 w-2 rounded-full bg-primary" />
            LIVE
          </span>
        ) : match.status === "upcoming" ? (
          <span className="text-muted-foreground">{fmtTime(match.startTime)}</span>
        ) : (
          <span className="font-semibold text-pitch">RESULT</span>
        )}
      </div>

      <div className="space-y-2 px-4 py-3">
        <Row teamId={match.teamA.id} name={match.teamA.shortName} score={fmtScore(innA)} />
        <Row teamId={match.teamB.id} name={match.teamB.shortName} score={fmtScore(innB)} />
      </div>

      <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1 truncate">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{match.venue}</span>
        </div>
        {match.summary && match.status === "live" && (
          <p className="mt-1 truncate font-medium text-foreground">{match.summary}</p>
        )}
        {match.result && match.status === "completed" && (
          <p className="mt-1 truncate font-medium text-foreground">{match.result}</p>
        )}
        {/* Weather display for live and upcoming matches */}
        {(match.status === "live" || match.status === "upcoming") && match.weather && (
          <div className="mt-2">
            <WeatherDisplay weather={match.weather} compact={true} />
          </div>
        )}
      </div>

      {prediction && match.status !== "completed" && (
        <PredictionBar prediction={prediction} match={match} />
      )}
    </Link>
  );
}

function Row({ teamId, name, score }: { teamId: string; name: string; score: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <TeamLogo teamId={teamId} size={32} />
        <span className="font-semibold">{name}</span>
      </div>
      <span className="tabular text-sm font-semibold">{score}</span>
    </div>
  );
}

function PredictionBar({ prediction, match }: { prediction: Prediction; match: Match }) {
  const a = Math.round(prediction.probA * 100);
  const b = 100 - a;
  return (
    <div className="border-t border-border bg-secondary/30 px-4 py-2.5">
      <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
        <span className="uppercase tracking-wider">AI Prediction</span>
        <span>
          {match.teamA.shortName} {a}% · {b}% {match.teamB.shortName}
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-border">
        <div className="bg-primary" style={{ width: `${a}%` }} />
        <div className="bg-pitch" style={{ width: `${b}%` }} />
      </div>
    </div>
  );
}
