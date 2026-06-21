import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, creaturesTable, zonesTable, historyTable, worldStateTable, evolutionPathsTable, beastKingdomsTable } from "@workspace/db";
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
  const mutatedSpeciesCount = allCreatures.filter(c => c.isMutant).length;

  const zones = await db.select().from(zonesTable).orderBy(zonesTable.id);
  const zoneStats = zones.map((zone) => {
    const zoneCreatures = allCreatures.filter(c => c.habitat === zone.name && c.status === "alive");
    const population = zoneCreatures.reduce((acc, c) => acc + c.population, 0);
    const speciesCount = zoneCreatures.length;
    return { zoneId: zone.id, zoneName: zone.name, population, speciesCount, capacity: zone.capacity };
  });

  const recentEvents = await db
    .select()
    .from(historyTable)
    .orderBy(desc(historyTable.createdAt))
    .limit(10);

  // Enhanced creature stats
  const aliveCreatures = allCreatures.filter(c => c.status === "alive");
  const strongestSpecies = [...aliveCreatures].sort((a, b) => b.rankLevel - a.rankLevel)[0] ?? null;
  const mostPopulousSpecies = [...aliveCreatures].sort((a, b) => b.population - a.population)[0] ?? null;
  const newestSpecies = [...allCreatures].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;

  // Evolution progress
  const allPaths = await db.select().from(evolutionPathsTable);
  const evolvingSpeciesCount = aliveCreatures.filter(c => {
    const path = allPaths.find(p => p.fromSpecies === c.name);
    if (!path) return false;
    let conditionsMet = 0;
    if (c.population >= path.minPopulation * 0.6) conditionsMet++;
    if (c.huntSuccesses >= path.minHuntSuccesses * 0.6) conditionsMet++;
    if (c.ageTicks >= path.minAgeTicks * 0.6) conditionsMet++;
    return conditionsMet >= 2;
  }).length;

  // Kingdom stats (V5)
  const kingdoms = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.status, "active"));
  const totalKingdoms = kingdoms.length;
  const strongestKingdom = [...kingdoms].sort((a, b) => b.militaryPower - a.militaryPower)[0] ?? null;
  const richestKingdom  = [...kingdoms].sort((a, b) => b.economy - a.economy)[0] ?? null;
  const largestKingdom  = [...kingdoms].sort((a, b) => b.population - a.population)[0] ?? null;

  res.json(GetDashboardResponse.parse({
    totalSpecies,
    totalPopulation,
    extinctSpecies,
    livingSpecies,
    worldDay,
    zoneStats,
    recentEvents: recentEvents.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })),
    strongestSpeciesName: strongestSpecies?.name ?? null,
    mostPopulousSpeciesName: mostPopulousSpecies?.name ?? null,
    mostPopulousCount: mostPopulousSpecies?.population ?? null,
    newestSpeciesName: newestSpecies?.name ?? null,
    evolvingSpeciesCount,
    mutatedSpeciesCount,
    totalKingdoms,
    strongestKingdomName: strongestKingdom?.name ?? null,
    richestKingdomName: richestKingdom?.name ?? null,
    largestKingdomName: largestKingdom?.name ?? null,
  }));
});

router.post("/simulation/tick", async (_req, res): Promise<void> => {
  const result = await runSimulationTick();
  res.json(SimulationTickResponse.parse(result));
});

export default router;
