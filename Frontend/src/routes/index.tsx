import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueries, useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero-cricket.jpg";
import { getPrediction, listMatches } from "@/lib/api";
import { MatchCard } from "@/components/match-card";
import { TeamLogo } from "@/components/team-logo";
import { TEAMS } from "@/lib/team-logos";
import Predictor from "@/components/predictor";
import WeatherWidget from "@/components/WeatherWidget";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CrickPredict — IPL 2026 Live Scores & AI Predictions" },
      {
        name: "description",
        content:
          "Follow IPL 2026 live, see scores from every match, explore franchise rosters, and get AI-powered win predictions.",
      },
    ],
  }),
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery({
      queryKey: ["matches"],
      queryFn: () => listMatches(),
    });
  },
  component: HomePage,
});

function HomePage() {
  const matchesQuery = useQuery({
    queryKey: ["matches"],
    queryFn: () => listMatches(),
    refetchInterval: 20_000,
  });

  const matches = matchesQuery.data ?? [];
  // Filter for IPL matches only
  const iplMatches = matches.filter((m) => 
    m.series.toLowerCase().includes("ipl") || 
    m.teamA.name.includes("Indians") || 
    m.teamB.name.includes("Indians") ||
    m.teamA.name.includes("Super") || 
    m.teamB.name.includes("Super") ||
    m.teamA.name.includes("Royals") || 
    m.teamB.name.includes("Royals") ||
    m.teamA.name.includes("Knights") || 
    m.teamB.name.includes("Knights") ||
    m.teamA.name.includes("Capitals") || 
    m.teamB.name.includes("Capitals") ||
    m.teamA.name.includes("Kings") || 
    m.teamB.name.includes("Kings") ||
    m.teamA.name.includes("Titans") || 
    m.teamB.name.includes("Titans") ||
    m.teamA.name.includes("Giants") || 
    m.teamB.name.includes("Giants")
  );
  
  const live = iplMatches.filter((m) => m.status === "live");
  const upcoming = iplMatches.filter((m) => m.status === "upcoming");
  const completed = iplMatches.filter((m) => m.status === "completed");

  // Predictions for all live + upcoming matches
  const predictionQueries = useQueries({
    queries: [...live, ...upcoming].map((m) => ({
      queryKey: ["prediction", m.id],
      queryFn: () => getPrediction(m.id),
      staleTime: 10 * 60 * 1000,
    })),
  });
  const predictions = new Map(
    predictionQueries
      .map((q, i) => [[...live, ...upcoming][i]?.id, q.data] as const)
      .filter(([id]) => !!id),
  );

  const featured = live[0] ?? upcoming[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="Floodlit cricket stadium"
          width={1920}
          height={1080}
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/30" />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur ring-1 ring-primary/30">
            <Sparkles className="h-3 w-3" /> IPL 2026 · Powered by AI Predictions
          </span>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Every IPL ball.<br />
            Every score.<br />
            <span className="text-primary">Predicted before the toss.</span>
          </h1>
          <p className="mt-3 max-w-xl text-base text-white/80">
            Live scoreboards, full match centres, franchise squads, stadium intel and a logistic-regression model calling every winner.
          </p>
          {featured && (
            <Link
              to="/matches/$matchId"
              params={{ matchId: featured.id }}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:translate-y-[-1px] hover:bg-primary/90"
            >
              {featured.status === "live" ? "Open live match" : "Open featured match"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>
      <WeatherWidget />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Live */}
        <Section title="Live now" badge={live.length} accent>
          {live.length === 0 ? (
            <Empty text="No matches in play right now." />
          ) : (
            <Grid>
              {live.map((m) => (
                <MatchCard key={m.id} match={m} prediction={predictions.get(m.id)} />
              ))}
            </Grid>
          )}
        </Section>

        {/* Upcoming */}
        <Section title="Upcoming fixtures" badge={upcoming.length}>
          <Grid>
            {upcoming.map((m) => (
              <MatchCard key={m.id} match={m} prediction={predictions.get(m.id)} />
            ))}
          </Grid>
        </Section>

        {/* Completed - Recent Results Bubble Widget */}
        <Section title="Recent results" badge={completed.length}>
          <div className="space-y-4">
            {completed.length === 0 ? (
              <Empty text="No recent IPL matches completed." />
            ) : (
              <div className="flex flex-wrap gap-3">
                {completed.slice(0, 8).map((m) => (
                  <div
                    key={m.id}
                    className="relative group cursor-pointer rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 px-4 py-2 hover:border-primary/40 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">
                        {m.teamA.shortName} vs {m.teamB.shortName}
                      </span>
                      <span className="text-primary font-bold">→</span>
                      <span className="font-semibold text-foreground">
                        {m.result?.split(" won")[0] || "TBD"}
                      </span>
                    </div>
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {m.venue} • {new Date(m.startTime).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Franchises */}
        <Section title="IPL 2026 franchises" badge={Object.keys(TEAMS).length}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {Object.values(TEAMS).map((t) => (
              <Link
                key={t.id}
                to="/teams/$teamId"
                params={{ teamId: t.id }}
                className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <TeamLogo teamId={t.id} size={56} />
                <span className="text-center text-xs font-semibold leading-tight">{t.name}</span>
              </Link>
            ))}
          </div>
        </Section>

        {/* AI Predictor */}
        <Section title="AI Match Predictor" accent>
          <div className="rounded-lg border border-border bg-card p-6">
            <Predictor />
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  badge,
  accent,
  children,
}: {
  title: string;
  badge?: number;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3 flex items-center gap-2">
        {accent && <span className="live-dot inline-block h-2.5 w-2.5 rounded-full bg-primary" />}
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {typeof badge === "number" && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
