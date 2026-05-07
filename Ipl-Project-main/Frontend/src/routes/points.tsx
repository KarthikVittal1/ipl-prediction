import { createFileRoute } from "@tanstack/react-router";
import { ApiPointsTableComponent } from "@/components";

export const Route = createFileRoute("/points")({
  head: () => ({
    meta: [
      { title: "IPL 2026 Points Table | CrickPredict" },
      { name: "description", content: "Live IPL 2026 points table — wins, losses, NRR and standings." },
    ],
  }),
  component: PointsPage,
});

function PointsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">IPL 2026 Points Table</h1>
      <div className="mt-6">
        <ApiPointsTableComponent season={2026} />
      </div>
    </div>
  );
}
