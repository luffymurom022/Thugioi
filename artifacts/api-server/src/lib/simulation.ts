import { db, creaturesTable, historyTable, worldStateTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const RANKS = [
  "Động Vật",
  "Dã Thú",
  "Hoang Thú",
  "Linh Thú",
  "Hoàng Thú",
  "Vương Thú",
  "Tôn Thú",
  "Đế Thú",
  "Thánh Thú",
  "Thần Thú",
  "Tiên Thú",
  "Tổ Thú",
  "Sáng Thần Thú",
];

export async function runSimulationTick() {
  let [worldState] = await db.select().from(worldStateTable).limit(1);

  if (!worldState) {
    [worldState] = await db.insert(worldStateTable).values({ worldDay: 1 }).returning();
  }

  const currentDay = worldState.worldDay;
  const nextDay = currentDay + 1;

  const creatures = await db
    .select()
    .from(creaturesTable)
    .where(eq(creaturesTable.status, "alive"));

  const events: string[] = [];
  const populations: { id: number; name: string; population: number; status: string }[] = [];

  for (const creature of creatures) {
    const births = Math.floor(creature.population * creature.reproductionRate * (0.8 + Math.random() * 0.4));
    const deaths = Math.floor(creature.population * (0.05 + Math.random() * 0.05));
    const newPop = Math.max(0, creature.population + births - deaths);

    if (newPop === 0 && creature.population > 0) {
      await db.update(creaturesTable)
        .set({ population: 0, status: "extinct" })
        .where(eq(creaturesTable.id, creature.id));

      const msg = `[Ngày ${nextDay}] Loài ${creature.name} đã tuyệt chủng.`;
      await db.insert(historyTable).values({
        worldDay: nextDay,
        eventType: "extinction",
        description: msg,
      });
      events.push(msg);
      populations.push({ id: creature.id, name: creature.name, population: 0, status: "extinct" });
    } else if (births > 0) {
      await db.update(creaturesTable)
        .set({ population: newPop })
        .where(eq(creaturesTable.id, creature.id));

      const msg = `[Ngày ${nextDay}] ${creature.name} sinh thêm ${births} cá thể. Tổng: ${newPop}.`;
      await db.insert(historyTable).values({
        worldDay: nextDay,
        eventType: "birth",
        description: msg,
      });
      events.push(msg);
      populations.push({ id: creature.id, name: creature.name, population: newPop, status: "alive" });
    } else {
      await db.update(creaturesTable)
        .set({ population: newPop })
        .where(eq(creaturesTable.id, creature.id));
      populations.push({ id: creature.id, name: creature.name, population: newPop, status: "alive" });
    }
  }

  await db.update(worldStateTable)
    .set({ worldDay: nextDay })
    .where(eq(worldStateTable.id, worldState.id));

  return { worldDay: nextDay, events, populations };
}

export function combineElements(elemA: string, elemB: string): string {
  const combos: Record<string, string> = {
    "Hỏa+Lôi": "Lôi Hỏa",
    "Lôi+Hỏa": "Lôi Hỏa",
    "Hỏa+Phong": "Hỏa Phong",
    "Phong+Hỏa": "Hỏa Phong",
    "Thủy+Băng": "Băng",
    "Băng+Thủy": "Băng",
    "Quang+Ám": "Hư Vô",
    "Ám+Quang": "Hư Vô",
    "Thổ+Hỏa": "Nham Thạch",
    "Hỏa+Thổ": "Nham Thạch",
    "Lôi+Phong": "Phong Lôi",
    "Phong+Lôi": "Phong Lôi",
    "Thủy+Phong": "Băng Phong",
    "Phong+Thủy": "Băng Phong",
  };
  const key = `${elemA}+${elemB}`;
  return combos[key] ?? elemA;
}

export function combineNames(nameA: string, nameB: string): string {
  const partsA = nameA.split(" ");
  const partsB = nameB.split(" ");
  const prefix = partsB[0] ?? "";
  const suffix = partsA[partsA.length - 1] ?? "";
  const mid = partsA[0] !== suffix ? partsA[0] : "";
  return [prefix, mid, suffix].filter(Boolean).join(" ");
}

export function getRankFromParents(rankLevelA: number, rankLevelB: number): { rank: string; rankLevel: number } {
  const avgLevel = Math.ceil((rankLevelA + rankLevelB) / 2);
  const boostedLevel = Math.min(avgLevel + 1, RANKS.length);
  return { rank: RANKS[boostedLevel - 1], rankLevel: boostedLevel };
}
