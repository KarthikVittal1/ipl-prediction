# CricPredict — Cricbuzz‑style Cricket App with ML Predictions

A polished, Cricbuzz‑inspired web app showing live scores, fixtures, teams, players, and stadiums, with each match's predicted winner powered by your existing FastAPI logistic‑regression model.

## What gets built

### Pages
1. **Home `/`** — hero featured match, tabs for **Live / Upcoming / Recent**, match cards with team logos, scores/status, venue, and a "Predicted: Team X (72%)" badge from your model.
2. **Match detail `/matches/$matchId`** — full scorecard (batting/bowling), team line‑ups, venue card, head‑to‑head strip, and a **Prediction panel** showing win probability bar for both teams plus the key factors used (form, H2H, venue advantage).
3. **Teams `/teams`** — grid of all international teams with official logos, ranking chip, and recent form (W/L/W/W/L).
4. **Team profile `/teams/$teamId`** — logo header, squad list (links to player pages), recent results, upcoming fixtures, basic stats.
5. **Players `/players`** + **Player profile `/players/$playerId`** — searchable list and per‑player page with batting avg, strike rate, bowling figures, recent form sparkline.
6. **Stadiums `/stadiums`** + **Stadium profile `/stadiums/$stadiumId`** — capacity, location, pitch behaviour, average 1st‑innings score, notable matches, hero photo.

### Visual design (Cricbuzz‑inspired)
- Light theme, white surfaces, dense info layout.
- Accent palette: cricket red `#E11D2E` (primary), pitch green `#16A34A` (live indicator / positive deltas), slate text, soft gray dividers.
- Typography: Inter; tabular numerals for scores.
- Pulsing red "LIVE" dot, score in bold mono, prediction shown as a horizontal split bar (Team A vs Team B %).
- Sticky top nav: Home · Matches · Teams · Players · Stadiums.

### Imagery & logos
- **Official team logos**: pulled from a free static logo source (e.g. Wikipedia / cricket flag CDN) and cached as URL constants per team. Where no clean logo is available, I'll generate a flat circular emblem with Nano Banana Pro so every team has consistent artwork.
- **Stadium hero photos** and **home page hero**: high‑quality cricket imagery generated with Nano Banana Pro (floodlit stadium, batter cover‑drive, scoreboard close‑up) so the app looks alive on first load.
- **Player avatars**: neutral silhouette placeholder + initials chip; real headshots if your API returns them.

### Live data integration (real cricket API)
- You'll provide an API key (CricAPI, RapidAPI Cricbuzz, or SportMonks — your call).
- I'll create a thin server‑side adapter so the UI only ever talks to our own server functions:
  - `getLiveMatches`, `getUpcomingMatches`, `getRecentMatches`
  - `getMatch(id)`, `getTeam(id)`, `getPlayer(id)`, `getStadium(id)`
- The API key is stored as a Lovable runtime secret (`CRICKET_API_KEY`) and only read server‑side — never exposed to the browser.
- TanStack Query caches responses; live match queries auto‑refetch every 20s.
- Graceful fallbacks: if the upstream API fails or rate‑limits, server function returns a typed `{ data, error }` and the UI shows a non‑blocking inline notice.

### Prediction integration (your FastAPI model)
- I'll add a `getPrediction(matchId | { teamA, teamB, venue })` server function that POSTs to your FastAPI endpoint.
- You'll provide:
  - The FastAPI base URL (stored as `PREDICTION_API_URL` secret)
  - Optional auth token (`PREDICTION_API_KEY`)
  - The exact request/response shape (e.g. `{ team_a, team_b, venue } → { winner, prob_a, prob_b, factors? }`)
- Predictions are fetched per match card on the Home page and again, in more detail, on the Match page. Cached for 10 minutes per match to avoid hammering your model.
- If the model is unreachable, the card shows "Prediction unavailable" instead of breaking.

### Setup flow after approval
1. I scaffold the UI with realistic placeholder data so you can see the design immediately.
2. I ask you for the **cricket API key** and the **FastAPI URL** via Lovable's secret prompts.
3. I wire the server adapters and switch the UI from placeholder to live data.

## Technical section (for reference)

- **Stack**: TanStack Start (already set up), TanStack Query for data fetching/caching, Tailwind v4 + shadcn/ui components, Lucide icons.
- **Routes**: file‑based under `src/routes/` — `index.tsx`, `matches.$matchId.tsx`, `teams.tsx`, `teams.$teamId.tsx`, `players.tsx`, `players.$playerId.tsx`, `stadiums.tsx`, `stadiums.$stadiumId.tsx`. Shared header/footer in `__root.tsx`.
- **Server functions** in `src/server/cricket.functions.ts` (UI‑facing) backed by `src/server/cricket.server.ts` (calls upstream API + transforms). Predictions in `src/server/predict.functions.ts`.
- **Secrets**: `CRICKET_API_KEY`, `PREDICTION_API_URL`, optional `PREDICTION_API_KEY` — all read inside `.handler()` only.
- **Caching**: `staleTime` 20s for live, 5min for fixtures, 1h for teams/stadiums, 10min for predictions.
- **Types**: shared `Match`, `Team`, `Player`, `Stadium`, `Prediction` interfaces in `src/types/cricket.ts`.
- **Images**: generated hero/stadium art saved under `public/images/`; team logo URL map in `src/lib/team-logos.ts`.

## Out of scope (say the word to add)
- User accounts, favorites, push notifications
- Ball‑by‑ball commentary feed
- Domestic/league coverage beyond what your API returns
- Training or hosting the ML model (you've already done this)
