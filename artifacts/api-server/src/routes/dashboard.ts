import { Router, type IRouter } from "express";
import { eq, sum, count, desc } from "drizzle-orm";
import { db, creaturesTable, zonesTable, historyTable, worldStateTable } from "@workspace/db";
import { GetDashboardResponse, SimulationTickResponse } from "@workspace/api-zod";
import { runSimulationTick } from "../lib/simulation";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res): Promise<void> => {
  const [worldState] = await db.select().from(worldStateTable).limit(1);
  const worldDay = worldState?.worldDay ?? 1;

  const allCreatures = await db.select().from(creaturesTable);
  const totalSpecies = allCreatures.length;
  const totalPopulation = allCreatures.reduce((acc, c) => acc + c.population, 0);
  const extinctSpecies = allCreatures.filter(c => c.status === "extinct").length;
  const livingSpecies = allCreatures.filter(c => c.status === "alive").length;

  const zones = await db.select().from(zonesTable).orderBy(zonesTable.id);
  const zoneStats = await Promise.all(zones.map(async (zone) => {
    const zoneCreatures = allCreatures.filter(c => c.habitat === zone.name && c.status === "alive");
    const population = zoneCreatures.reduce((acc, c) => acc + c.population, 0);
    const speciesCount = zoneCreatures.length;
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      population,
      speciesCount,
      capacity: zone.capacity,
    };
  }));

  const recentEvents = await db
    .select()
    .from(historyTable)
    .orderBy(desc(historyTable.createdAt))
    .limit(10);

  res.json(GetDashboardResponse.parse({
    totalSpecies,
    totalPopulation,
    extinctSpecies,
    livingSpecies,
    worldDay,
    zoneStats,
    recentEvents: recentEvents.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })),
  }));
});

router.post("/simulation/tick", async (_req, res): Promise<void> => {
  const result = await runSimulationTick();
  res.json(SimulationTickResponse.parse(result));
});

export default router;
