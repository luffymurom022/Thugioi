import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, creaturesTable } from "@workspace/db";
import { BreedCreaturesBody } from "@workspace/api-zod";
import { computeChildDNA, BLOODLINE_LABELS } from "../lib/genetics";

const router: IRouter = Router();

router.post("/genetics/preview", async (req, res): Promise<void> => {
  const parsed = BreedCreaturesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { creatureAId, creatureBId } = parsed.data;

  const [creatureA] = await db.select().from(creaturesTable).where(eq(creaturesTable.id, creatureAId));
  const [creatureB] = await db.select().from(creaturesTable).where(eq(creaturesTable.id, creatureBId));

  if (!creatureA || !creatureB) {
    res.status(400).json({ error: "One or both creatures not found" });
    return;
  }

  if (creatureA.status === "extinct" || creatureB.status === "extinct") {
    res.status(400).json({ error: "Cannot preview extinct creatures" });
    return;
  }

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

  res.json({
    childDna: {
      strength: child.strength,
      agility: child.agility,
      intelligence: child.intelligence,
      vitality: child.vitality,
      sizeClass: child.sizeClass,
      bloodline: child.bloodline,
      mutationChance: child.mutationChance,
    },
    element: child.element,
    name: child.name,
    rank: child.rank,
    rankLevel: child.rankLevel,
    bloodline: child.bloodline,
    isMutant: child.isMutant,
    mutationSummary: child.mutationSummary,
    description: child.description,
    parentADna: {
      strength: creatureA.strength,
      agility: creatureA.agility,
      intelligence: creatureA.intelligence,
      vitality: creatureA.vitality,
      sizeClass: creatureA.sizeClass,
      bloodline: creatureA.bloodline,
      mutationChance: creatureA.mutationChance,
    },
    parentBDna: {
      strength: creatureB.strength,
      agility: creatureB.agility,
      intelligence: creatureB.intelligence,
      vitality: creatureB.vitality,
      sizeClass: creatureB.sizeClass,
      bloodline: creatureB.bloodline,
      mutationChance: creatureB.mutationChance,
    },
  });
});

export default router;
