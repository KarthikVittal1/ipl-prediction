// Server-only helpers. Currently returns curated mock data and stubs the
// upstream cricket API. When CRICKET_API_KEY is added, swap the body of
// fetchUpstreamMatches() to call the real provider.
import {
  MATCHES,
  PLAYERS,
  STADIUMS,
  TEAMS_DATA,
  findMatch,
  findPlayer,
  findStadium,
  findTeam,
} from "@/lib/mock-data";
import type { Match, Player, Stadium, Team } from "@/types/cricket";

const API_BASE =
  process.env.VITE_API_BASE_URL ?? process.env.PREDICTION_API_URL ?? "http://localhost:8000";

async function fetchBackend<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}${path}`);
    if (!res.ok) return null;
    const json = (await res.json()) as T & { status?: string };
    if (json?.status === "error") return null;
    return json;
  } catch (err) {
    console.error(`Backend API failed for ${path}`, err);
    return null;
  }
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function findTeamByBackendName(name: string): Team | undefined {
  const normalized = name.toLowerCase();
  return TEAMS_DATA.find(
    (team) =>
      team.name.toLowerCase() === normalized ||
      team.shortName.toLowerCase() === normalized ||
      team.id.toLowerCase() === normalized
  );
}

function teamRef(name: string) {
  const team = findTeamByBackendName(name);
  return {
    id: team?.id ?? slug(name),
    name: team?.name ?? name,
    shortName: team?.shortName ?? name,
    logoUrl: team?.logoUrl ?? "",
  };
}

async function fetchBackendMatches(): Promise<Match[] | null> {
  const payload = await fetchBackend<{
    matches?: {
      id: string;
      team1: string;
      team2: string;
      date: string;
      venue: string;
      status?: string;
      winner?: string | null;
    }[];
  }>("/matches?type=all&limit=100");

  if (!payload?.matches?.length) return null;

  return payload.matches.map((match) => {
    const teamA = teamRef(match.team1);
    const teamB = teamRef(match.team2);
    const venue = STADIUMS.find(
      (stadium) =>
        stadium.id === match.venue ||
        stadium.name.toLowerCase() === String(match.venue).toLowerCase()
    );
    const status = ["live", "upcoming", "completed"].includes(String(match.status))
      ? (match.status as Match["status"])
      : "completed";

    return {
      id: match.id,
      status,
      format: "T20",
      series: "IPL 2026",
      startTime: match.date,
      venueId: venue?.id ?? match.venue,
      teamA,
      teamB,
      innings: [],
      result: match.winner ? `${match.winner} won` : undefined,
    };
  });
}

async function fetchBackendTeams(): Promise<Team[] | null> {
  const payload = await fetchBackend<{ teams?: { id: string; name: string }[] }>("/teams");
  if (!payload?.teams?.length) return null;

  return payload.teams.map((backendTeam, index) => {
    const local = findTeamByBackendName(backendTeam.name) ?? findTeam(backendTeam.id);
    return (
      local ?? {
        id: backendTeam.id,
        name: backendTeam.name,
        shortName: backendTeam.name,
        logoUrl: "",
        rankingTest: index + 1,
        rankingOdi: index + 1,
        rankingT20: index + 1,
        recentForm: ["N", "N", "N", "N", "N"],
        squad: [],
      }
    );
  });
}

async function fetchBackendStadiums(): Promise<Stadium[] | null> {
  const payload = await fetchBackend<{
    venues?: { id: string; name: string; city?: string; capacity?: number }[];
  }>("/venues");
  if (!payload?.venues?.length) return null;

  return payload.venues.map((venue) => {
    const local = findStadium(venue.id) ?? STADIUMS.find((s) => s.name === venue.name);
    return (
      local ?? {
        id: venue.id,
        name: venue.name,
        city: venue.city ?? venue.name,
        country: "India",
        capacity: venue.capacity ?? 50000,
        established: 0,
        pitch: "Pitch report unavailable from backend.",
        avgFirstInnings: 0,
        notableMatches: [],
        imageUrl: "",
      }
    );
  });
}

export async function listMatches(filter?: "live" | "upcoming" | "completed") {
  const upstream = await fetchBackendMatches();
  const data = upstream ?? MATCHES;
  return filter ? data.filter((m) => m.status === filter) : data;
}

export async function getMatch(id: string): Promise<Match | null> {
  return findMatch(id) ?? null;
}

export async function listTeams(): Promise<Team[]> {
  return (await fetchBackendTeams()) ?? TEAMS_DATA;
}

export async function getTeam(id: string): Promise<Team | null> {
  return findTeam(id) ?? null;
}

export async function listPlayers(): Promise<Player[]> {
  return PLAYERS;
}

export async function getPlayer(id: string): Promise<Player | null> {
  return findPlayer(id) ?? null;
}

export async function listStadiums(): Promise<Stadium[]> {
  return (await fetchBackendStadiums()) ?? STADIUMS;
}

export async function getStadium(id: string): Promise<Stadium | null> {
  return findStadium(id) ?? null;
}
