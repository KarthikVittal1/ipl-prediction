# Backend/app.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
import requests
import os
import logging
from typing import Optional, List, Dict
from dotenv import load_dotenv
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CrickPredict - IPL 2026", version="1.0")

# CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return {
        "status": "error",
        "message": str(exc),
        "type": type(exc).__name__
    }

# ====================== CONFIG ======================
CRICKET_API_KEY = os.getenv("CRICKET_API_KEY")
CRICKET_BASE_URL = "https://api.cricapi.com/v1"
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")
WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

MODEL_DIR = os.path.join(os.path.dirname(__file__),"model")

# Team logos mapping
TEAM_LOGOS = {
    "Chennai Super Kings": "https://bcci.tv/images/teams/CSK_Logo.png",
    "Mumbai Indians": "https://bcci.tv/images/teams/MI_Logo.png",
    "Royal Challengers Bengaluru": "https://bcci.tv/images/teams/RCB_Logo.png",
    "Kolkata Knight Riders": "https://bcci.tv/images/teams/KKR_Logo.png",
    "Delhi Capitals": "https://bcci.tv/images/teams/DC_Logo.png",
    "Sunrisers Hyderabad": "https://bcci.tv/images/teams/SRH_Logo.png",
    "Punjab Kings": "https://bcci.tv/images/teams/PBKS_Logo.png",
    "Rajasthan Royals": "https://bcci.tv/images/teams/RR_Logo.png",
    "Gujarat Titans": "https://bcci.tv/images/teams/GT_Logo.png",
    "Lucknow Super Giants": "https://bcci.tv/images/teams/LSG_Logo.png",
}

# Load ML Model & Data
try:
    clf_pre = joblib.load(os.path.join(MODEL_DIR, "ipl_clf_pre.pkl"))
    sc_pre = joblib.load(os.path.join(MODEL_DIR, "ipl_scaler_pre.pkl"))
    le_team = joblib.load(os.path.join(MODEL_DIR, "ipl_le_team.pkl"))
    le_venue = joblib.load(os.path.join(MODEL_DIR, "ipl_le_venue.pkl"))
    win_rate_map = joblib.load(os.path.join(MODEL_DIR, "ipl_win_rate.pkl"))
    season_wr = joblib.load(os.path.join(MODEL_DIR, "ipl_season_wr.pkl"))
    venue_wr = joblib.load(os.path.join(MODEL_DIR, "ipl_venue_wr.pkl"))
    matches_df = joblib.load(os.path.join(MODEL_DIR, "ipl_matches_processed.pkl"))
    
    print("Data and Models Loaded Successfully!")
except Exception as e:
    print(f" Data loading error: {e}")
    # Set all to None if loading fails - use fallback logic
    clf_pre = None
    sc_pre = None
    le_team = None
    le_venue = None
    win_rate_map = {}
    season_wr = {}
    venue_wr = {}
    matches_df = None
    print("Using fallback mode - ML models not available")

# ====================== PYDANTIC MODELS ======================
class PredictRequest(BaseModel):
    team_a: str
    team_b: str
    venue: str
    format: Optional[str] = "T20"
    toss_winner: Optional[str] = None
    toss_decision: str = "bat"
    is_day_night: bool = True

class LiveMatchRequest(BaseModel):
    match_id: str

class ModelUploadRequest(BaseModel):
    model_type: str  # "pre_match", "live", "top_scorer", "top_wicket"
    model_file: Optional[str] = None

# ====================== HELPER FUNCTIONS ======================
def call_cricket_api(endpoint: str, params: dict = None):
    if not CRICKET_API_KEY:
        logger.error("CRICKET_API_KEY is None!")  # Add this
        return {"status": "error", "message": "API key not configured"}
    try:
        url = f"{CRICKET_BASE_URL}/{endpoint}"
        resp = requests.get(url, params={"apikey": CRICKET_API_KEY, **(params or {})}, timeout=10)
        logger.info(f"CricAPI {endpoint} → {resp.status_code}: {resp.text[:200]}")  # Add this
        return resp.json()
    except Exception as e:
        logger.warning(f"External cricket API failed: {e}")
        return {"status": "error", "message": "External API failed"}

def get_weather_for_venue(venue: str) -> dict:
    """Get weather data for a venue using OpenWeatherMap API"""
    if not WEATHER_API_KEY:
        return {"status": "error", "message": "Weather API key not configured"}
    
    # Map common Indian venues to coordinates
    venue_coordinates = {
        "Mumbai": {"lat": 19.0760, "lon": 72.8777},
        "Chennai": {"lat": 13.0827, "lon": 80.2707},
        "Bengaluru": {"lat": 12.9716, "lon": 77.5946},
        "Kolkata": {"lat": 22.5726, "lon": 88.3639},
        "Delhi": {"lat": 28.7041, "lon": 77.1025},
        "Hyderabad": {"lat": 17.3850, "lon": 78.4867},
        "Chandigarh": {"lat": 30.7333, "lon": 76.7794},
        "Jaipur": {"lat": 26.9124, "lon": 75.7873},
        "Ahmedabad": {"lat": 23.0225, "lon": 72.5714},
        "Lucknow": {"lat": 26.8467, "lon": 80.9462},
        "Guwahati": {"lat": 26.1445, "lon": 91.7362},
        "Dharamsala": {"lat": 32.2190, "lon": 76.3234},
        "Pune": {"lat": 18.5204, "lon": 73.8567},
        "Bangalore": {"lat": 12.9716, "lon": 77.5946},
        "M. Chinnaswamy Stadium": {"lat": 12.9716, "lon": 77.5946},
        "Wankhede Stadium": {"lat": 19.0760, "lon": 72.8777},
        "Eden Gardens": {"lat": 22.5726, "lon": 88.3639},
        "MA Chidambaram Stadium": {"lat": 13.0827, "lon": 80.2707},
        "Arun Jaitley Stadium": {"lat": 28.7041, "lon": 77.1025},
        "Rajiv Gandhi International Stadium": {"lat": 17.3850, "lon": 78.4867},
    }
    
    # Try to find coordinates for the venue
    coords = None
    for venue_name, coord in venue_coordinates.items():
        if venue_name.lower() in venue.lower():
            coords = coord
            break
    
    if not coords:
        return {"status": "error", "message": "Venue coordinates not found"}
    
    try:
        url = f"{WEATHER_BASE_URL}/weather"
        params = {
            "lat": coords["lat"],
            "lon": coords["lon"],
            "appid": WEATHER_API_KEY,
            "units": "metric"
        }
        resp = requests.get(url, params=params, timeout=10)
        data = resp.json()
        
        if resp.status_code == 200:
            return {
                "status": "success",
                "temperature": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "weather": data["weather"][0]["main"],
                "description": data["weather"][0]["description"],
                "wind_speed": data["wind"]["speed"],
                "pressure": data["main"]["pressure"],
                "visibility": data.get("visibility", 0) / 1000,  # Convert to km
                "coordinates": coords
            }
        else:
            return {"status": "error", "message": "Weather data not available"}
    except Exception as e:
        logger.warning(f"Weather API failed for {venue}: {e}")
        return {"status": "error", "message": "Weather API failed"}

def normalize_external_match(match: dict) -> Optional[dict]:
    teams = match.get("teams") or []
    team1 = teams[0] if len(teams) > 0 else match.get("team1") or "TBD"
    team2 = teams[1] if len(teams) > 1 else match.get("team2") or "TBD"
    status_text = str(match.get("status") or "").lower()
    match_started = bool(match.get("matchStarted"))
    match_ended = bool(match.get("matchEnded"))

    if match_ended or "won" in status_text or "no result" in status_text:
        status = "completed"
    elif match_started or "live" in status_text or "yet to bat" in status_text:
        # "yet to bat" means match has started (toss done), treat as live
        status = "live"
    else:
        status = "upcoming"

    # Parse score array from cricapi: [{"r": runs, "w": wickets, "o": overs, "inning": "Team Name Inning 1"}]
    score_raw = match.get("score") or []
    scores = {}
    for s in score_raw:
        inning = s.get("inning", "")
        team_name = inning.replace(" Inning 1", "").replace(" Inning 2", "").strip()
        inning_num = 2 if "Inning 2" in inning else 1
        r = s.get("r", 0)
        w = s.get("w", 0)
        o = s.get("o", 0)
        score_str = f"{r}/{w} ({o} ov)"
        scores[team_name] = {"score": score_str, "runs": r, "wickets": w, "overs": o, "inning": inning_num}

    team1_score = scores.get(team1, {}).get("score", "Yet to bat")
    team2_score = scores.get(team2, {}).get("score", "Yet to bat")

    return {
        "id": str(match.get("id") or match.get("unique_id") or f"{team1}-{team2}-{match.get('dateTimeGMT', '')}"),
        "team1": team1,
        "team2": team2,
        "date": str(match.get("dateTimeGMT") or match.get("date") or ""),
        "venue": match.get("venue") or "TBD",
        "status": status,
        "winner": match.get("winner") or None,
        "team1Score": team1_score,
        "team2Score": team2_score,
        "scoreRaw": score_raw,
        "statusText": match.get("status") or "",
        "tossWinner": match.get("tossWinner") or "",
        "tossChoice": match.get("tossChoice") or "",
    }

