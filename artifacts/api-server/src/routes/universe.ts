import { Router } from "express";
import { db, worldsTable, universePortalsTable, universeEventsTable, interworldWarsTable } from "@workspace/db";
import { getUniverseSummary, runUniverseTick } from "../lib/universe-engine";
import { eq, desc } from "drizzle-orm";

const router = Router();

// GET /universe/summary
router.get("/universe/summary", async (_req, res) => {
  try {
    const summary = await getUniverseSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch universe summary" });
  }
});

// GET /universe/worlds
router.get("/universe/worlds", async (_req, res) => {
  try {
    const worlds = await db.select().from(worldsTable);
    res.json(worlds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch worlds" });
  }
});

// GET /universe/portals
router.get("/universe/portals", async (_req, res) => {
  try {
    const portals = await db.select().from(universePortalsTable).orderBy(desc(universePortalsTable.createdAt));
    res.json(portals);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch portals" });
  }
});

// GET /universe/events
router.get("/universe/events", async (_req, res) => {
  try {
    const events = await db.select().from(universeEventsTable).orderBy(desc(universeEventsTable.createdAt)).limit(50);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch universe events" });
  }
});

// GET /universe/wars
router.get("/universe/wars", async (_req, res) => {
  try {
    const wars = await db.select().from(interworldWarsTable).orderBy(desc(interworldWarsTable.createdAt)).limit(30);
    res.json(wars);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch interworld wars" });
  }
});

// POST /universe/tick
router.post("/universe/tick", async (_req, res) => {
  try {
    await runUniverseTick();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Universe tick failed" });
  }
});

export default router;
