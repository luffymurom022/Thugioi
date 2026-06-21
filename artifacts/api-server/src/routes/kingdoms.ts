import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, territoriesTable, beastKingdomsTable, packsTable, kingdomRelationsTable, historyTable } from "@workspace/db";
import { seedTerritories } from "../lib/kingdom-engine";

const router: IRouter = Router();

// Territories
router.get("/territories", async (_req, res): Promise<void> => {
  await seedTerritories();
  const territories = await db.select().from(territoriesTable).orderBy(territoriesTable.id);
  res.json(territories.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })));
});

router.get("/territories/:zoneName", async (req, res): Promise<void> => {
  const [t] = await db.select().from(territoriesTable)
    .where(eq(territoriesTable.zoneName, req.params.zoneName));
  if (!t) { res.status(404).json({ error: "Territory not found" }); return; }
  res.json({ ...t, createdAt: t.createdAt.toISOString() });
});

// Beast Kingdoms
router.get("/kingdoms", async (_req, res): Promise<void> => {
  const kingdoms = await db.select().from(beastKingdomsTable)
    .orderBy(desc(beastKingdomsTable.influence));
  res.json(kingdoms.map(k => ({ ...k, createdAt: k.createdAt.toISOString() })));
});

router.get("/kingdoms/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [kingdom] = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.id, id));
  if (!kingdom) { res.status(404).json({ error: "Kingdom not found" }); return; }

  const packs = await db.select().from(packsTable).where(eq(packsTable.kingdomName, kingdom.name));
  const territories = await db.select().from(territoriesTable)
    .where(eq(territoriesTable.controllingKingdom, kingdom.name));
  const relations = await db.select().from(kingdomRelationsTable).where(
    eq(kingdomRelationsTable.kingdomNameA, kingdom.name)
  );

  res.json({
    ...kingdom,
    createdAt: kingdom.createdAt.toISOString(),
    packs: packs.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })),
    territories: territories.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })),
    relations: relations.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
  });
});

// Packs
router.get("/packs", async (_req, res): Promise<void> => {
  const packs = await db.select().from(packsTable)
    .where(eq(packsTable.status, "active"))
    .orderBy(desc(packsTable.population));
  res.json(packs.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

// Kingdom relations
router.get("/kingdom-relations", async (_req, res): Promise<void> => {
  const relations = await db.select().from(kingdomRelationsTable)
    .orderBy(desc(kingdomRelationsTable.sinceDay));
  res.json(relations.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

export default router;
