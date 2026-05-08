import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { listPlayers } from "@/lib/api";
import { TeamLogo } from "@/components/team-logo";

export const Route = createFileRoute("/players")({
  head: () => ({
    meta: [
      { title: "IPL 2026 Players & Stats | CrickPredict" },
      { name: "description", content: "Browse IPL 2026 player stats — batting averages, strike rates, wickets and recent form." },
    ],
  }),
  component: PlayersPage,
});

function PlayersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["players"],
    queryFn: () => listPlayers(),
  });

  const players = data ?? [];
  const filtered = players.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading players...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">Error loading players: {(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">IPL 2026 Players</h1>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search players..."
        className="mt-4 w-full max-w-sm rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Player</th>
              <th className="px-3 py-2 text-left font-medium">Role</th>
              <th className="px-3 py-2 text-right font-medium">Mat</th>
              <th className="px-3 py-2 text-right font-medium">Runs</th>
              <th className="px-3 py-2 text-right font-medium">Avg</th>
              <th className="px-3 py-2 text-right font-medium">SR</th>
              <th className="px-3 py-2 text-right font-medium">Wkts</th>
            </tr>
          </thead>
          <tbody className="tabular">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="px-4 py-2">
                    <Link to="/players/$playerId" params={{ playerId: p.id }} className="flex items-center gap-2 font-semibold hover:text-primary">
                      <TeamLogo teamId={p.teamId} size={24} />
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs uppercase text-muted-foreground">{p.role}</td>
                  <td className="px-3 py-2 text-right">{p.matches}</td>
                  <td className="px-3 py-2 text-right">{p.runs}</td>
                  <td className="px-3 py-2 text-right">{(p.battingAverage || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{(p.strikeRate || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-semibold">{p.wickets}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  {search ? "No players found matching your search" : "No players available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
