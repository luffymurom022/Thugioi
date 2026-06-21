import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, creaturesTable, historyTable, worldStateTable } from "@workspace/db";
import { BreedCreaturesBody } from "@workspace/api-zod";
import { combineElements, combineNames, getRankFromParents } from "../lib/simulation";

const router: IRouter = Router();

router.post("/breeding", async (req, res): Promise<void> => {
  const parsed = BreedCreaturesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { creatureAId, creatureBId } = parsed.data;

  if (creatureAId === creatureBId) {
    res.status(400).json({ error: "Cannot breed a creature with itself" });
    return;
  }

  const [creatureA] = await db.select().from(creaturesTable).where(eq(creaturesTable.id, creatureAId));
  const [creatureB] = await db.select().from(creaturesTable).where(eq(creaturesTable.id, creatureBId));

  if (!creatureA || !creatureB) {
    res.status(400).json({ error: "One or both creatures not found" });
    return;
  }

  if (creatureA.status === "extinct" || creatureB.status === "extinct") {
    res.status(400).json({ error: "Cannot breed extinct creatures" });
    return;
  }

  const newName = combineNames(creatureA.name, creatureB.name);
  const newElement = combineElements(creatureA.element, creatureB.element);
  const { rank, rankLevel } = getRankFromParents(creatureA.rankLevel, creatureB.rankLevel);
  const habitat = creatureA.habitat;
  const initialPop = Math.max(Math.floor((creatureA.population + creatureB.population) * 0.1), 10);

  // Combine prey lists from both parents
  const preyA: string[] = JSON.parse(creatureA.preySpecies || "[]");
  const preyB: string[] = JSON.parse(creatureB.preySpecies || "[]");
  const combinedPrey = [...new Set([...preyA, ...preyB])];

  const [newCreature] = await db.insert(creaturesTable).values({
    name: newName,
    rank,
    rankLevel,
    element: newElement,
    habitat,
    population: initialPop,
    lifespan: Math.floor((creatureA.lifespan + creatureB.lifespan) / 2),
    reproductionRate: (creatureA.reproductionRate + creatureB.reproductionRate) / 2,
    description: `Loài lai giữa ${creatureA.name} và ${creatureB.name}. Mang trong mình sức mạnh nguyên tố ${newElement}.`,
    status: "alive",
    isHybrid: true,
    parentA: creatureA.name,
    parentB: creatureB.name,
    energy: 100,
    hunger: 30,
    ageTicks: 0,
    maturityAge: Math.floor((creatureA.maturityAge + creatureB.maturityAge) / 2),
    gender: "mixed",
    preySpecies: JSON.stringify(combinedPrey),
    predatorSpecies: "[]",
    generation: Math.max(creatureA.generation, creatureB.generation) + 1,
    huntSuccesses: 0,
    evolutionStage: 0,
    evolutionChain: JSON.stringify([creatureA.name, creatureB.name]),
    maxPopulation: Math.floor((creatureA.maxPopulation + creatureB.maxPopulation) / 2),
    dietType: combinedPrey.length > 0 ? "carnivore" : "herbivore",
  }).returning();

  const [worldState] = await db.select().from(worldStateTable).limit(1);
  const worldDay = worldState?.worldDay ?? 1;

  const msg = `[Ngày ${worldDay}] Loài mới xuất hiện: ${newName} (${newElement}) — con lai của ${creatureA.name} và ${creatureB.name}.`;
  await db.insert(historyTable).values({ worldDay, eventType: "new_species", description: msg });

  res.status(201).json({
    newCreature: { ...newCreature, createdAt: newCreature.createdAt.toISOString() },
    message: msg,
  });
});

export default router;
