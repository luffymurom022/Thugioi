import { Router, type IRouter } from "express";
import { db, worldAgesTable, legendsTable, mythsTable, bloodlineHistoriesTable, loreBooksTable, loreNewsTable, worldStateTable } from "@workspace/db";
import { desc, asc, eq } from "drizzle-orm";
import { getLoreSummary, runLoreEngine } from "../lib/lore-engine";

const router: IRouter = Router();

router.get("/lore/ages", async (_req, res): Promise<void> => {
  const ages = await db.select().from(worldAgesTable).orderBy(asc(worldAgesTable.startDay));
  res.json(ages);
});

router.get("/lore/current-age", async (_req, res): Promise<void> => {
  const ages = await db.select().from(worldAgesTable).where(eq(worldAgesTable.isCurrent, true)).limit(1);
  if (ages.length === 0) {
    res.status(404).json({ error: "No age found" });
    return;
  }
  res.json(ages[0]);
});

router.get("/lore/legends", async (_req, res): Promise<void> => {
  const legends = await db.select().from(legendsTable).orderBy(desc(legendsTable.worldDay));
  res.json(legends);
});

router.get("/lore/myths", async (_req, res): Promise<void> => {
  const myths = await db.select().from(mythsTable).orderBy(desc(mythsTable.worldDay));
  res.json(myths);
});

router.get("/lore/bloodlines", async (_req, res): Promise<void> => {
  const bloodlines = await db.select().from(bloodlineHistoriesTable).orderBy(desc(bloodlineHistoriesTable.totalAgeTicks));
  res.json(bloodlines);
});

router.get("/lore/books", async (_req, res): Promise<void> => {
  const books = await db.select().from(loreBooksTable).orderBy(asc(loreBooksTable.category));
  res.json(books);
});

router.get("/lore/news", async (_req, res): Promise<void> => {
  const news = await db.select().from(loreNewsTable).orderBy(desc(loreNewsTable.worldDay)).limit(20);
  res.json(news);
});

router.get("/lore/summary", async (_req, res): Promise<void> => {
  const [worldState] = await db.select().from(worldStateTable).limit(1);
  const worldDay = worldState?.worldDay ?? 1;
  const summary = await getLoreSummary(worldDay);
  res.json(summary);
});

router.post("/lore/generate", async (_req, res): Promise<void> => {
  const [worldState] = await db.select().from(worldStateTable).limit(1);
  const worldDay = worldState?.worldDay ?? 1;
  await runLoreEngine(worldDay);
  res.json({ success: true, worldDay });
});

export default router;
