// src/lib/api.ts
// Connects to your FastAPI backend and transforms responses into the
// shape that all existing route components expect.

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

// ─── Raw backend response types ──────────────────────────────────────────────

interface BackendMatch {
  id: string;
  team1: string;
  team2: string;
  date: string;
  venue: string;
  status: "live" | "upcoming" | "completed";
  winner?: string | null;
  weather?: {
    status: string;
    temperature?: number;
    humidity?: number;
    weather?: string;
    description?: string;
    wind_speed?: number;
    pressure?: number;
    visibility?: number;
  } | null;
}

interface BackendTeam {
  id: string;
  name: string;
  city: string;
}

interface BackendVenue {
  id: string;
  name: string;
  city: string;
  capacity: number;
}

interface BackendStanding {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  nrr: number;
}

interface BackendPrediction {
  status: string;
  winner: string;
  prob_a: number;
  prob_b: number;
  confidence: number;
  factors: { label: string; weight: number }[];
}

// ─── Frontend types (what Lovable components expect) ─────────────────────────

export interface TeamRef {
  id: string;
  name: string;
  shortName: string;
}

export interface Innings {
  teamId: string;
  runs: number;
  wickets: number;
  overs: string;
}

export interface Match {
  id: string;
  teamA: TeamRef;
  teamB: TeamRef;
  venueId: string;
  venue: string;
  status: "live" | "upcoming" | "completed";
  format: string;
  series: string;
  startTime: string;
  innings: Innings[];
  summary?: string;
  result?: string;
  currentBatters?: { name: string; runs: number; balls: number }[];
  currentBowler?: { name: string; overs: string; maidens: number; runs: number; wickets: number };
  weather?: {
    temperature?: number;
    humidity?: number;
    weather?: string;
    description?: string;
    wind_speed?: number;
    pressure?: number;
    visibility?: number;
  } | null;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  city: string;
  squad: Player[];
  recentForm: string[];
  rankingT20: number;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  role: string;
  battingStyle: string;
  bowlingStyle?: string;
  matches: number;
  runs: number;
  battingAverage: number;
  strikeRate: number;
  hundreds: number;
  fifties: number;
  wickets: number;
  bowlingAverage?: number;
  economy?: number;
  recentScores: number[];
}

export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  capacity: number;
  established?: string;
  avgFirstInnings?: string;
  pitch: string;
  imageUrl?: string;
  notableMatches: string[];
}

export interface Prediction {
  predictedWinnerId: string;
  probA: number;
  probB: number;
  source: "model" | "demo";
  factors: { label: string; weight: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.status === "error") {
    throw new Error(data?.message || `API error: ${res.status}`);
  }
  return data as T;
}

/** Derive a short team name (3-4 chars) from the full team name */
function shortName(name: string): string {
  const map: Record<string, string> = {
    "Mumbai Indians": "MI",
    "Chennai Super Kings": "CSK",
    "Royal Challengers Bengaluru": "RCB",
    "Royal Challengers Bangalore": "RCB",
    "Kolkata Knight Riders": "KKR",
    "Delhi Capitals": "DC",
    "Delhi Daredevils": "DC",
    "Punjab Kings": "PBKS",
    "Kings XI Punjab": "PBKS",
    "Rajasthan Royals": "RR",
    "Sunrisers Hyderabad": "SRH",
    "Lucknow Super Giants": "LSG",
    "Gujarat Titans": "GT",
  };
  return map[name] ?? name.split(" ").map((w) => w[0]).join("").slice(0, 4).toUpperCase();
}

/** Normalise team name variants → canonical squad name (mirrors app.py _TEAM_ALIASES) */
const TEAM_ALIASES: Record<string, string> = {
  "royal challengers bangalore":  "Royal Challengers Bengaluru",
  "royal challengers bengalore":  "Royal Challengers Bengaluru",
  "royal challengers bengaluru":  "Royal Challengers Bengaluru",
  "delhi daredevils":             "Delhi Capitals",
  "kings xi punjab":              "Punjab Kings",
  "rising pune supergiants":      "Rising Pune Supergiants",
  "rising pune supergiant":       "Rising Pune Supergiants",
};

