import { createFileRoute } from "@tanstack/react-router";
import { ApiVenuesComponent } from "@/components";

export const Route = createFileRoute("/stadiums")({
  head: () => ({
    meta: [
      { title: "IPL 2026 Stadiums & Venues | CrickPredict" },
      { name: "description", content: "Explore the IPL 2026 venues — capacity, pitch reports and notable matches." },
    ],
  }),
  component: StadiumsPage,
});

function StadiumsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">IPL 2026 Stadiums</h1>
      <div className="mt-6">
        <ApiVenuesComponent />
      </div>
    </div>
  );
}
