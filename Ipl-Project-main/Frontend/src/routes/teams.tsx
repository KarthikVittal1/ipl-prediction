import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/teams")({
  head: () => ({
    meta: [
      { title: "IPL 2026 Teams & Franchises | CrickPredict" },
      { name: "description", content: "All ten IPL 2026 franchises with logos, recent form and squads." },
    ],
  }),
  component: () => <Outlet />,
});
