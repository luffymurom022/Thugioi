import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, creaturesTable } from "@workspace/db";
import {
  ListCreaturesQueryParams,
  GetCreatureParams,
  GetCreatureResponse,
  ListCreaturesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/creatures", async (req, res): Promise<void> => {
  const params = ListCreaturesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const conditions = [];
  if (params.data.zone) {
    conditions.push(eq(creaturesTable.habitat, params.data.zone));
  }
  if (params.data.element) {
    conditions.push(eq(creaturesTable.element, params.data.element));
  }
  if (params.data.status) {
    conditions.push(eq(creaturesTable.status, params.data.status));
  }

  const creatures = await db
    .select()
    .from(creaturesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(creaturesTable.rankLevel, creaturesTable.name);

  res.json(ListCreaturesResponse.parse(creatures.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }))));
});

router.get("/creatures/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetCreatureParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [creature] = await db
    .select()
    .from(creaturesTable)
    .where(eq(creaturesTable.id, params.data.id));

  if (!creature) {
    res.status(404).json({ error: "Creature not found" });
    return;
  }

  res.json(GetCreatureResponse.parse({ ...creature, createdAt: creature.createdAt.toISOString() }));
});

export default router;
