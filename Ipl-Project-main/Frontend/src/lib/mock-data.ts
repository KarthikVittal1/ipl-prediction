import type { Match, Player, Stadium, Team } from "@/types/cricket";
import { TEAMS, teamRef } from "@/lib/team-logos";
import stadium1 from "@/assets/stadium-1.jpg";
import stadium2 from "@/assets/stadium-2.jpg";
import stadium3 from "@/assets/stadium-3.jpg";

export const SEASON = "IPL 2026";

export const STADIUMS: Stadium[] = [
  {
    id: "chepauk",
    name: "M. A. Chidambaram Stadium",
    city: "Chennai",
    country: "India",
    capacity: 50000,
    established: 1916,
    pitch: "Slow and low; assists spinners from the very first over.",
    avgFirstInnings: 168,
    notableMatches: ["IPL 2010 Final", "IPL 2011 Final", "IPL 2023 Final"],
    imageUrl: stadium1,
  },
  {
    id: "wankhede",
    name: "Wankhede Stadium",
    city: "Mumbai",
    country: "India",
    capacity: 33108,
    established: 1974,
    pitch: "True bounce, batting friendly; sea breeze aids swing under lights.",
    avgFirstInnings: 182,
    notableMatches: ["2011 ICC World Cup Final", "IPL 2024 Final"],
    imageUrl: stadium2,
  },
  {
    id: "chinnaswamy",
    name: "M. Chinnaswamy Stadium",
    city: "Bengaluru",
    country: "India",
    capacity: 40000,
    established: 1969,
    pitch: "Flat track, short straight boundaries — a batter's paradise.",
    avgFirstInnings: 195,
    notableMatches: ["IPL 2016 Qualifier 1", "RCB 263 vs Pune (2013)"],
    imageUrl: stadium3,
  },
  {
    id: "eden",
    name: "Eden Gardens",
    city: "Kolkata",
    country: "India",
    capacity: 68000,
    established: 1864,
    pitch: "Even bounce, dew makes chasing easier in the second innings.",
    avgFirstInnings: 175,
    notableMatches: ["IPL 2012 Final", "IPL 2024 Qualifier 1"],
    imageUrl: stadium1,
  },
  {
    id: "narendra",
    name: "Narendra Modi Stadium",
    city: "Ahmedabad",
    country: "India",
    capacity: 132000,
    established: 1983,
    pitch: "Two-paced surface; slower balls and cutters are effective.",
    avgFirstInnings: 172,
    notableMatches: ["IPL 2022 Final", "IPL 2023 Final"],
    imageUrl: stadium2,
  },
  {
    id: "kotla",
    name: "Arun Jaitley Stadium",
    city: "Delhi",
    country: "India",
    capacity: 41820,
    established: 1883,
    pitch: "Slow turner; spinners get grip throughout the match.",
    avgFirstInnings: 165,
    notableMatches: ["IPL 2008 vs RR", "IPL 2024 vs MI"],
    imageUrl: stadium3,
  },
  {
    id: "uppal",
    name: "Rajiv Gandhi International Stadium",
    city: "Hyderabad",
    country: "India",
    capacity: 55000,
    established: 2003,
    pitch: "True surface, good carry; high-scoring under lights.",
    avgFirstInnings: 178,
    notableMatches: ["IPL 2016 Final", "SRH 277 vs MI (2024)"],
    imageUrl: stadium1,
  },
  {
    id: "mohali",
    name: "PCA Stadium, Mohali",
    city: "Mohali",
    country: "India",
    capacity: 26000,
    established: 1993,
    pitch: "Bouncy surface aiding pacers; cool evenings = swing.",
    avgFirstInnings: 170,
    notableMatches: ["IPL 2014 Qualifier 2"],
    imageUrl: stadium2,
  },
  {
    id: "sawai",
    name: "Sawai Mansingh Stadium",
    city: "Jaipur",
    country: "India",
    capacity: 30000,
    established: 1969,
    pitch: "Even-paced, hot conditions slow the ball through the air.",
    avgFirstInnings: 173,
    notableMatches: ["IPL 2008 Final", "RR 217 vs DC (2022)"],
    imageUrl: stadium3,
  },
  {
    id: "ekana",
    name: "BRSABV Ekana Stadium",
    city: "Lucknow",
    country: "India",
    capacity: 50000,
    established: 2017,
    pitch: "Two-paced; a few overs of grip then opens up.",
    avgFirstInnings: 168,
    notableMatches: ["IPL 2023 vs CSK", "IPL 2024 vs RCB"],
    imageUrl: stadium1,
  },
];