def get_external_matches(limit: int = 20) -> List[dict]:
    payload = call_cricket_api("matches", {"offset": 0})
    if payload.get("status") == "error" or not isinstance(payload.get("data"), list):
        return []

    ipl_keywords = ["ipl", "indian premier league"]
    ipl_matches = []
    for match in payload["data"]:
        series = str(match.get("series") or match.get("seriesName") or "")
        name = str(match.get("name") or "")
        combined = f"{name} {series}".lower()
        if any(kw in combined for kw in ipl_keywords):
            normalized = normalize_external_match(match)
            if normalized:
                ipl_matches.append(normalized)

    return ipl_matches[:limit]


def get_external_live_matches() -> List[dict]:
    """Fetch live IPL matches with full score data from cricapi."""
    payload = call_cricket_api("matches", {"offset": 0})
    if payload.get("status") == "error" or not isinstance(payload.get("data"), list):
        return []

    ipl_keywords = ["ipl", "indian premier league"]
    live = []
    for match in payload["data"]:
        series = str(match.get("series") or match.get("seriesName") or "")
        name = str(match.get("name") or "")
        combined = f"{name} {series}".lower()
        if not any(kw in combined for kw in ipl_keywords):
            continue

        match_started = bool(match.get("matchStarted"))
        match_ended = bool(match.get("matchEnded"))
        if not match_started or match_ended:
            continue

        teams = match.get("teams") or []
        team1 = teams[0] if len(teams) > 0 else "TBD"
        team2 = teams[1] if len(teams) > 1 else "TBD"

        score_raw = match.get("score") or []
        scores = {}
        for s in score_raw:
            inning = s.get("inning", "")
            tname = inning.replace(" Inning 1", "").replace(" Inning 2", "").strip()
            scores[tname] = f"{s.get('r', 0)}/{s.get('w', 0)} ({s.get('o', 0)} ov)"

        live.append({
            "id": str(match.get("id") or f"{team1}-{team2}"),
            "name": match.get("name") or f"{team1} vs {team2}",
            "matchType": match.get("matchType") or "T20",
            "status": "live",
            "statusText": match.get("status") or "",
            "venue": match.get("venue") or "TBD",
            "date": str(match.get("dateTimeGMT") or match.get("date") or ""),
            "dateTimeGMT": str(match.get("dateTimeGMT") or ""),
            "teams": teams,
            "teamInfo": match.get("teamInfo") or [],
            "tossWinner": match.get("tossWinner") or "",
            "tossChoice": match.get("tossChoice") or "",
            "team1Score": scores.get(team1, "Yet to bat"),
            "team2Score": scores.get(team2, "Yet to bat"),
            "scoreRaw": score_raw,
            "series": series,
        })
    return live

# ====================== TEAM NAME NORMALISATION ======================
# matches_df may store older/alternate spellings. This map converts any
# known variant → the canonical name used throughout IPL_SQUAD.
_TEAM_ALIASES: Dict[str, str] = {
    # RCB variants
    "royal challengers bangalore":  "Royal Challengers Bengaluru",
    "royal challengers bengalore":  "Royal Challengers Bengaluru",
    "royal challengers bengaluru":  "Royal Challengers Bengaluru",
    # add more here if matches_df uses other old names
    "rising pune supergiants":      "Rising Pune Supergiants",
    "rising pune supergiant":       "Rising Pune Supergiants",
    "delhi daredevils":             "Delhi Capitals",
    "kings xi punjab":              "Punjab Kings",
    "deccan chargers":              "Deccan Chargers",
}

def canonical_team(name: str) -> str:
    """Return the canonical squad name for any known alias, else return as-is."""
    return _TEAM_ALIASES.get(str(name).strip().lower(), str(name).strip())

# ====================== ROUTES ======================
@app.get("/")
async def home():
    teams = []
    if matches_df is not None:
        teams = sorted(set(matches_df['team1'].dropna().unique()) | set(matches_df['team2'].dropna().unique()))
    else:
        # Fallback teams list
        teams = [
            "Chennai Super Kings", "Mumbai Indians", "Royal Challengers Bengaluru",
            "Kolkata Knight Riders", "Delhi Capitals", "Sunrisers Hyderabad",
            "Punjab Kings", "Rajasthan Royals", "Gujarat Titans", "Lucknow Super Giants"
        ]
    return {
        "status": "success",
        "message": "CrickPredict IPL 2026 API is Live 🚀",
        "teams": teams,
        "matches": [],
        "venues": [],
        "players": []
    }

@app.get("/teams")
async def get_teams():
    try:
        # Define IPL teams with proper IDs and names (matching frontend team-logos.ts)
        ipl_teams = [
            {"id": "csk", "name": "Chennai Super Kings", "city": "Chennai"},
            {"id": "mi", "name": "Mumbai Indians", "city": "Mumbai"},
            {"id": "rcb", "name": "Royal Challengers Bengaluru", "city": "Bengaluru"},
            {"id": "kkr", "name": "Kolkata Knight Riders", "city": "Kolkata"},
            {"id": "dc", "name": "Delhi Capitals", "city": "Delhi"},
            {"id": "srh", "name": "Sunrisers Hyderabad", "city": "Hyderabad"},
            {"id": "pbks", "name": "Punjab Kings", "city": "Mohali"},
            {"id": "rr", "name": "Rajasthan Royals", "city": "Jaipur"},
            {"id": "gt", "name": "Gujarat Titans", "city": "Ahmedabad"},
            {"id": "lsg", "name": "Lucknow Super Giants", "city": "Lucknow"},
        ]
        
        # Also include teams from matches dataframe to ensure compatibility
        raw_teams = []
        if matches_df is not None:
            raw_teams = sorted(set(matches_df['team1'].dropna().unique()) |
                               set(matches_df['team2'].dropna().unique()))
        
        seen: set = set()
        team_list = []
        
        # Add predefined IPL teams first
        for team in ipl_teams:
            team_list.append(team)
            seen.add(team["name"])
            seen.add(team["id"])
        
        # Add any additional teams from matches
        for t in raw_teams:
            if not isinstance(t, str):
                continue
            canon = canonical_team(t)
            if canon in seen:
                continue
            seen.add(canon)
            team_list.append({"id": canon.lower().replace(" ", "-"), "name": canon, "city": canon})
        
        team_list.sort(key=lambda x: x["name"])
        return {"teams": team_list}
    except Exception as e:
        return {"teams": [], "error": str(e)}

@app.get("/venues")
async def get_venues():
    try:
        venues = []
        if matches_df is not None:
            venues = sorted(matches_df['venue'].dropna().unique())
        else:
            # Fallback venues list
            venues = [
                "M. Chinnaswamy Stadium",
                "Wankhede Stadium",
                "Eden Gardens",
                "MA Chidambaram Stadium",
                "Arun Jaitley Stadium",
                "Rajiv Gandhi International Stadium",
                "PCA Stadium",
                "Sawai Mansingh Stadium",
                "Narendra Modi Stadium",
                "Ekana Cricket Stadium"
            ]
        venue_list = [{"id": v, "name": v, "city": v, "capacity": 50000} for v in venues if isinstance(v, str)]
        return {"venues": venue_list}
    except Exception as e:
        return {"venues": [], "error": str(e)}

