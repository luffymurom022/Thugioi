import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, evolutionPathsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/evolution-paths", async (_req, res): Promise<void> => {
  const paths = await db
    .select()
    .from(evolutionPathsTable)
    .orderBy(evolutionPathsTable.toRankLevel);

  res.json(paths.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  })));
});

export default router;
