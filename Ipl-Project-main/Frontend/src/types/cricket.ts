export type MatchStatus = "live" | "upcoming" | "completed";
export type MatchFormat = "T20" | "ODI" | "Test";

export interface TeamRef {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
}

export interface InningsScore {
  teamId: string;
  runs: number;
  wickets: number;
  overs: number;
  declared?: boolean;
}

export interface Match {
  id: string;
  status: MatchStatus;
  format: MatchFormat;
  series: string;
  startTime: string; // ISO
  venueId: string;
  teamA: TeamRef;
  teamB: TeamRef;
  innings: InningsScore[];
  summary?: string;
  result?: string;
  tossWinnerId?: string;
  tossDecision?: "bat" | "bowl";
  currentBatters?: { name: string; runs: number; balls: number }[];
  currentBowler?: { name: string; overs: number; maidens: number; runs: number; wickets: number };
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  rankingTest: number;
  rankingOdi: number;
  rankingT20: number;
  recentForm: ("W" | "L" | "N")[];
  squad: string[]; // player ids
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  role: "Batter" | "Bowler" | "All-rounder" | "Wicketkeeper";
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
  established: number;
  pitch: string;
  avgFirstInnings: number;
  notableMatches: string[];
  imageUrl: string;
}

export interface Prediction {
  matchId: string;
  predictedWinnerId: string;
  probA: number; // 0-1
  probB: number; // 0-1
  factors?: { label: string; weight: number }[]; // weight -1..1
  source: "model" | "fallback";
}
