import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, creaturesTable, historyTable, worldStateTable } from "@workspace/db";
import { BreedCreaturesBody } from "@workspace/api-zod";
import { computeChildDNA, BLOODLINE_LABELS } from "../lib/genetics";

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

  // Genetics Engine: compute child DNA
  const child = computeChildDNA(
    {
      name: creatureA.name, element: creatureA.element,
      strength: creatureA.strength, agility: creatureA.agility,
      intelligence: creatureA.intelligence, vitality: creatureA.vitality,
      sizeClass: creatureA.sizeClass, mutationChance: creatureA.mutationChance,
      rankLevel: creatureA.rankLevel,
    },
    {
      name: creatureB.name, element: creatureB.element,
      strength: creatureB.strength, agility: creatureB.agility,
      intelligence: creatureB.intelligence, vitality: creatureB.vitality,
      sizeClass: creatureB.sizeClass, mutationChance: creatureB.mutationChance,
      rankLevel: creatureB.rankLevel,
    }
  );

  const habitat = creatureA.habitat;
  const initialPop = Math.max(Math.floor((creatureA.population + creatureB.population) * 0.08), 8);

  // Combine prey lists from both parents
  const preyA: string[] = JSON.parse(creatureA.preySpecies || "[]");
  const preyB: string[] = JSON.parse(creatureB.preySpecies || "[]");
  const combinedPrey = [...new Set([...preyA, ...preyB])];

  const [newCreature] = await db.insert(creaturesTable).values({
    name: child.name,
    rank: child.rank,
    rankLevel: child.rankLevel,
    element: child.element,
    habitat,
    population: initialPop,
    lifespan: Math.floor(
      ((creatureA.lifespan * child.vitality) + (creatureB.lifespan * child.vitality)) /
      (child.vitality * 2) * 1.1
    ),
    reproductionRate: Math.min(
      0.35,
      (creatureA.reproductionRate + creatureB.reproductionRate) / 2 * (child.isMutant ? 1.2 : 1.0)
    ),
    description: child.description,
    status: "alive",
    isHybrid: true,
    parentA: creatureA.name,
    parentB: creatureB.name,
    energy: 110,
    hunger: 25,
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
    mutationChance: child.mutationChance,
    isMutant: child.isMutant,
    strength: child.strength,
    agility: child.agility,
    intelligence: child.intelligence,
    vitality: child.vitality,
    sizeClass: child.sizeClass,
    bloodline: child.bloodline,
  }).returning();

  const [worldState] = await db.select().from(worldStateTable).limit(1);
  const worldDay = worldState?.worldDay ?? 1;

  const bloodlineLabel = BLOODLINE_LABELS[child.bloodline as keyof typeof BLOODLINE_LABELS] ?? child.bloodline;
  const mutantNote = child.isMutant ? " ĐỘT BIẾN GEN!" : "";
  const msg = `[Năm ${worldDay}] Loài mới: ${child.name} (${child.element}) — ` +
    `Cha: ${creatureA.name} | Mẹ: ${creatureB.name} | Huyết mạch: ${bloodlineLabel}.${mutantNote}`;

  await db.insert(historyTable).values({ worldDay, eventType: "new_species", description: msg });

  res.status(201).json({
    newCreature: { ...newCreature, createdAt: newCreature.createdAt.toISOString() },
    message: msg,
    isMutant: child.isMutant,
    bloodline: child.bloodline,
  });
});

export default router;