export const PLAYERS: Player[] = [
  // CSK
  { id: "ms-dhoni", name: "MS Dhoni", teamId: "csk", role: "Wicketkeeper", battingStyle: "Right-hand bat", matches: 264, runs: 5243, battingAverage: 39.1, strikeRate: 137.5, hundreds: 0, fifties: 24, wickets: 0, recentScores: [37, 14, 28, 9, 22] },
  { id: "ruturaj-g", name: "Ruturaj Gaikwad", teamId: "csk", role: "Batter", battingStyle: "Right-hand bat", matches: 70, runs: 2380, battingAverage: 38.4, strikeRate: 137.0, hundreds: 1, fifties: 18, wickets: 0, recentScores: [62, 41, 88, 15, 53] },
  { id: "ravindra-j", name: "Ravindra Jadeja", teamId: "csk", role: "All-rounder", battingStyle: "Left-hand bat", bowlingStyle: "Slow left-arm orthodox", matches: 240, runs: 2986, battingAverage: 27.0, strikeRate: 132.1, hundreds: 0, fifties: 4, wickets: 157, bowlingAverage: 28.6, economy: 7.6, recentScores: [25, 18, 42, 11, 31] },
  // MI
  { id: "rohit-sharma", name: "Rohit Sharma", teamId: "mi", role: "Batter", battingStyle: "Right-hand bat", matches: 257, runs: 6628, battingAverage: 29.6, strikeRate: 130.6, hundreds: 1, fifties: 43, wickets: 15, recentScores: [54, 11, 92, 73, 31] },
  { id: "j-bumrah", name: "Jasprit Bumrah", teamId: "mi", role: "Bowler", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast", matches: 133, runs: 56, battingAverage: 5.6, strikeRate: 86.0, hundreds: 0, fifties: 0, wickets: 165, bowlingAverage: 22.4, economy: 7.3, recentScores: [3, 2, 4, 1, 5] },
  { id: "suryakumar-y", name: "Suryakumar Yadav", teamId: "mi", role: "Batter", battingStyle: "Right-hand bat", matches: 152, runs: 3389, battingAverage: 30.8, strikeRate: 144.8, hundreds: 2, fifties: 21, wickets: 0, recentScores: [73, 19, 56, 102, 8] },
  // RCB
  { id: "v-kohli", name: "Virat Kohli", teamId: "rcb", role: "Batter", battingStyle: "Right-hand bat", matches: 252, runs: 8004, battingAverage: 38.7, strikeRate: 132.0, hundreds: 8, fifties: 55, wickets: 4, recentScores: [82, 47, 113, 21, 76] },
  { id: "fdk-plessis", name: "Faf du Plessis", teamId: "rcb", role: "Batter", battingStyle: "Right-hand bat", matches: 145, runs: 4571, battingAverage: 35.3, strikeRate: 134.6, hundreds: 1, fifties: 36, wickets: 0, recentScores: [44, 67, 12, 89, 33] },
  { id: "m-siraj", name: "Mohammed Siraj", teamId: "rcb", role: "Bowler", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast", matches: 93, runs: 49, battingAverage: 4.5, strikeRate: 79.0, hundreds: 0, fifties: 0, wickets: 95, bowlingAverage: 28.5, economy: 8.7, recentScores: [2, 3, 1, 4, 2] },
  // KKR
  { id: "sk-rana", name: "Shreyas Iyer", teamId: "kkr", role: "Batter", battingStyle: "Right-hand bat", matches: 115, runs: 3127, battingAverage: 32.6, strikeRate: 127.4, hundreds: 0, fifties: 22, wickets: 0, recentScores: [58, 33, 71, 14, 49] },
  { id: "a-russell", name: "Andre Russell", teamId: "kkr", role: "All-rounder", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm fast-medium", matches: 130, runs: 2556, battingAverage: 29.3, strikeRate: 177.9, hundreds: 0, fifties: 9, wickets: 119, bowlingAverage: 26.1, economy: 9.1, recentScores: [42, 18, 64, 7, 35] },
  { id: "sn-narine", name: "Sunil Narine", teamId: "kkr", role: "All-rounder", battingStyle: "Left-hand bat", bowlingStyle: "Right-arm off-break", matches: 178, runs: 1534, battingAverage: 16.1, strikeRate: 167.0, hundreds: 1, fifties: 6, wickets: 187, bowlingAverage: 25.4, economy: 6.7, recentScores: [56, 24, 18, 71, 32] },
  // DC
  { id: "rishabh-p", name: "Rishabh Pant", teamId: "dc", role: "Wicketkeeper", battingStyle: "Left-hand bat", matches: 113, runs: 3284, battingAverage: 35.7, strikeRate: 148.9, hundreds: 1, fifties: 18, wickets: 0, recentScores: [55, 29, 88, 14, 47] },
  { id: "ka-axar", name: "Axar Patel", teamId: "dc", role: "All-rounder", battingStyle: "Left-hand bat", bowlingStyle: "Slow left-arm orthodox", matches: 156, runs: 1500, battingAverage: 22.7, strikeRate: 132.0, hundreds: 0, fifties: 1, wickets: 117, bowlingAverage: 28.3, economy: 7.4, recentScores: [21, 14, 32, 8, 17] },
  // SRH
  { id: "h-klaasen", name: "Heinrich Klaasen", teamId: "srh", role: "Wicketkeeper", battingStyle: "Right-hand bat", matches: 38, runs: 1289, battingAverage: 41.5, strikeRate: 175.2, hundreds: 1, fifties: 9, wickets: 0, recentScores: [80, 12, 47, 65, 33] },
  { id: "tr-head", name: "Travis Head", teamId: "srh", role: "Batter", battingStyle: "Left-hand bat", matches: 24, runs: 956, battingAverage: 41.6, strikeRate: 191.5, hundreds: 1, fifties: 6, wickets: 0, recentScores: [89, 32, 65, 27, 102] },
  // PBKS
  { id: "sh-dhawan", name: "Shikhar Dhawan", teamId: "pbks", role: "Batter", battingStyle: "Left-hand bat", matches: 222, runs: 6769, battingAverage: 35.3, strikeRate: 127.1, hundreds: 2, fifties: 51, wickets: 0, recentScores: [44, 67, 12, 33, 51] },
  { id: "ar-arshdeep", name: "Arshdeep Singh", teamId: "pbks", role: "Bowler", battingStyle: "Left-hand bat", bowlingStyle: "Left-arm fast-medium", matches: 65, runs: 38, battingAverage: 4.2, strikeRate: 60.0, hundreds: 0, fifties: 0, wickets: 76, bowlingAverage: 27.5, economy: 8.6, recentScores: [3, 2, 1, 4, 2] },
  // RR
  { id: "ja-buttler", name: "Jos Buttler", teamId: "rr", role: "Wicketkeeper", battingStyle: "Right-hand bat", matches: 90, runs: 3315, battingAverage: 39.5, strikeRate: 149.4, hundreds: 7, fifties: 19, wickets: 0, recentScores: [65, 22, 91, 33, 47] },
  { id: "y-jaiswal", name: "Yashasvi Jaiswal", teamId: "rr", role: "Batter", battingStyle: "Left-hand bat", matches: 48, runs: 1845, battingAverage: 41.0, strikeRate: 156.2, hundreds: 1, fifties: 13, wickets: 0, recentScores: [98, 31, 47, 68, 14] },
  // GT
  { id: "sh-gill", name: "Shubman Gill", teamId: "gt", role: "Batter", battingStyle: "Right-hand bat", matches: 100, runs: 3260, battingAverage: 39.8, strikeRate: 137.6, hundreds: 4, fifties: 21, wickets: 0, recentScores: [62, 41, 88, 15, 53] },
  { id: "r-rashid", name: "Rashid Khan", teamId: "gt", role: "All-rounder", battingStyle: "Right-hand bat", bowlingStyle: "Right-arm leg-break", matches: 109, runs: 587, battingAverage: 13.3, strikeRate: 146.0, hundreds: 0, fifties: 0, wickets: 139, bowlingAverage: 22.0, economy: 6.8, recentScores: [12, 22, 8, 31, 15] },
  // LSG
  { id: "kl-rahul", name: "KL Rahul", teamId: "lsg", role: "Wicketkeeper", battingStyle: "Right-hand bat", matches: 132, runs: 4683, battingAverage: 46.4, strikeRate: 135.6, hundreds: 4, fifties: 38, wickets: 0, recentScores: [54, 71, 18, 42, 96] },
  { id: "ni-pooran", name: "Nicholas Pooran", teamId: "lsg", role: "Wicketkeeper", battingStyle: "Left-hand bat", matches: 71, runs: 1798, battingAverage: 30.0, strikeRate: 159.7, hundreds: 0, fifties: 8, wickets: 0, recentScores: [73, 19, 56, 102, 8] },
];

export const TEAMS_DATA: Team[] = Object.values(TEAMS).map((t, i) => ({
  id: t.id,
  name: t.name,
  shortName: t.shortName,
  logoUrl: t.logoUrl,
  rankingTest: 0,
  rankingOdi: 0,
  rankingT20: i + 1,
  recentForm: ([
    ["W", "W", "L", "W", "L"],
    ["W", "L", "W", "W", "W"],
    ["L", "W", "W", "L", "W"],
    ["W", "W", "L", "L", "W"],
    ["L", "L", "W", "W", "L"],
    ["W", "L", "L", "W", "W"],
    ["L", "W", "L", "W", "L"],
    ["W", "W", "W", "L", "W"],
    ["L", "W", "W", "W", "L"],
    ["W", "L", "W", "L", "W"],
  ][i] as ("W" | "L")[]) ?? ["W", "L", "W", "L", "W"],
  squad: PLAYERS.filter((p) => p.teamId === t.id).map((p) => p.id),
}));

const now = Date.now();
const hours = (n: number) => new Date(now + n * 3600 * 1000).toISOString();

export const MATCHES: Match[] = [
  {
    id: "m-001",
    status: "live",
    format: "T20",
    series: SEASON,
    startTime: hours(-2),
    venueId: "chepauk",
    teamA: teamRef("csk"),
    teamB: teamRef("rcb"),
    innings: [
      { teamId: "csk", runs: 187, wickets: 5, overs: 20 },
      { teamId: "rcb", runs: 142, wickets: 4, overs: 14.3 },
    ],
    summary: "RCB need 46 from 33 balls",
    tossWinnerId: "rcb",
    tossDecision: "bowl",
    currentBatters: [
      { name: "Virat Kohli", runs: 72, balls: 49 },
      { name: "Faf du Plessis", runs: 38, balls: 27 },
    ],
    currentBowler: { name: "Ravindra Jadeja", overs: 2.3, maidens: 0, runs: 19, wickets: 1 },
  },
  {
    id: "m-002",
    status: "live",
    format: "T20",
    series: SEASON,
    startTime: hours(-1),
    venueId: "wankhede",
    teamA: teamRef("mi"),
    teamB: teamRef("kkr"),
    innings: [
      { teamId: "mi", runs: 96, wickets: 2, overs: 11.4 },
    ],
    summary: "Mumbai Indians 96/2 (11.4 ov)",
    tossWinnerId: "kkr",
    tossDecision: "bowl",
    currentBatters: [
      { name: "Rohit Sharma", runs: 47, balls: 32 },
      { name: "Suryakumar Yadav", runs: 31, balls: 18 },
    ],
    currentBowler: { name: "Sunil Narine", overs: 2.4, maidens: 0, runs: 21, wickets: 1 },
  },
  {
    id: "m-003",
    status: "upcoming",
    format: "T20",
    series: SEASON,
    startTime: hours(20),
    venueId: "narendra",
    teamA: teamRef("gt"),
    teamB: teamRef("dc"),
    innings: [],
  },
  {
    id: "m-004",
    status: "upcoming",
    format: "T20",
    series: SEASON,
    startTime: hours(28),
    venueId: "ekana",
    teamA: teamRef("lsg"),
    teamB: teamRef("rr"),
    innings: [],
  },
  {
    id: "m-005",
    status: "upcoming",
    format: "T20",
    series: SEASON,
    startTime: hours(44),
    venueId: "uppal",
    teamA: teamRef("srh"),
    teamB: teamRef("pbks"),
    innings: [],
  },
  {
    id: "m-006",
    status: "upcoming",
    format: "T20",
    series: SEASON,
    startTime: hours(52),
    venueId: "chinnaswamy",
    teamA: teamRef("rcb"),
    teamB: teamRef("mi"),
    innings: [],
  },
  {
    id: "m-007",
    status: "completed",
    format: "T20",
    series: SEASON,
    startTime: hours(-26),
    venueId: "eden",
    teamA: teamRef("kkr"),
    teamB: teamRef("srh"),
    innings: [
      { teamId: "kkr", runs: 201, wickets: 4, overs: 20 },
      { teamId: "srh", runs: 178, wickets: 9, overs: 20 },
    ],
    result: "KKR won by 23 runs",
  },
  {
    id: "m-008",
    status: "completed",
    format: "T20",
    series: SEASON,
    startTime: hours(-50),
    venueId: "sawai",
    teamA: teamRef("rr"),
    teamB: teamRef("csk"),
    innings: [
      { teamId: "csk", runs: 174, wickets: 6, overs: 20 },
      { teamId: "rr", runs: 175, wickets: 4, overs: 19.1 },
    ],
    result: "Rajasthan Royals won by 6 wickets",
  },
];

// Simple points table derived from mock match outcomes (illustrative).
export interface PointsRow {
  teamId: string;
  played: number;
  won: number;
  lost: number;
  nrr: number;
  points: number;
}

export const POINTS_TABLE: PointsRow[] = [
  { teamId: "kkr", played: 8, won: 6, lost: 2, nrr: 1.24, points: 12 },
  { teamId: "rr", played: 8, won: 6, lost: 2, nrr: 0.91, points: 12 },
  { teamId: "csk", played: 8, won: 5, lost: 3, nrr: 0.42, points: 10 },
  { teamId: "rcb", played: 8, won: 5, lost: 3, nrr: 0.31, points: 10 },
  { teamId: "mi", played: 8, won: 4, lost: 4, nrr: 0.08, points: 8 },
  { teamId: "gt", played: 8, won: 4, lost: 4, nrr: -0.05, points: 8 },
  { teamId: "lsg", played: 8, won: 4, lost: 4, nrr: -0.18, points: 8 },
  { teamId: "srh", played: 8, won: 3, lost: 5, nrr: -0.27, points: 6 },
  { teamId: "dc", played: 8, won: 2, lost: 6, nrr: -0.71, points: 4 },
  { teamId: "pbks", played: 8, won: 1, lost: 7, nrr: -1.05, points: 2 },
];

export const findMatch = (id: string) => MATCHES.find((m) => m.id === id);
export const findTeam = (id: string) => TEAMS_DATA.find((t) => t.id === id);
export const findPlayer = (id: string) => PLAYERS.find((p) => p.id === id);
export const findStadium = (id: string) => STADIUMS.find((s) => s.id === id);