/** Map frontend team IDs to full team names (matching team-logos.ts exactly) */
const TEAM_ID_TO_NAME: Record<string, string> = {
  "csk": "Chennai Super Kings",
  "mi": "Mumbai Indians", 
  "rcb": "Royal Challengers Bengaluru",
  "kkr": "Kolkata Knight Riders",
  "dc": "Delhi Capitals",
  "srh": "Sunrisers Hyderabad",
  "pbks": "Punjab Kings",
  "rr": "Rajasthan Royals",
  "gt": "Gujarat Titans",
  "lsg": "Lucknow Super Giants",
};

function canonicalTeam(name: string): string {
  return TEAM_ALIASES[name.trim().toLowerCase()] ?? name.trim();
}

function makeTeamRef(name: string): TeamRef {
  const canon = canonicalTeam(name);
  return { id: canon, name: canon, shortName: shortName(canon) };
}

/** Transform a backend match → frontend Match shape */
function transformMatch(m: BackendMatch): Match {
  const innings: Innings[] = [];
  // Backend doesn't return live ball data — leave innings empty
  // (components handle "Yet to bat" gracefully when array is empty)

  const result =
    m.status === "completed" && m.winner
      ? `${m.winner} won the match`
      : undefined;

  return {
    id: m.id,
    teamA: makeTeamRef(m.team1),
    teamB: makeTeamRef(m.team2),
    venueId: m.venue,
    venue: m.venue,
    status: m.status,
    format: "T20",
    series: "IPL 2026",
    startTime: m.date || new Date().toISOString(),
    innings,
    result,
    summary: m.status === "live" ? "Match in progress" : undefined,
    weather: m.weather || null,
  };
}

// ─── Cache for team/venue lists so we don't re-fetch inside getMatch ─────────

let _teamsCache: BackendTeam[] | null = null;
let _venuesCache: BackendVenue[] | null = null;

async function getCachedTeams(): Promise<BackendTeam[]> {
  if (!_teamsCache) {
    const data = await get<{ teams: BackendTeam[] }>("/teams");
    _teamsCache = data.teams ?? [];
  }
  return _teamsCache;
}

async function getCachedVenues(): Promise<BackendVenue[]> {
  if (!_venuesCache) {
    const data = await get<{ venues: BackendVenue[] }>("/venues");
    _venuesCache = data.venues ?? [];
  }
  return _venuesCache;
}

// ─── Public API functions (called by route components) ───────────────────────

/** Used by: index.tsx, matches.tsx — returns Match[] */
export async function listMatches(): Promise<Match[]> {
  const data = await get<{ matches: BackendMatch[] }>("/matches?type=all&limit=50");
  return (data.matches ?? []).map(transformMatch);
}

/** Used by: matches.$matchId.tsx — returns single Match */
export async function getMatch(matchId: string): Promise<Match | null> {
  // Backend has no single-match endpoint — fetch all and find by id
  const data = await get<{ matches: BackendMatch[] }>("/matches?type=all&limit=50");
  const found = (data.matches ?? []).find((m) => m.id === matchId);
  return found ? transformMatch(found) : null;
}

/** Used by: index.tsx, matches.$matchId.tsx — returns Prediction */
export async function getPrediction(matchId: string): Promise<Prediction | null> {
  // Fetch all matches to find the two teams
  const data = await get<{ matches: BackendMatch[] }>("/matches?type=all&limit=50");
  const match = (data.matches ?? []).find((m) => m.id === matchId);
  if (!match || match.status === "completed") return null;

  // Fetch venues to pick first one if needed
  const venues = await getCachedVenues();
  const venue = venues.find((v) => v.name === match.venue || v.id === match.venue);

  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      team_a: match.team1,
      team_b: match.team2,
      venue: venue?.name ?? match.venue,
      format: "T20",
      toss_winner: match.team1,
      toss_decision: "bat",
      is_day_night: true,
    }),
  });
  const pred: BackendPrediction = await res.json().catch(() => null);
  if (!pred || pred.status === "error") return null;

  return {
    predictedWinnerId: pred.winner,   // winner is the team name string
    probA: pred.prob_a,
    probB: pred.prob_b,
    source: "model",
    factors: pred.factors ?? [],
  };
}

