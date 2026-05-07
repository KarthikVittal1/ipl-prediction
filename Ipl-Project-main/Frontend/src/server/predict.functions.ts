import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getMatch } from "./cricket.server";
import type { Prediction } from "@/types/cricket";

// Calls user's FastAPI logistic-regression model.
// Expected request: { team_a, team_b, venue }
// Expected response: { winner, prob_a, prob_b, factors? }
async function callPredictionApi(
  match: NonNullable<Awaited<ReturnType<typeof getMatch>>>
): Promise<Prediction | null> {
  const url = process.env.PREDICTION_API_URL ?? process.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const apiKey = process.env.PREDICTION_API_KEY;
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        team_a: match.teamA.shortName,
        team_b: match.teamB.shortName,
        venue: match.venueId,
        format: match.format,
      }),
    });
    if (!res.ok) {
      console.error(`Prediction API ${res.status}`, await res.text());
      return null;
    }
    const json = (await res.json()) as {
      winner?: string;
      prob_a: number;
      prob_b: number;
      factors?: { label: string; weight: number }[];
    };
    const probA = Math.max(0, Math.min(1, json.prob_a));
    const probB = Math.max(0, Math.min(1, json.prob_b));
    return {
      matchId: match.id,
      predictedWinnerId: probA >= probB ? match.teamA.id : match.teamB.id,
      probA,
      probB,
      factors: json.factors,
      source: "model",
    };
  } catch (err) {
    console.error("Prediction API failed", err);
    return null;
  }
}

// Deterministic fallback so UI always shows a prediction.
function fallbackPrediction(
  match: NonNullable<Awaited<ReturnType<typeof getMatch>>>
): Prediction {
  const seed = [...match.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const probA = 0.4 + ((seed * 37) % 21) / 100; // 0.40 - 0.60
  const probB = 1 - probA;
  return {
    matchId: match.id,
    predictedWinnerId: probA >= probB ? match.teamA.id : match.teamB.id,
    probA,
    probB,
    factors: [
      { label: "Recent form", weight: probA - 0.5 },
      { label: "Head-to-head", weight: (probA - 0.5) * 0.7 },
      { label: "Venue advantage", weight: (probA - 0.5) * 0.5 },
    ],
    source: "fallback",
  };
}

export const getPredictionFn = createServerFn({ method: "GET" })
  .inputValidator(z.object({ matchId: z.string().min(1).max(64) }))
  .handler(async ({ data }) => {
    const match = await getMatch(data.matchId);
    if (!match) return { data: null as Prediction | null };
    const live = await callPredictionApi(match);
    return { data: live ?? fallbackPrediction(match) };
  });
