import { createFileRoute } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getPrediction, listMatches } from "@/lib/api";
import { MatchCard } from "@/components/match-card";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "IPL 2026 Matches — Live, Upcoming & Results | CrickPredict" },
      { name: "description", content: "Browse every IPL 2026 match: live scores, fixtures, results and predicted winners." },
    ],
  }),
  component: MatchesPage,
});

const TABS = ["live", "upcoming", "completed"] as const;
type Tab = (typeof TABS)[number];

function MatchesPage() {
  const [tab, setTab] = useState<Tab>("live");
  const q = useQuery({
    queryKey: ["matches"],
    queryFn: () => listMatches(),
    refetchInterval: 20_000,
  });
  const matches = (q.data ?? []).filter((m) => m.status === tab);

  const predictionQueries = useQueries({
    queries: matches.map((m) => ({
      queryKey: ["prediction", m.id],
      queryFn: () => getPrediction(m.id),
      staleTime: 10 * 60 * 1000,
      enabled: m.status !== "completed",
    })),
  });
  const predictions = new Map(predictionQueries.map((q, i) => [matches[i]?.id, q.data] as const));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">IPL 2026 Matches</h1>
      <div className="mt-4 inline-flex rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {matches.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No {tab} matches.</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} prediction={predictions.get(m.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