@app.get("/weather/{venue}")
async def get_weather(venue: str):
    """Get weather data for a specific venue"""
    try:
        weather_data = get_weather_for_venue(venue)
        return weather_data
    except Exception as e:
        logger.error(f"Weather endpoint error: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.get("/matches")
async def get_matches(type: str = "all", limit: int = 20):
    """type: all, upcoming, live, completed"""
    try:
        # Try live API first
        api_matches = get_external_matches(limit * 2)
        if api_matches:
            if type != "all":
                api_matches = [m for m in api_matches if m["status"] == type]
            return {"matches": api_matches[:limit], "source": "api"}

        # API returned nothing — return empty so frontend doesn't show stale data
        return {
            "matches": [],
            "source": "fallback",
            "message": "Cricket API unavailable. No match data to display."
        }
    except Exception as e:
        return {"matches": [], "error": str(e)}

@app.get("/points-table")
async def get_points_table(season: int = 2026):
    try:
        if matches_df is not None and 'season' in matches_df.columns:
            df = matches_df[matches_df['season'] == season].copy()
            
            if len(df) == 0:
                df = matches_df.copy()
        else:
            # Fallback: return empty points table with error
            return {"season": season, "standings": [], "error": "No match data available"}
        
        points = {}
        for _, row in df.iterrows():
            winner = row.get('winner')
            if pd.notna(winner):
                if winner not in points:
                    points[winner] = {"matches": 0, "won": 0, "lost": 0, "points": 0, "nrr": 0.0}
                points[winner]["matches"] += 1
                points[winner]["won"] += 1
                points[winner]["points"] += 2
            else:
                # Tie or no result - both teams get 1 point
                t1 = row.get('team1')
                t2 = row.get('team2')
                if pd.notna(t1):
                    if t1 not in points:
                        points[t1] = {"matches": 0, "won": 0, "lost": 0, "points": 0, "nrr": 0.0}
                    points[t1]["matches"] += 1
                    points[t1]["points"] += 1
                if pd.notna(t2):
                    if t2 not in points:
                        points[t2] = {"matches": 0, "won": 0, "lost": 0, "points": 0, "nrr": 0.0}
                    points[t2]["matches"] += 1
                    points[t2]["points"] += 1
        
        # Calculate lost and NRR (simplified)
        for team in points:
            points[team]["lost"] = points[team]["matches"] - points[team]["won"]
            points[team]["nrr"] = 0.0  # Simplified, would need actual runs data
        
        standings = [
            {
                "position": i + 1,
                "team": team,
                "matches": stats["matches"],
                "won": stats["won"],
                "lost": stats["lost"],
                "points": stats["points"],
                "nrr": stats["nrr"]
            }
            for i, (team, stats) in enumerate(sorted(points.items(), key=lambda x: (-x[1]["points"], -x[1]["nrr"])))
        ]
        return {"season": season, "standings": standings}
    except Exception as e:
        # Return fallback standings on error
        fallback_standings = [
            {"teamId": "kkr", "teamName": "Kolkata Knight Riders", "played": 12, "won": 9, "lost": 3, "points": 18, "nrr": 1.245},
            {"teamId": "rr", "teamName": "Rajasthan Royals", "played": 12, "won": 8, "lost": 4, "points": 16, "nrr": 0.987},
            {"teamId": "csk", "teamName": "Chennai Super Kings", "played": 11, "won": 7, "lost": 4, "points": 14, "nrr": 0.756},
            {"teamId": "gt", "teamName": "Gujarat Titans", "played": 11, "won": 7, "lost": 4, "points": 14, "nrr": 0.632},
            {"teamId": "srh", "teamName": "Sunrisers Hyderabad", "played": 12, "won": 6, "lost": 6, "points": 12, "nrr": 0.421},
            {"teamId": "lsg", "teamName": "Lucknow Super Giants", "played": 11, "won": 6, "lost": 5, "points": 12, "nrr": 0.234},
            {"teamId": "dc", "teamName": "Delhi Capitals", "played": 12, "won": 5, "lost": 7, "points": 10, "nrr": -0.123},
            {"teamId": "pbks", "teamName": "Punjab Kings", "played": 11, "won": 5, "lost": 6, "points": 10, "nrr": -0.345},
            {"teamId": "mi", "teamName": "Mumbai Indians", "played": 12, "won": 4, "lost": 8, "points": 8, "nrr": -0.567},
            {"teamId": "rcb", "teamName": "Royal Challengers Bengaluru", "played": 11, "won": 4, "lost": 7, "points": 8, "nrr": -0.789},
        ]
        return {"season": season, "standings": fallback_standings, "error": str(e)}

# ====================== LIVE MATCH DATA ======================
@app.get("/live-matches")
async def get_live_matches():
    """Get all currently live IPL matches"""
    try:
        # Try real API first
        live = get_external_live_matches()
        if live:
            return {"matches": live, "source": "api"}

        # No live matches right now
        return {"matches": [], "source": "api", "message": "No IPL matches currently live."}
    except Exception as e:
        logger.error(f"Error fetching live matches: {e}")
        return {"matches": [], "error": str(e)}

@app.get("/live-scorecard/{match_id}")
async def get_live_scorecard(match_id: str):
    """Get detailed live scorecard for a specific match"""
    try:
        # Try to fetch from API
        api_data = call_cricket_api("match_info", {"id": match_id})
        
        if api_data.get("status") == "success" and "data" in api_data:
            return api_data["data"]
        
        # Fallback mock scorecard
        mock_scorecard = {
            "matchId": match_id,
            "status": "live",
            "tossWinner": "Chennai Super Kings",
            "tossChoice": "bat",
            "venue": "MA Chidambaram Stadium, Chennai",
            "team1": {
                "name": "Chennai Super Kings",
                "logo": TEAM_LOGOS.get("Chennai Super Kings"),
                "score": "145/3",
                "overs": "15.2",
                "runRate": 9.48,
                "players": [
                    {"name": "Ruturaj Gaikwad", "runs": 45, "balls": 32, "fours": 6, "sixes": 2, "status": "batting"},
                    {"name": "MS Dhoni", "runs": 12, "balls": 8, "fours": 1, "sixes": 1, "status": "batting"},
                    {"name": "Ravindra Jadeja", "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "status": "yet to bat"},
                ]
            },
            "team2": {
                "name": "Mumbai Indians",
                "logo": TEAM_LOGOS.get("Mumbai Indians"),
                "score": "0/0",
                "overs": "0.0",
                "runRate": 0.0,
                "players": []
            },
            "currentPartnership": {
                "runs": 15,
                "balls": 12,
                "batsmen": ["Ruturaj Gaikwad", "MS Dhoni"]
            },
            "recentBalls": ["4", "1", "6", "0", "2", "W", "4", "1"],
            "requiredRunRate": 9.6,
            "projectedScore": 182
        }
        return mock_scorecard
    except Exception as e:
        logger.error(f"Error fetching scorecard: {e}")
        return {"error": str(e)}

@app.post("/live-predict")
async def live_predict(request: LiveMatchRequest):
    """Get real-time prediction for a live match based on current state"""
    try:
        # Fetch live scorecard
        scorecard = await get_live_scorecard(request.match_id)
        
        if "error" in scorecard:
            return {"status": "error", "message": "Could not fetch match data"}
        
        # Calculate live prediction based on current match state
        team1_score = int(scorecard.get("team1", {}).get("score", "0/0").split("/")[0])
        team1_wickets = int(scorecard.get("team1", {}).get("score", "0/0").split("/")[1])
        team1_overs = float(scorecard.get("team1", {}).get("overs", "0"))
        
        team2_score = int(scorecard.get("team2", {}).get("score", "0/0").split("/")[0])
        team2_wickets = int(scorecard.get("team2", {}).get("score", "0/0").split("/")[1])
        team2_overs = float(scorecard.get("team2", {}).get("overs", "0"))
        
        # Simple live prediction logic
        if team1_overs > 0:
            team1_rr = team1_score / team1_overs
        else:
            team1_rr = 0
            
        if team2_overs > 0:
            team2_rr = team2_score / team2_overs
        else:
            team2_rr = 0
        
        # Calculate win probability based on current state
        if team1_overs >= 15:  # Death overs
            # Team batting has advantage
            prob_a = 0.6 + (team1_rr - team2_rr) * 0.05
            prob_b = 1 - prob_a
        elif team1_overs >= 10:  # Middle overs
            prob_a = 0.5 + (team1_rr - team2_rr) * 0.03
            prob_b = 1 - prob_a
        else:  # Early overs
            prob_a = 0.5 + (team1_rr - team2_rr) * 0.02
            prob_b = 1 - prob_a
        
        # Clamp probabilities
        prob_a = max(0.1, min(0.9, prob_a))
        prob_b = 1 - prob_a
        
        team1_name = scorecard.get("team1", {}).get("name", "Team 1")
        team2_name = scorecard.get("team2", {}).get("name", "Team 2")
        
        winner = team1_name if prob_a > prob_b else team2_name
        confidence = max(prob_a, prob_b)
        
        factors = [
            {"label": f"{team1_name} current run rate", "weight": team1_rr},
            {"label": f"{team2_name} current run rate", "weight": team2_rr},
            {"label": "Wickets lost", "weight": team1_wickets + team2_wickets},
            {"label": "Overs remaining", "weight": 20 - team1_overs},
        ]
        
        return {
            "status": "success",
            "winner": winner,
            "prob_a": round(prob_a, 4),
            "prob_b": round(prob_b, 4),
            "confidence": round(confidence, 4),
            "factors": factors,
            "match_state": {
                "team1": {"score": team1_score, "wickets": team1_wickets, "overs": team1_overs},
                "team2": {"score": team2_score, "wickets": team2_wickets, "overs": team2_overs}
            },
            "message": "Live prediction based on current match state"
        }
    except Exception as e:
        logger.error(f"Live prediction error: {e}")
        return {"status": "error", "message": str(e)}
# ====================== ADMIN PANEL ======================
@app.get("/admin/models")
async def list_models():
    """List all available ML models with their metadata"""
    try:
        model_files = os.listdir(MODEL_DIR) if os.path.exists(MODEL_DIR) else []
        models = []
        
        for file in model_files:
            if file.endswith('.pkl'):
                file_path = os.path.join(MODEL_DIR, file)
                stat = os.stat(file_path)
                models.append({
                    "name": file,
                    "size": stat.st_size,
                    "modified": stat.st_mtime,
                    "type": file.split('_')[1] if '_' in file else "unknown"
                })
        
        return {"models": models}
    except Exception as e:
        return {"models": [], "error": str(e)}

@app.post("/admin/models/upload")
async def upload_model(request: ModelUploadRequest):
    """Upload a new model file (placeholder for file upload)"""
    try:
        # In production, this would handle file upload
        return {
            "status": "success",
            "message": "Model upload endpoint - implement file upload handling",
            "model_type": request.model_type
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/admin/models/refresh")
async def refresh_models():
    """Reload all ML models from disk"""
    global clf_pre, sc_pre, le_team, le_venue, win_rate_map, season_wr, venue_wr, matches_df
    try:
        clf_pre = joblib.load(os.path.join(MODEL_DIR, "ipl_clf_pre.pkl"))
        sc_pre = joblib.load(os.path.join(MODEL_DIR, "ipl_scaler_pre.pkl"))
        le_team = joblib.load(os.path.join(MODEL_DIR, "ipl_le_team.pkl"))
        le_venue = joblib.load(os.path.join(MODEL_DIR, "ipl_le_venue.pkl"))
        win_rate_map = joblib.load(os.path.join(MODEL_DIR, "ipl_win_rate.pkl"))
        season_wr = joblib.load(os.path.join(MODEL_DIR, "ipl_season_wr.pkl"))
        venue_wr = joblib.load(os.path.join(MODEL_DIR, "ipl_venue_wr.pkl"))
        matches_df = joblib.load(os.path.join(MODEL_DIR, "ipl_matches_processed.pkl"))
        
        return {
            "status": "success",
            "message": "Models reloaded successfully",
            "models_loaded": ["clf_pre", "sc_pre", "le_team", "le_venue", "win_rate_map", "season_wr", "venue_wr", "matches_df"]
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/admin/performance")
async def get_model_performance():
    """Get model performance metrics"""
    try:
        # In production, this would read from a database or log file
        mock_performance = {
            "pre_match_prediction": {
                "accuracy": 0.92,
                "precision": 0.89,
                "recall": 0.87,
                "f1_score": 0.88,
                "last_trained": "2026-03-20",
                "training_samples": 850
            },
            "live_prediction": {
                "accuracy": 0.88,
                "precision": 0.85,
                "recall": 0.82,
                "f1_score": 0.83,
                "last_trained": "2026-03-21",
                "training_samples": 1200
            },
            "top_scorer_prediction": {
                "accuracy": 0.75,
                "precision": 0.72,
                "recall": 0.70,
                "f1_score": 0.71,
                "last_trained": "2026-03-19",
                "training_samples": 650
            },
            "top_wicket_prediction": {
                "accuracy": 0.73,
                "precision": 0.70,
                "recall": 0.68,
                "f1_score": 0.69,
                "last_trained": "2026-03-19",
                "training_samples": 650
            }
        }
        return mock_performance
    except Exception as e:
        return {"error": str(e)}

@app.post("/predict/top-scorer")
async def predict_top_scorer(request: PredictRequest):
    """Predict top run-scorer for the match"""
    try:
        # Simple rule-based prediction for top scorer
        team_a_canon = canonical_team(request.team_a)
        team_b_canon = canonical_team(request.team_b)
        
        # Get players from both teams
        team_a_players = [p for p in IPL_SQUAD if p[1] == team_a_canon]
        team_b_players = [p for p in IPL_SQUAD if p[1] == team_b_canon]
        
        # Filter batsmen
        batsmen = [p for p in team_a_players + team_b_players if p[2] in ["Batsman", "Wicket-keeper", "All-rounder"]]
        
        # Simple scoring based on player role
        scored_players = []
        for player in batsmen:
            score = 0
            if player[2] == "Batsman":
                score += 10
            elif player[2] == "Wicket-keeper":
                score += 8
            elif player[2] == "All-rounder":
                score += 7
            
            scored_players.append({
                "name": player[0],
                "team": player[1],
                "role": player[2],
                "predicted_runs": 45 + score * 3,
                "probability": 0.15 + score * 0.02
            })
        
        # Sort by predicted runs
        scored_players.sort(key=lambda x: x["predicted_runs"], reverse=True)
        
        return {
            "status": "success",
            "top_scorer": scored_players[0] if scored_players else None,
            "top_5": scored_players[:5],
            "message": "Rule-based top scorer prediction"
        }
    except Exception as e:
        logger.error(f"Top scorer prediction error: {e}")
        return {"status": "error", "message": str(e)}

@app.post("/predict/top-wicket")
async def predict_top_wicket(request: PredictRequest):
    """Predict top wicket-taker for the match"""
    try:
        team_a_canon = canonical_team(request.team_a)
        team_b_canon = canonical_team(request.team_b)
        
        # Get players from both teams
        team_a_players = [p for p in IPL_SQUAD if p[1] == team_a_canon]
        team_b_players = [p for p in IPL_SQUAD if p[1] == team_b_canon]
        
        # Filter bowlers
        bowlers = [p for p in team_a_players + team_b_players if p[2] in ["Bowler", "All-rounder"]]
        
        # Simple scoring based on player role
        scored_players = []
        for player in bowlers:
            score = 0
            if player[2] == "Bowler":
                score += 10
            elif player[2] == "All-rounder":
                score += 7
            
            scored_players.append({
                "name": player[0],
                "team": player[1],
                "role": player[2],
                "predicted_wickets": 2 + score * 0.3,
                "probability": 0.12 + score * 0.02
            })
        
        # Sort by predicted wickets
        scored_players.sort(key=lambda x: x["predicted_wickets"], reverse=True)
        
        return {
            "status": "success",
            "top_wicket_taker": scored_players[0] if scored_players else None,
            "top_5": scored_players[:5],
            "message": "Rule-based top wicket-taker prediction"
        }
    except Exception as e:
        logger.error(f"Top wicket prediction error: {e}")
        return {"status": "error", "message": str(e)}

# ====================== AI PREDICTION ======================
@app.post("/predict")
async def predict_match(request: PredictRequest):
    try:
        # Normalize team names
        team_a_canon = canonical_team(request.team_a)
        team_b_canon = canonical_team(request.team_b)
        venue_canon = request.venue
        
        # If ML models are available, use them
        if clf_pre is not None and sc_pre is not None:
            try:
                # Get win rates
                t1_wr = win_rate_map.get(team_a_canon, 0.5)
                t2_wr = win_rate_map.get(team_b_canon, 0.5)
                
                # Get season win rates (2026)
                t1_swr = season_wr.get((2026, team_a_canon), t1_wr)
                t2_swr = season_wr.get((2026, team_b_canon), t2_wr)
                
                # Get venue win rates
                t1_vwr = venue_wr.get((venue_canon, team_a_canon), t1_wr)
                t2_vwr = venue_wr.get((venue_canon, team_b_canon), t2_wr)
                
                # Encode teams and venue
                try:
                    t1_enc = le_team.transform([team_a_canon])[0] if team_a_canon in le_team.classes_ else 0
                    t2_enc = le_team.transform([team_b_canon])[0] if team_b_canon in le_team.classes_ else 0
                    v_enc = le_venue.transform([venue_canon])[0] if venue_canon in le_venue.classes_ else 0
                except:
                    t1_enc = 0
                    t2_enc = 0
                    v_enc = 0
                
                # Toss features
                toss_winner_is_t1 = 1 if request.toss_winner == team_a_canon else 0
                bat_first = 1 if request.toss_decision == "bat" else 0
                is_day_night_i = 1 if request.is_day_night else 0
                
                # Create feature array
                features = np.array([[t1_enc, t2_enc, v_enc, toss_winner_is_t1, bat_first, is_day_night_i,
                                    t1_wr, t2_wr, 0.5,  # h2h_rate neutral for future matches
                                    t1_swr, t2_swr, t1_vwr, t2_vwr]])
                
                # Scale and predict
                features_scaled = sc_pre.transform(features)
                proba = clf_pre.predict_proba(features_scaled)[0]
                
                prob_a = float(proba[1])  # team1 wins
                prob_b = float(proba[0])  # team2 wins
                winner = team_a_canon if prob_a > prob_b else team_b_canon
                confidence = max(prob_a, prob_b)
                
                # Generate factors
                factors = [
                    {"label": f"{team_a_canon} overall win rate", "weight": t1_wr},
                    {"label": f"{team_b_canon} overall win rate", "weight": t2_wr},
                    {"label": f"{team_a_canon} 2026 form", "weight": t1_swr},
                    {"label": f"{team_b_canon} 2026 form", "weight": t2_swr},
                    {"label": f"{team_a_canon} at {venue_canon}", "weight": t1_vwr},
                    {"label": f"{team_b_canon} at {venue_canon}", "weight": t2_vwr},
                ]
                
                return {
                    "status": "success",
                    "winner": winner,
                    "prob_a": prob_a,
                    "prob_b": prob_b,
                    "confidence": confidence,
                    "factors": factors
                }
            except Exception as e:
                logger.error(f"ML prediction error: {str(e)}")
                # Fall back to rule-based prediction
        
        # Rule-based fallback prediction using points-table data for team strength
        # Derive strength from current IPL 2026 standings
        _points_table = [
            {"teamName": "Kolkata Knight Riders", "points": 18},
            {"teamName": "Rajasthan Royals", "points": 16},
            {"teamName": "Chennai Super Kings", "points": 14},
            {"teamName": "Gujarat Titans", "points": 14},
            {"teamName": "Sunrisers Hyderabad", "points": 12},
            {"teamName": "Lucknow Super Giants", "points": 12},
            {"teamName": "Delhi Capitals", "points": 10},
            {"teamName": "Punjab Kings", "points": 10},
            {"teamName": "Mumbai Indians", "points": 8},
            {"teamName": "Royal Challengers Bengaluru", "points": 8},
        ]
        max_pts = max(t["points"] for t in _points_table) if _points_table else 18
        min_pts = min(t["points"] for t in _points_table) if _points_table else 8
        team_strength = {
            t["teamName"]: 0.5 + 0.4 * (t["points"] - min_pts) / (max_pts - min_pts)
            for t in _points_table
        }

        t1_strength = team_strength.get(team_a_canon, 0.5)
        t2_strength = team_strength.get(team_b_canon, 0.5)
        
        # Adjust for toss winner advantage
        if request.toss_winner == team_a_canon:
            t1_strength += 0.05
        elif request.toss_winner == team_b_canon:
            t2_strength += 0.05
        
        # Normalize to probabilities
        total = t1_strength + t2_strength
        prob_a = t1_strength / total
        prob_b = t2_strength / total
        
        winner = team_a_canon if prob_a > prob_b else team_b_canon
        confidence = max(prob_a, prob_b)
        
        # Find points for each team for the factor list
        t1_pts = next((t["points"] for t in _points_table if t["teamName"] == team_a_canon), 0)
        t2_pts = next((t["points"] for t in _points_table if t["teamName"] == team_b_canon), 0)
        factors = [
            {"label": f"{team_a_canon} points table ({t1_pts} pts)", "weight": t1_strength},
            {"label": f"{team_b_canon} points table ({t2_pts} pts)", "weight": t2_strength},
            {"label": "Toss advantage", "weight": 0.05 if request.toss_winner else 0.0},
        ]
        
        return {
            "status": "success",
            "winner": winner,
            "prob_a": round(prob_a, 4),
            "prob_b": round(prob_b, 4),
            "confidence": round(confidence, 4),
            "factors": factors,
            "message": "Rule-based prediction (ML models not available)"
        }
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "message": str(e),
            "winner": "N/A",
            "prob_a": 0.5,
            "prob_b": 0.5,
            "confidence": 0,
            "factors": []
        }

# =====================================================================
# PASTE THIS ENTIRE BLOCK into app.py
# DELETE from `IPL_PLAYERS = [` down to end of old get_player()
# then paste this just above:  if __name__ == "__main__":
# =====================================================================

import threading
import time

# ── Full IPL 2026 Squads (name is used to search cricapi live) ────────────────
# Format: (display_name, team, role)
IPL_SQUAD = [

    # ── Mumbai Indians ──────────────────────────────────────────────
    # Batters
    ("Rohit Sharma",          "Mumbai Indians", "Batsman"),
    ("Suryakumar Yadav",      "Mumbai Indians", "Batsman"),
    ("Robin Minz",            "Mumbai Indians", "Wicket-keeper"),
    ("Sherfane Rutherford",   "Mumbai Indians", "Batsman"),
    ("Ryan Rickelton",        "Mumbai Indians", "Wicket-keeper"),
    ("Quinton De Kock",       "Mumbai Indians", "Wicket-keeper"),
    ("Danish Malewar",        "Mumbai Indians", "Batsman"),
    ("N. Tilak Varma",        "Mumbai Indians", "Batsman"),
    # All-Rounders
    ("Hardik Pandya",         "Mumbai Indians", "All-rounder"),
    ("Naman Dhir",            "Mumbai Indians", "All-rounder"),
    ("Raj Angad Bawa",        "Mumbai Indians", "All-rounder"),
    ("Mayank Rawat",          "Mumbai Indians", "All-rounder"),
    ("Krish Bhagat",          "Mumbai Indians", "All-rounder"),
    ("Corbin Bosch",          "Mumbai Indians", "All-rounder"),
    ("Will Jacks",            "Mumbai Indians", "All-rounder"),
    ("Shardul Thakur",        "Mumbai Indians", "All-rounder"),
    # Bowlers
    ("Trent Boult",           "Mumbai Indians", "Bowler"),
    ("Mayank Markande",       "Mumbai Indians", "Bowler"),
    ("Deepak Chahar",         "Mumbai Indians", "Bowler"),
    ("Ashwani Kumar",         "Mumbai Indians", "Bowler"),
    ("Raghu Sharma",          "Mumbai Indians", "Bowler"),
    ("Mohammad Izhar",        "Mumbai Indians", "Bowler"),
    ("Keshav Maharaj",        "Mumbai Indians", "Bowler"),
    ("Allah Ghazanfar",       "Mumbai Indians", "Bowler"),
    ("Jasprit Bumrah",        "Mumbai Indians", "Bowler"),

    # ── Chennai Super Kings ─────────────────────────────────────────
    # Batters
    ("Ruturaj Gaikwad",       "Chennai Super Kings", "Batsman"),
    ("MS Dhoni",              "Chennai Super Kings", "Wicket-keeper"),
    ("Sanju Samson",          "Chennai Super Kings", "Wicket-keeper"),
    ("Dewald Brevis",         "Chennai Super Kings", "Batsman"),
    ("Kartik Sharma",         "Chennai Super Kings", "Batsman"),
    ("Sarfaraz Khan",         "Chennai Super Kings", "Batsman"),
    ("Urvil Patel",           "Chennai Super Kings", "Wicket-keeper"),
    # All-Rounders
    ("Jamie Overton",         "Chennai Super Kings", "All-rounder"),
    ("Ramakrishna Ghosh",     "Chennai Super Kings", "All-rounder"),
    ("Prashant Veer",         "Chennai Super Kings", "All-rounder"),
    ("Matthew Short",         "Chennai Super Kings", "All-rounder"),
    ("Aman Khan",             "Chennai Super Kings", "All-rounder"),
    ("Zak Foulkes",           "Chennai Super Kings", "All-rounder"),
    ("Shivam Dube",           "Chennai Super Kings", "All-rounder"),
    # Bowlers
    ("Khaleel Ahmed",         "Chennai Super Kings", "Bowler"),
    ("Noor Ahmad",            "Chennai Super Kings", "Bowler"),
    ("Anshul Kamboj",         "Chennai Super Kings", "Bowler"),
    ("Mukesh Choudhary",      "Chennai Super Kings", "Bowler"),
    ("Shreyas Gopal",         "Chennai Super Kings", "Bowler"),
    ("Gurjapneet Singh",      "Chennai Super Kings", "Bowler"),
    ("Akeal Hosein",          "Chennai Super Kings", "Bowler"),
    ("Matt Henry",            "Chennai Super Kings", "Bowler"),
    ("Rahul Chahar",          "Chennai Super Kings", "Bowler"),
    ("Spencer Johnson",       "Chennai Super Kings", "Bowler"),
    ("Akash Madhwal",         "Chennai Super Kings", "Bowler"),

    # ── Royal Challengers Bengaluru ─────────────────────────────────
    # Batters
    ("Rajat Patidar",         "Royal Challengers Bengaluru", "Batsman"),
    ("Devdutt Padikkal",      "Royal Challengers Bengaluru", "Batsman"),
    ("Virat Kohli",           "Royal Challengers Bengaluru", "Batsman"),
    ("Phil Salt",             "Royal Challengers Bengaluru", "Wicket-keeper"),
    ("Jitesh Sharma",         "Royal Challengers Bengaluru", "Wicket-keeper"),
    ("Jordan Cox",            "Royal Challengers Bengaluru", "Wicket-keeper"),
    # All-Rounders
    ("Krunal Pandya",         "Royal Challengers Bengaluru", "All-rounder"),
    ("Swapnil Singh",         "Royal Challengers Bengaluru", "All-rounder"),
    ("Tim David",             "Royal Challengers Bengaluru", "All-rounder"),
    ("Romario Shepherd",      "Royal Challengers Bengaluru", "All-rounder"),
    ("Jacob Bethell",         "Royal Challengers Bengaluru", "All-rounder"),
    ("Venkatesh Iyer",        "Royal Challengers Bengaluru", "All-rounder"),
    ("Satvik Deswal",         "Royal Challengers Bengaluru", "All-rounder"),
    ("Mangesh Yadav",         "Royal Challengers Bengaluru", "All-rounder"),
    ("Vicky Ostwal",          "Royal Challengers Bengaluru", "All-rounder"),
    ("Vihaan Malhotra",       "Royal Challengers Bengaluru", "All-rounder"),
    ("Kanishk Chouhan",       "Royal Challengers Bengaluru", "All-rounder"),
    # Bowlers
    ("Josh Hazlewood",        "Royal Challengers Bengaluru", "Bowler"),
    ("Rasikh Dar",            "Royal Challengers Bengaluru", "Bowler"),
    ("Suyash Sharma",         "Royal Challengers Bengaluru", "Bowler"),
    ("Bhuvneshwar Kumar",     "Royal Challengers Bengaluru", "Bowler"),
    ("Nuwan Thushara",        "Royal Challengers Bengaluru", "Bowler"),
    ("Abinandan Singh",       "Royal Challengers Bengaluru", "Bowler"),
    ("Jacob Duffy",           "Royal Challengers Bengaluru", "Bowler"),
    ("Yash Dayal",            "Royal Challengers Bengaluru", "Bowler"),

    # ── Kolkata Knight Riders ───────────────────────────────────────
    # Batters
    ("Ajinkya Rahane",        "Kolkata Knight Riders", "Batsman"),
    ("Rinku Singh",           "Kolkata Knight Riders", "Batsman"),
    ("Angkrish Raghuvanshi",  "Kolkata Knight Riders", "Batsman"),
    ("Manish Pandey",         "Kolkata Knight Riders", "Batsman"),
    ("Finn Allen",            "Kolkata Knight Riders", "Wicket-keeper"),
    ("Tejasvi Singh",         "Kolkata Knight Riders", "Batsman"),
    ("Rahul Tripathi",        "Kolkata Knight Riders", "Batsman"),
    ("Tim Seifert",           "Kolkata Knight Riders", "Wicket-keeper"),
    ("Rovman Powell",         "Kolkata Knight Riders", "Batsman"),
    # All-Rounders
    ("Anukul Roy",            "Kolkata Knight Riders", "All-rounder"),
    ("Cameron Green",         "Kolkata Knight Riders", "All-rounder"),
    ("Sarthak Ranjan",        "Kolkata Knight Riders", "All-rounder"),
    ("Daksh Kamra",           "Kolkata Knight Riders", "All-rounder"),
    ("Rachin Ravindra",       "Kolkata Knight Riders", "All-rounder"),
    ("Ramandeep Singh",       "Kolkata Knight Riders", "All-rounder"),
    ("Sunil Narine",          "Kolkata Knight Riders", "All-rounder"),
    # Bowlers
    ("Blessing Muzarabani",   "Kolkata Knight Riders", "Bowler"),
    ("Vaibhav Arora",         "Kolkata Knight Riders", "Bowler"),
    ("Matheesha Pathirana",   "Kolkata Knight Riders", "Bowler"),
    ("Kartik Tyagi",          "Kolkata Knight Riders", "Bowler"),
    ("Prashant Solanki",      "Kolkata Knight Riders", "Bowler"),
    ("Saurabh Dubey",         "Kolkata Knight Riders", "Bowler"),
    ("Navdeep Saini",         "Kolkata Knight Riders", "Bowler"),
    ("Umran Malik",           "Kolkata Knight Riders", "Bowler"),
    ("Varun Chakaravarthy",   "Kolkata Knight Riders", "Bowler"),

    # ── Delhi Capitals ──────────────────────────────────────────────
    # Batters
    ("KL Rahul",              "Delhi Capitals", "Wicket-keeper"),
    ("Karun Nair",            "Delhi Capitals", "Batsman"),
    ("David Miller",          "Delhi Capitals", "Batsman"),
    ("Pathum Nissanka",       "Delhi Capitals", "Batsman"),
    ("Sahil Parakh",          "Delhi Capitals", "Batsman"),
    ("Prithvi Shaw",          "Delhi Capitals", "Batsman"),
    ("Abishek Porel",         "Delhi Capitals", "Wicket-keeper"),
    ("Tristan Stubbs",        "Delhi Capitals", "Wicket-keeper"),
    # All-Rounders
    ("Axar Patel",            "Delhi Capitals", "All-rounder"),
    ("Sameer Rizvi",          "Delhi Capitals", "All-rounder"),
    ("Ashutosh Sharma",       "Delhi Capitals", "All-rounder"),
    ("Vipraj Nigam",          "Delhi Capitals", "All-rounder"),
    ("Ajay Mandal",           "Delhi Capitals", "All-rounder"),
    ("Tripurana Vijay",       "Delhi Capitals", "All-rounder"),
    ("Madhav Tiwari",         "Delhi Capitals", "All-rounder"),
    ("Nitish Rana",           "Delhi Capitals", "All-rounder"),
    # Bowlers
    ("Mitchell Starc",        "Delhi Capitals", "Bowler"),
    ("T. Natarajan",          "Delhi Capitals", "Bowler"),
    ("Mukesh Kumar",          "Delhi Capitals", "Bowler"),
    ("Dushmantha Chameera",   "Delhi Capitals", "Bowler"),
    ("Auqib Nabi",            "Delhi Capitals", "Bowler"),
    ("Lungisani Ngidi",       "Delhi Capitals", "Bowler"),
    ("Kyle Jamieson",         "Delhi Capitals", "Bowler"),
    ("Rehan Ahmed",           "Delhi Capitals", "Bowler"),
    ("Kuldeep Yadav",         "Delhi Capitals", "Bowler"),

    # ── Punjab Kings ────────────────────────────────────────────────
    # Batters
    ("Shreyas Iyer",          "Punjab Kings", "Batsman"),
    ("Nehal Wadhera",         "Punjab Kings", "Batsman"),
    ("Vishnu Vinod",          "Punjab Kings", "Wicket-keeper"),
    ("Harnoor Pannu",         "Punjab Kings", "Batsman"),
    ("Pyla Avinash",          "Punjab Kings", "Batsman"),
    ("Prabhsimran Singh",     "Punjab Kings", "Wicket-keeper"),
    ("Shashank Singh",        "Punjab Kings", "Batsman"),
    # All-Rounders
    ("Marcus Stoinis",        "Punjab Kings", "All-rounder"),
    ("Harpreet Brar",         "Punjab Kings", "All-rounder"),
    ("Marco Jansen",          "Punjab Kings", "All-rounder"),
    ("Azmatullah Omarzai",    "Punjab Kings", "All-rounder"),
    ("Priyansh Arya",         "Punjab Kings", "All-rounder"),
    ("Musheer Khan",          "Punjab Kings", "All-rounder"),
    ("Suryansh Shedge",       "Punjab Kings", "All-rounder"),
    ("Mitch Owen",            "Punjab Kings", "All-rounder"),
    ("Cooper Connolly",       "Punjab Kings", "All-rounder"),
    ("Ben Dwarshuis",         "Punjab Kings", "All-rounder"),
    # Bowlers
    ("Arshdeep Singh",        "Punjab Kings", "Bowler"),
    ("Yuzvendra Chahal",      "Punjab Kings", "Bowler"),
    ("Vyshak Vijaykumar",     "Punjab Kings", "Bowler"),
    ("Yash Thakur",           "Punjab Kings", "Bowler"),
    ("Xavier Bartlett",       "Punjab Kings", "Bowler"),
    ("Pravin Dubey",          "Punjab Kings", "Bowler"),
    ("Vishal Nishad",         "Punjab Kings", "Bowler"),
    ("Lockie Ferguson",       "Punjab Kings", "Bowler"),

    # ── Rajasthan Royals ────────────────────────────────────────────
    # Batters
    ("Shubham Dubey",         "Rajasthan Royals", "Batsman"),
    ("Vaibhav Suryavanshi",   "Rajasthan Royals", "Batsman"),
    ("Donovan Ferreira",      "Rajasthan Royals", "Batsman"),
    ("Lhuan-Dre Pretorius",   "Rajasthan Royals", "Batsman"),
    ("Ravi Singh",            "Rajasthan Royals", "Batsman"),
    ("Aman Rao Perala",       "Rajasthan Royals", "Batsman"),
    ("Shimron Hetmyer",       "Rajasthan Royals", "Batsman"),
    ("Yashasvi Jaiswal",      "Rajasthan Royals", "Batsman"),
    ("Dhruv Jurel",           "Rajasthan Royals", "Wicket-keeper"),
    # All-Rounders
    ("Riyan Parag",           "Rajasthan Royals", "All-rounder"),
    ("Yudhvir Singh Charak",  "Rajasthan Royals", "All-rounder"),
    ("Ravindra Jadeja",       "Rajasthan Royals", "All-rounder"),
    ("Dasun Shanaka",         "Rajasthan Royals", "All-rounder"),
    # Bowlers
    ("Jofra Archer",          "Rajasthan Royals", "Bowler"),
    ("Tushar Deshpande",      "Rajasthan Royals", "Bowler"),
    ("Kwena Maphaka",         "Rajasthan Royals", "Bowler"),
    ("Ravi Bishnoi",          "Rajasthan Royals", "Bowler"),
    ("Sushant Mishra",        "Rajasthan Royals", "Bowler"),
    ("Yash Raj Punja",        "Rajasthan Royals", "Bowler"),
    ("Vignesh Puthur",        "Rajasthan Royals", "Bowler"),
    ("Brijesh Sharma",        "Rajasthan Royals", "Bowler"),
    ("Adam Milne",            "Rajasthan Royals", "Bowler"),
    ("Kuldeep Sen",           "Rajasthan Royals", "Bowler"),
    ("Sandeep Sharma",        "Rajasthan Royals", "Bowler"),
    ("Nandre Burger",         "Rajasthan Royals", "Bowler"),

    # ── Gujarat Titans ──────────────────────────────────────────────
    # Batters
    ("Shubman Gill",          "Gujarat Titans", "Batsman"),
    ("Jos Buttler",           "Gujarat Titans", "Wicket-keeper"),
    ("Kumar Kushagra",        "Gujarat Titans", "Wicket-keeper"),
    ("Anuj Rawat",            "Gujarat Titans", "Wicket-keeper"),
    ("Connor Esterhuizen",    "Gujarat Titans", "Batsman"),
    ("Glenn Phillips",        "Gujarat Titans", "Batsman"),
    ("Sai Sudharsan",         "Gujarat Titans", "Batsman"),
    # All-Rounders
    ("Nishant Sindhu",        "Gujarat Titans", "All-rounder"),
    ("Washington Sundar",     "Gujarat Titans", "All-rounder"),
    ("Mohd. Arshad Khan",     "Gujarat Titans", "All-rounder"),
    ("Sai Kishore",           "Gujarat Titans", "All-rounder"),
    ("Jayant Yadav",          "Gujarat Titans", "All-rounder"),
    ("Jason Holder",          "Gujarat Titans", "All-rounder"),
    ("Rahul Tewatia",         "Gujarat Titans", "All-rounder"),
    ("Shahrukh Khan",         "Gujarat Titans", "All-rounder"),
    # Bowlers
    ("Kagiso Rabada",         "Gujarat Titans", "Bowler"),
    ("Mohammed Siraj",        "Gujarat Titans", "Bowler"),
    ("Prasidh Krishna",       "Gujarat Titans", "Bowler"),
    ("Manav Suthar",          "Gujarat Titans", "Bowler"),
    ("Gurnoor Singh Brar",    "Gujarat Titans", "Bowler"),
    ("Ishant Sharma",         "Gujarat Titans", "Bowler"),
    ("Ashok Sharma",          "Gujarat Titans", "Bowler"),
    ("Luke Wood",             "Gujarat Titans", "Bowler"),
    ("Kulwant Khejroliya",    "Gujarat Titans", "Bowler"),
    ("Rashid Khan",           "Gujarat Titans", "Bowler"),

    # ── Sunrisers Hyderabad ─────────────────────────────────────────
    # Batters
    ("Ishan Kishan",          "Sunrisers Hyderabad", "Wicket-keeper"),
    ("Aniket Verma",          "Sunrisers Hyderabad", "Batsman"),
    ("Smaran Ravichandran",   "Sunrisers Hyderabad", "Batsman"),
    ("Salil Arora",           "Sunrisers Hyderabad", "Batsman"),
    ("Heinrich Klaasen",      "Sunrisers Hyderabad", "Wicket-keeper"),
    ("Travis Head",           "Sunrisers Hyderabad", "Batsman"),
    # All-Rounders
    ("Harshal Patel",         "Sunrisers Hyderabad", "All-rounder"),
    ("Kamindu Mendis",        "Sunrisers Hyderabad", "All-rounder"),
    ("Harsh Dubey",           "Sunrisers Hyderabad", "All-rounder"),
    ("Shivang Kumar",         "Sunrisers Hyderabad", "All-rounder"),
    ("Krains Fuletra",        "Sunrisers Hyderabad", "All-rounder"),
    ("Liam Livingstone",      "Sunrisers Hyderabad", "All-rounder"),
    ("ILS Ambrish",           "Sunrisers Hyderabad", "All-rounder"),
    ("Abhishek Sharma",       "Sunrisers Hyderabad", "All-rounder"),
    ("Nitish Kumar Reddy",    "Sunrisers Hyderabad", "All-rounder"),
    # Bowlers
    ("Pat Cummins",           "Sunrisers Hyderabad", "Bowler"),
    ("Zeeshan Ansari",        "Sunrisers Hyderabad", "Bowler"),
    ("Jaydev Unadkat",        "Sunrisers Hyderabad", "Bowler"),
    ("Eshan Malinga",         "Sunrisers Hyderabad", "Bowler"),
    ("Sakib Hussain",         "Sunrisers Hyderabad", "Bowler"),
    ("Onkar Tarmale",         "Sunrisers Hyderabad", "Bowler"),
    ("Amit Kumar",            "Sunrisers Hyderabad", "Bowler"),
    ("Praful Hinge",          "Sunrisers Hyderabad", "Bowler"),
    ("Dilshan Madushanka",    "Sunrisers Hyderabad", "Bowler"),
    ("Gerald Coetzee",        "Sunrisers Hyderabad", "Bowler"),

    # ── Lucknow Super Giants ────────────────────────────────────────
    # Batters
    ("Rishabh Pant",          "Lucknow Super Giants", "Wicket-keeper"),
    ("Aiden Markram",         "Lucknow Super Giants", "Batsman"),
    ("Himmat Singh",          "Lucknow Super Giants", "Batsman"),
    ("Matthew Breetzke",      "Lucknow Super Giants", "Batsman"),
    ("Mukul Choudhary",       "Lucknow Super Giants", "Batsman"),
    ("Akshat Raghuwanshi",    "Lucknow Super Giants", "Batsman"),
    ("Josh Inglis",           "Lucknow Super Giants", "Wicket-keeper"),
    ("Nicholas Pooran",       "Lucknow Super Giants", "Wicket-keeper"),
    # All-Rounders
    ("Mitchell Marsh",        "Lucknow Super Giants", "All-rounder"),
    ("Abdul Samad",           "Lucknow Super Giants", "All-rounder"),
    ("Shahbaz Ahamad",        "Lucknow Super Giants", "All-rounder"),
    ("Arshin Kulkarni",       "Lucknow Super Giants", "All-rounder"),
    ("Wanindu Hasaranga",     "Lucknow Super Giants", "All-rounder"),
    ("Ayush Badoni",          "Lucknow Super Giants", "All-rounder"),
    # Bowlers
    ("Mohammad Shami",        "Lucknow Super Giants", "Bowler"),
    ("Avesh Khan",            "Lucknow Super Giants", "Bowler"),
    ("M. Siddharth",          "Lucknow Super Giants", "Bowler"),
    ("Digvesh Singh",         "Lucknow Super Giants", "Bowler"),
    ("Akash Singh",           "Lucknow Super Giants", "Bowler"),
    ("Prince Yadav",          "Lucknow Super Giants", "Bowler"),
    ("Arjun Tendulkar",       "Lucknow Super Giants", "Bowler"),
    ("Anrich Nortje",         "Lucknow Super Giants", "Bowler"),
    ("Naman Tiwari",          "Lucknow Super Giants", "Bowler"),
    ("George Linde",          "Lucknow Super Giants", "Bowler"),
    ("Mayank Yadav",          "Lucknow Super Giants", "Bowler"),
    ("Mohsin Khan",           "Lucknow Super Giants", "Bowler"),
]
# ── In-memory stats cache ─────────────────────────────────────────────────────
_stats_cache: Dict[str, dict] = {}
_cache_built_at: float = 0
_CACHE_TTL = 24 * 60 * 60  # 24 hours


def _fetch_stats_for(name: str) -> dict:
    """Search cricapi by player name → fetch players_info → return T20 stats."""
    try:
        search_resp = call_cricket_api("players", {"search": name, "offset": 0})
        results = search_resp.get("data") if isinstance(search_resp.get("data"), list) else []
        if not results:
            return {}

        player_id = results[0].get("id", "")
        if not player_id:
            return {}

        info_resp = call_cricket_api("players_info", {"id": player_id})
        data = info_resp.get("data", {}) if info_resp.get("status") != "error" else {}
        stats_list = data.get("stats", [])

        def find(fn, kw):
            return next(
                (s for s in stats_list
                 if s.get("fn", "").lower() == fn
                 and kw in s.get("matchtype", "").lower()),
                {}
            )

        bat  = find("batting", "t20")
        bowl = find("bowling", "t20")

        def si(v):
            try: return int(v or 0)
            except: return 0

        def sf(v):
            try: return round(float(v or 0), 2)
            except: return 0.0

        return {
            "battingStyle":   data.get("battingStyle", "Right Hand Bat"),
            "bowlingStyle":   data.get("bowlingStyle", ""),
            "matches":        si(bat.get("Matches") or bat.get("Mat")),
            "runs":           si(bat.get("Runs")),
            "battingAverage": sf(bat.get("Ave") or bat.get("Avg")),
            "strikeRate":     sf(bat.get("SR")),
            "hundreds":       si(bat.get("100s") or bat.get("100")),
            "fifties":        si(bat.get("50s") or bat.get("50")),
            "wickets":        si(bowl.get("Wickets") or bowl.get("Wkts")),
            "bowlingAverage": sf(bowl.get("Ave") or bowl.get("Avg")),
            "economy":        sf(bowl.get("Econ")),
        }
    except Exception as ex:
        logger.warning(f"Stats fetch failed for {name}: {ex}")
        return {}


def _build_cache():
    global _cache_built_at
    logger.info("⏳ Building player stats cache from cricapi (background)...")
    seen = set()
    for (name, _, _) in IPL_SQUAD:
        if name in seen:
            continue
        seen.add(name)
        if name not in _stats_cache:
            _stats_cache[name] = _fetch_stats_for(name)
            time.sleep(0.4)  # polite pacing
    _cache_built_at = time.time()
    logger.info(f"✅ Player cache ready — {len(_stats_cache)} players loaded.")


def _ensure_cache():
    if time.time() - _cache_built_at > _CACHE_TTL:
        threading.Thread(target=_build_cache, daemon=True).start()


# Warm cache immediately on server start
threading.Thread(target=_build_cache, daemon=True).start()


def _make_player(name: str, team: str, role: str) -> dict:
    stats = _stats_cache.get(name, {})
    return {
        "id":             name.lower().replace(" ", "-"),
        "name":           name,
        "teamId":         team,
        "role":           role,
        "battingStyle":   stats.get("battingStyle", "Right Hand Bat"),
        "bowlingStyle":   stats.get("bowlingStyle", ""),
        "matches":        stats.get("matches", 0),
        "runs":           stats.get("runs", 0),
        "battingAverage": stats.get("battingAverage", 0.0),
        "strikeRate":     stats.get("strikeRate", 0.0),
        "hundreds":       stats.get("hundreds", 0),
        "fifties":        stats.get("fifties", 0),
        "wickets":        stats.get("wickets", 0),
        "bowlingAverage": stats.get("bowlingAverage", 0.0),
        "economy":        stats.get("economy", 0.0),
        "recentScores":   [],
        "statsReady":     bool(stats),
    }


@app.get("/players")
async def get_players(search: str = "", team: str = ""):
    _ensure_cache()
    
    # Map team IDs to full names (matching frontend team-logos.ts exactly)
    team_id_to_name = {
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
    }
    
    # Normalise the requested team name so old spellings still match
    team_name = team_id_to_name.get(team.lower(), team) if team else ""
    team_canon = canonical_team(team_name) if team else ""
    
    seen = set()
    result = []
    for (name, t, role) in IPL_SQUAD:
        if name in seen:
            continue
        seen.add(name)
        if search and search.lower() not in name.lower():
            continue
        if team_canon and team_canon.lower() not in t.lower():
            continue
        result.append(_make_player(name, t, role))

    return {
        "players": result,
        "total": len(result),
        "stats_ready": _cache_built_at > 0,
        "cache_age_minutes": round((time.time() - _cache_built_at) / 60, 1),
    }


@app.get("/players/{player_id}")
async def get_player(player_id: str):
    match = next(
        ((n, t, r) for (n, t, r) in IPL_SQUAD
         if n.lower().replace(" ", "-") == player_id),
        None
    )
    if not match:
        raise HTTPException(status_code=404, detail="Player not found")
    return _make_player(*match) 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)