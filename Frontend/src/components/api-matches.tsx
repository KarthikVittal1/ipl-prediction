import { useMatches } from '@/services/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface ApiMatchesComponentProps {
  type?: 'all' | 'live' | 'upcoming' | 'completed';
  limit?: number;
}

export function ApiMatchesComponent({ type = 'all', limit = 20 }: ApiMatchesComponentProps) {
  const [selectedTab, setSelectedTab] = useState(type);
  const { data, isLoading, error } = useMatches(selectedTab, limit);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading matches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Error loading matches: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const matches = data?.matches ?? [];

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['all', 'live', 'upcoming', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              selectedTab === tab
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {matches.length > 0 ? (
          matches.map((match) => (
            <div key={match.id} className="rounded-lg border border-border bg-card p-4">
              <div className="text-sm text-muted-foreground">{match.date}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold">{match.team1}</span>
                <span className="text-xs uppercase text-primary">vs</span>
                <span className="font-semibold">{match.team2}</span>
              </div>
              <div className="mt-3 text-sm">
                <p className="text-muted-foreground">Venue: {match.venue}</p>
                <p className="mt-1 rounded-full bg-primary/20 px-2 py-1 text-xs font-medium text-primary inline-block">
                  {match.status}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No matches found</p>
        )}
      </div>
    </div>
  );
}
