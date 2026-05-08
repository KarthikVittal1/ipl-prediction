import { useTeams } from '@/services/api';
import { Link } from '@tanstack/react-router';
import { Loader2, AlertCircle } from 'lucide-react';

export function ApiTeamsComponent() {
  const { data, isLoading, error } = useTeams();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading teams...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Error loading teams: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const teams = data?.teams ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <Link
          key={team.id}
          to="/teams/$teamId"
          params={{ teamId: team.id }}
          className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <h3 className="font-bold">{team.name}</h3>
          <p className="text-xs text-muted-foreground">City: {team.city}</p>
        </Link>
      ))}
    </div>
  );
}
