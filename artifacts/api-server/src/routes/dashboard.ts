import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, creaturesTable, zonesTable, historyTable, worldStateTable, evolutionPathsTable, beastKingdomsTable, warsTable, heroesTable } from "@workspace/db";
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
  const livingSpecies  = allCreatures.filter(c => c.status === "alive").length;
  const mutatedSpeciesCount = allCreatures.filter(c => c.isMutant).length;

  const zones = await db.select().from(zonesTable).orderBy(zonesTable.id);
  const zoneStats = zones.map((zone) => {
    const zoneCreatures = allCreatures.filter(c => c.habitat === zone.name && c.status === "alive");
    return {
      zoneId: zone.id, zoneName: zone.name,
      population:   zoneCreatures.reduce((acc, c) => acc + c.population, 0),
      speciesCount: zoneCreatures.length,
      capacity:     zone.capacity,
    };
  });

  const recentEvents = await db.select().from(historyTable).orderBy(desc(historyTable.createdAt)).limit(10);

  const aliveCreatures    = allCreatures.filter(c => c.status === "alive");
  const strongestSpecies  = [...aliveCreatures].sort((a, b) => b.rankLevel - a.rankLevel)[0] ?? null;
  const mostPopulous      = [...aliveCreatures].sort((a, b) => b.population - a.population)[0] ?? null;
  const newestSpecies     = [...allCreatures].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;

  const allPaths = await db.select().from(evolutionPathsTable);
  const evolvingSpeciesCount = aliveCreatures.filter(c => {
    const path = allPaths.find(p => p.fromSpecies === c.name);
    if (!path) return false;
    let met = 0;
    if (c.population >= path.minPopulation * 0.6) met++;
    if (c.huntSuccesses >= path.minHuntSuccesses * 0.6) met++;
    if (c.ageTicks >= path.minAgeTicks * 0.6) met++;
    return met >= 2;
  }).length;

  // Kingdom stats (V5)
  const kingdoms        = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.status, "active"));
  const totalKingdoms   = kingdoms.length;
  const strongestKingdom = [...kingdoms].sort((a, b) => b.militaryPower - a.militaryPower)[0] ?? null;
  const richestKingdom   = [...kingdoms].sort((a, b) => b.economy - a.economy)[0] ?? null;
  const largestKingdom   = [...kingdoms].sort((a, b) => b.population - a.population)[0] ?? null;

  // War stats (V6)
  const allWars             = await db.select().from(warsTable);
  const activeWarsCount     = allWars.filter(w => w.status === "ongoing").length;
  const mostAggressive      = [...kingdoms].sort((a, b) => b.warCount - a.warCount)[0] ?? null;
  const totalTerrConquered  = allWars.filter(w => w.territoryWon !== null && w.status === "attacker_won").length;

  // Hero stats (V6)
  const allHeroes        = await db.select().from(heroesTable).where(eq(heroesTable.status, "active"));
  const activeHeroesCount = allHeroes.length;

  res.json(GetDashboardResponse.parse({
    totalSpecies,
    totalPopulation,
    extinctSpecies,
    livingSpecies,
    worldDay,
    zoneStats,
    recentEvents: recentEvents.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })),
    strongestSpeciesName:    strongestSpecies?.name ?? null,
    mostPopulousSpeciesName: mostPopulous?.name ?? null,
    mostPopulousCount:       mostPopulous?.population ?? null,
    newestSpeciesName:       newestSpecies?.name ?? null,
    evolvingSpeciesCount,
    mutatedSpeciesCount,
    totalKingdoms,
    strongestKingdomName:        strongestKingdom?.name ?? null,
    richestKingdomName:          richestKingdom?.name ?? null,
    largestKingdomName:          largestKingdom?.name ?? null,
    activeWarsCount,
    mostAggressiveKingdom:       mostAggressive?.warCount ?? 0 > 0 ? mostAggressive?.name ?? null : null,
    totalTerritoriesConquered:   totalTerrConquered,
    activeHeroesCount,
  }));
});

router.post("/simulation/tick", async (_req, res): Promise<void> => {
  const result = await runSimulationTick();
  res.json(SimulationTickResponse.parse(result));
});

export default router;
