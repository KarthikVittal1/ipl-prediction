import { useState } from "react";
import { TEAMS } from "@/lib/team-logos";

interface Props {
  teamId: string;
  size?: number;
  className?: string;
}

export function TeamLogo({ teamId, size = 40, className = "" }: Props) {
  const team = TEAMS[teamId];
  const [errored, setErrored] = useState(false);
  const initials = team?.shortName ?? teamId.slice(0, 3).toUpperCase();
  const bg = team?.color ?? "#334155";

  if (errored || !team) {
    return (
      <span
        className={`inline-grid place-items-center rounded-full font-bold text-white ${className}`}
        style={{ width: size, height: size, background: bg, fontSize: size * 0.32 }}
        aria-label={team?.name ?? teamId}
      >
        {initials}
      </span>
    );
  }

  return (
    <span
      className={`inline-grid place-items-center overflow-hidden rounded-full bg-white ring-1 ring-border ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={team.logoUrl}
        alt={team.name}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setErrored(true)}
        style={{ width: "82%", height: "82%", objectFit: "contain" }}
      />
    </span>
  );
}
