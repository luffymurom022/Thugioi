import { Router, type IRouter } from "express";
import { db, historyTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { ListHistoryQueryParams, ListHistoryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/history", async (req, res): Promise<void> => {
  const params = ListHistoryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const limit = params.data.limit ?? 50;
  const offset = params.data.offset ?? 0;

  const entries = await db
    .select()
    .from(historyTable)
    .orderBy(desc(historyTable.worldDay), desc(historyTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(ListHistoryResponse.parse(entries.map(e => ({ ...e, createdAt: e.createdAt.toISOString() }))));
});

export default router;
