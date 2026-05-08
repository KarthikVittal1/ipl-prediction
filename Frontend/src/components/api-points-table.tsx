import { usePointsTable } from '@/services/api';
import { Loader2, AlertCircle } from 'lucide-react';

interface ApiPointsTableComponentProps {
  season?: number;
}

export function ApiPointsTableComponent({ season = 2026 }: ApiPointsTableComponentProps) {
  const { data, isLoading, error } = usePointsTable(season);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading points table...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Error loading points table: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const standings = data?.standings ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left px-4 py-2 font-semibold">Rank</th>
            <th className="text-left px-4 py-2 font-semibold">Team</th>
            <th className="text-center px-4 py-2 font-semibold">P</th>
            <th className="text-center px-4 py-2 font-semibold">W</th>
            <th className="text-center px-4 py-2 font-semibold">L</th>
            <th className="text-center px-4 py-2 font-semibold">Points</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, idx) => (
            <tr key={team.teamId} className="border-b border-border hover:bg-accent/50 transition-colors">
              <td className="px-4 py-3 font-semibold">{idx + 1}</td>
              <td className="px-4 py-3">{team.teamName}</td>
              <td className="text-center px-4 py-3">{team.played}</td>
              <td className="text-center px-4 py-3">{team.won}</td>
              <td className="text-center px-4 py-3">{team.lost}</td>
              <td className="text-center px-4 py-3 font-bold text-primary">{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
