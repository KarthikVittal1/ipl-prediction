import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getMatch,
  getPlayer,
  getStadium,
  getTeam,
  listMatches,
  listPlayers,
  listStadiums,
  listTeams,
} from "./cricket.server";

const idInput = z.object({ id: z.string().min(1).max(64) });

export const getMatchesFn = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({ filter: z.enum(["live", "upcoming", "completed"]).optional() })
      .optional()
      .default({})
  )
  .handler(async ({ data }) => {
    return { data: await listMatches(data?.filter) };
  });

export const getMatchFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(async ({ data }) => ({ data: await getMatch(data.id) }));

export const getTeamsFn = createServerFn({ method: "GET" }).handler(async () => ({
  data: await listTeams(),
}));

export const getTeamFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(async ({ data }) => ({ data: await getTeam(data.id) }));

export const getPlayersFn = createServerFn({ method: "GET" }).handler(async () => ({
  data: await listPlayers(),
}));

export const getPlayerFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(async ({ data }) => ({ data: await getPlayer(data.id) }));

export const getStadiumsFn = createServerFn({ method: "GET" }).handler(async () => ({
  data: await listStadiums(),
}));

export const getStadiumFn = createServerFn({ method: "GET" })
  .inputValidator(idInput)
  .handler(async ({ data }) => ({ data: await getStadium(data.id) }));
