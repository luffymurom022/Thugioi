import { Router, type IRouter } from "express";
import { eq, sum } from "drizzle-orm";
import { db, zonesTable, creaturesTable } from "@workspace/db";
import {
  GetZoneParams,
  GetZoneResponse,
  ListZonesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/zones", async (_req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable).orderBy(zonesTable.id);

  const result = await Promise.all(zones.map(async (zone) => {
    const popResult = await db
      .select({ total: sum(creaturesTable.population) })
      .from(creaturesTable)
      .where(eq(creaturesTable.habitat, zone.name));
    const currentPopulation = Number(popResult[0]?.total ?? 0);
    return { ...zone, currentPopulation };
  }));

  res.json(ListZonesResponse.parse(result));
});

router.get("/zones/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetZoneParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [zone] = await db
    .select()
    .from(zonesTable)
    .where(eq(zonesTable.id, params.data.id));

  if (!zone) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }

  const creatures = await db
    .select()
    .from(creaturesTable)
    .where(eq(creaturesTable.habitat, zone.name))
    .orderBy(creaturesTable.rankLevel);

  const popResult = await db
    .select({ total: sum(creaturesTable.population) })
    .from(creaturesTable)
    .where(eq(creaturesTable.habitat, zone.name));
  const currentPopulation = Number(popResult[0]?.total ?? 0);

  res.json(GetZoneResponse.parse({
    ...zone,
    currentPopulation,
    creatures: creatures.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
  }));
});

export default router;
