import { useVenues } from '@/services/api';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function ApiVenuesComponent() {
  const { data, isLoading, error } = useVenues();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Loading venues...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">Error loading venues: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const venues = data?.venues ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {venues.map((venue) => (
        <Link
          key={venue.id}
          to="/stadiums/$stadiumId"
          params={{ stadiumId: venue.id }}
          className="rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-1" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{venue.name}</h3>
              <p className="text-sm text-muted-foreground">{venue.city}</p>
              <p className="text-xs text-muted-foreground mt-2">Capacity: {venue.capacity?.toLocaleString()}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