/** Used by: teams.tsx */
// ── REPLACE these two functions in src/lib/api.ts ────────────────────────────

/** Used by: teams.tsx — list all franchises with squad count */
export async function listTeams(): Promise<Team[]> {
  const teamsData = await get<{ teams: BackendTeam[] }>("/teams");
  const teams = teamsData.teams ?? [];

  const playersData = await get<{ players: Player[] }>("/players").catch(
    () => ({ players: [] as Player[] })
  );
  const allPlayers = playersData.players ?? [];

  return teams.map((t) => {
    const canonName = canonicalTeam(t.name);
    const squad = allPlayers.filter(
      (p) => canonicalTeam(p.teamId) === canonName
    );
    return {
      id: canonName,
      name: canonName,
      shortName: shortName(canonName),
      city: t.city,
      squad,
      recentForm: [],
      rankingT20: 0,
    };
  });
}

/** Used by: teams.$teamId.tsx — single team with full squad */
export async function getTeam(teamId: string): Promise<Team | null> {
  const teamsData = await get<{ teams: BackendTeam[] }>("/teams");
  
  // First try to map team ID to full name
  const teamNameFromId = TEAM_ID_TO_NAME[teamId.toLowerCase()];
  const searchName = teamNameFromId || teamId;
  const canonId = canonicalTeam(searchName);

  const t = (teamsData.teams ?? []).find(
    (team) =>
      canonicalTeam(team.id) === canonId ||
      canonicalTeam(team.name) === canonId ||
      team.name.toLowerCase().replace(/ /g, "-") === canonId.toLowerCase() ||
      team.name === searchName
  );
  if (!t) return null;

  const canonName = canonicalTeam(t.name);

  const playersData = await get<{ players: Player[] }>(
    `/players?team=${encodeURIComponent(canonName)}`
  ).catch(() => ({ players: [] as Player[] }));

  return {
    id: canonName,
    name: canonName,
    shortName: shortName(canonName),
    city: t.city,
    squad: playersData.players ?? [],
    recentForm: [],
    rankingT20: 0,
  };
}

export async function listPlayers(search = "", team = ""): Promise<Player[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (team) params.set("team", team);
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await get<{ players: Player[] }>(`/players${query}`);
  return data.players ?? [];
}

/** Used by: players.$playerId.tsx */
export async function getPlayer(playerId: string): Promise<Player | null> {
  try {
    const data = await get<Player>(`/players/${playerId}`);
    return data ?? null;
  } catch {
    return null;
  }
}

/** Used by: stadiums.tsx, teams.$teamId.tsx */
export async function listStadiums(): Promise<Stadium[]> {
  const data = await get<{ venues: BackendVenue[] }>("/venues");
  return (data.venues ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    city: v.city,
    country: "India",
    capacity: v.capacity ?? 50000,
    pitch: "Good batting surface with even bounce.",
    notableMatches: [],
    imageUrl: undefined,
  }));
}

/** Used by: stadiums.$stadiumId.tsx, matches.$matchId.tsx */
export async function getStadium(stadiumId: string): Promise<Stadium | null> {
  const data = await get<{ venues: BackendVenue[] }>("/venues");
  const v = (data.venues ?? []).find((v) => v.id === stadiumId || v.name === stadiumId);
  if (!v) return null;
  return {
    id: v.id,
    name: v.name,
    city: v.city,
    country: "India",
    capacity: v.capacity ?? 50000,
    pitch: "Good batting surface with even bounce.",
    notableMatches: [],
    imageUrl: undefined,
  };
}

// ─── Predict (used directly by Predictor component) ──────────────────────────

export async function predictMatch(payload: {
  team_a: string;
  team_b: string;
  venue: string;
  format?: string;
  toss_winner?: string;
  toss_decision?: string;
  is_day_night?: boolean;
}): Promise<BackendPrediction> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.status === "error") {
    throw new Error(data?.message || "Prediction failed");
  }
  return data;
}

export async function getWeather(venue: string): Promise<any> {
  const res = await fetch(`${API_BASE}/weather/${encodeURIComponent(venue)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.status === "error") {
    throw new Error(data?.message || "Weather data not available");
  }
  return data;
}