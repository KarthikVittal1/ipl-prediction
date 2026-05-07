import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";
import { getStadium } from "@/lib/api";

export const Route = createFileRoute("/stadiums/$stadiumId")({
  loader: async ({ params, context }) => {
    const res = await context.queryClient.ensureQueryData({
      queryKey: ["stadium", params.stadiumId],
      queryFn: () => getStadium(params.stadiumId),
    });
    if (!res) throw notFound();
    return res;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} - IPL 2026 Venue | CrickPredict` },
          { name: "description", content: `${loaderData.name} in ${loaderData.city}: capacity and notable matches.` },
        ]
      : [],
  }),
  component: StadiumDetail,
});

function StadiumDetail() {
  const id = Route.useParams().stadiumId;
  const { data, isLoading } = useQuery({
    queryKey: ["stadium", id],
    queryFn: () => getStadium(id),
  });

  const stadium = data;
  if (isLoading || !stadium) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="relative h-72 w-full overflow-hidden bg-secondary">
        {stadium.imageUrl && (
          <img src={stadium.imageUrl} alt={stadium.name} className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-7xl items-end px-4 pb-6">
          <div className="text-white">
            <h1 className="text-3xl font-bold sm:text-4xl">{stadium.name}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
              <MapPin className="h-4 w-4" /> {stadium.city}, {stadium.country}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-3">
        <Stat label="Capacity" value={stadium.capacity.toLocaleString()} icon={<Users className="h-4 w-4" />} />
        <Stat label="Established" value={stadium.established || "N/A"} />
        <Stat label="Avg 1st Innings" value={stadium.avgFirstInnings || "N/A"} />
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-12 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pitch report</h2>
          <p className="mt-2">{stadium.pitch}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notable matches</h2>
          {stadium.notableMatches.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm">
              {stadium.notableMatches.map((match) => (
                <li key={match} className="border-b border-border py-1.5 last:border-0">
                  {match}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No notable matches listed.</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12">
        <Link to="/stadiums" className="text-sm text-primary hover:underline">
          Back to all stadiums
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular">{value}</p>
    </div>
  );
}
