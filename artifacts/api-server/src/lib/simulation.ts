import { db, creaturesTable, historyTable, worldStateTable, worldEventsTable, evolutionPathsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const RANKS = [
  "Động Vật", "Dã Thú", "Hoang Thú", "Linh Thú", "Hoàng Thú",
  "Vương Thú", "Tôn Thú", "Đế Thú", "Thánh Thú", "Thần Thú",
  "Tiên Thú", "Tổ Thú", "Sáng Thần Thú",
];

const WORLD_EVENTS = [
  {
    name: "Hạn Hán",
    zones: ["all"],
    effect: "population",
    severity: 0.12,
    description: "Hạn hán kéo dài làm cạn kiệt nguồn nước, dân số giảm mạnh.",
  },
  {
    name: "Núi Lửa Phun Trào",
    zones: ["Hỏa Sơn Vực"],
    effect: "mixed_fire",
    severity: 0.18,
    description: "Núi lửa phun trào! Các loài phi Hỏa bị thiệt hại nặng. Sinh vật Hỏa tăng năng lượng.",
  },
  {
    name: "Bão Tuyết Cực Đại",
    zones: ["Băng Tuyết Vực"],
    effect: "mixed_ice",
    severity: 0.15,
    description: "Bão tuyết cực đại quét qua Băng Tuyết Vực. Sinh vật Băng được tăng cường, loài khác suy yếu.",
  },
  {
    name: "Dịch Bệnh",
    zones: ["all"],
    effect: "single_species",
    severity: 0.25,
    description: "Dịch bệnh bùng phát tấn công một loài ngẫu nhiên.",
  },
  {
    name: "Thiên Thạch Rơi",
    zones: ["all"],
    effect: "population",
    severity: 0.20,
    description: "Thiên thạch rơi xuống thế giới! Mọi khu vực đều bị ảnh hưởng.",
  },
  {
    name: "Mùa Xuân Phồn Thịnh",
    zones: ["Cổ Mộc Vực"],
    effect: "boost",
    severity: 0.15,
    description: "Cổ Mộc Vực bước vào mùa xuân phồn thịnh, tài nguyên dồi dào, dân số tăng vọt.",
  },
  {
    name: "Đêm Thần Bí",
    zones: ["all"],
    effect: "energy_boost",
    severity: 0.1,
    description: "Một đêm thần bí bao phủ thế giới, năng lượng tâm linh tràn đầy khắp nơi.",
  },
  {
    name: "Sóng Thần Nguyên Tố",
    zones: ["all"],
    effect: "energy_boost",
    severity: 0.12,
    description: "Sóng năng lượng nguyên tố nguyên thủy tràn qua thế giới, kích hoạt tiềm năng tiến hóa.",
  },
];

const MUTATION_ELEMENTS: Record<string, string[]> = {
  "Hỏa": ["Lôi Hỏa", "Thần Hỏa", "Hỏa Ám"],
  "Lôi": ["Lôi Hỏa", "Phong Lôi", "Lôi Băng"],
  "Kim": ["Nham Thạch", "Quang Kim", "Địa Kim"],
  "Ám": ["Hư Vô", "Địa Ám", "Ám Băng"],
  "Băng": ["Lôi Băng", "Ám Băng", "Băng Phong"],
  "Thổ": ["Nham Thạch", "Địa Ám", "Địa Kim"],
};

function r(min: number, max: number) { return Math.random() * (max - min) + min; }
function ri(min: number, max: number) { return Math.floor(r(min, max)); }
function parseJson(s: string): string[] { try { return JSON.parse(s) as string[]; } catch { return []; } }
function pick<T>(arr: T[]): T { return arr[ri(0, arr.length)]; }

async function logHistory(worldDay: number, eventType: string, description: string) {
  await db.insert(historyTable).values({ worldDay, eventType, description });
}

// ============================================================
// MUTATION SYSTEM
// ============================================================
async function applyMutation(
  parent: typeof creaturesTable.$inferSelect,
  worldDay: number
): Promise<{ name: string; element: string; reproductionRate: number; lifespan: number; energy: number; isMutant: boolean }> {
  const mutantSuffixes = ["Dị Chủng", "Biến Thể", "Quái Dị", "Hóa Thể"];
  const mutantName = `${parent.name} ${pick(mutantSuffixes)}`;

  // Random stat boosts for mutant
  const elementVariants = MUTATION_ELEMENTS[parent.element] ?? [parent.element];
  const newElement = Math.random() < 0.5 ? pick(elementVariants) : parent.element;

  const newReproRate = Math.min(0.4, parent.reproductionRate * r(1.1, 1.5));
  const newLifespan = Math.floor(parent.lifespan * r(1.1, 1.4));
  const newEnergy = Math.min(200, parent.energy + ri(15, 40));

  await logHistory(worldDay, "mutation",
    `[Năm ${worldDay}] ĐỘT BIẾN! ${mutantName} xuất hiện từ ${parent.name}. Nguyên tố: ${newElement}, thể lực vượt trội.`
  );

  return { name: mutantName, element: newElement, reproductionRate: newReproRate, lifespan: newLifespan, energy: newEnergy, isMutant: true };
}

// ============================================================
// FOOD CHAIN
// ============================================================
async function runFoodChain(
  creatures: (typeof creaturesTable.$inferSelect)[],
): Promise<Map<number, { popDelta: number; energyDelta: number; kills: number }>> {
  const deltas = new Map<number, { popDelta: number; energyDelta: number; kills: number }>();
  const creatureByName = new Map(creatures.map(c => [c.name, c]));

  for (const creature of creatures) {
    if (creature.status === "extinct" || creature.population === 0) continue;
    const preyList = parseJson(creature.preySpecies);

    if (preyList.length === 0 || creature.dietType === "herbivore") {
      const d = deltas.get(creature.id) ?? { popDelta: 0, energyDelta: 0, kills: 0 };
      d.energyDelta += ri(5, 15);
      deltas.set(creature.id, d);
      continue;
    }

    let hunted = false;
    for (const preyName of preyList) {
      const prey = creatureByName.get(preyName);
      if (!prey || prey.population <= 5 || prey.status === "extinct") continue;
      const killAmount = Math.max(1, Math.floor(creature.population * r(0.01, 0.03)));
      const actualKill = Math.min(killAmount, Math.floor(prey.population * 0.3));
      const preyDelta = deltas.get(prey.id) ?? { popDelta: 0, energyDelta: 0, kills: 0 };
      preyDelta.popDelta -= actualKill;
      deltas.set(prey.id, preyDelta);
      const predDelta = deltas.get(creature.id) ?? { popDelta: 0, energyDelta: 0, kills: 0 };
      predDelta.energyDelta += Math.floor(actualKill * r(0.5, 1.0));
      predDelta.kills += actualKill;
      deltas.set(creature.id, predDelta);
      hunted = true;
      break;
    }

    if (!hunted) {
      const d = deltas.get(creature.id) ?? { popDelta: 0, energyDelta: 0, kills: 0 };
      d.energyDelta -= ri(10, 25);
      deltas.set(creature.id, d);
    }
  }

  return deltas;
}

// ============================================================
// EVOLUTION ENGINE
// ============================================================
async function checkEvolution(
  creature: typeof creaturesTable.$inferSelect,
  worldDay: number
): Promise<boolean> {
  if (creature.population < 30) return false;

  const paths = await db
    .select()
    .from(evolutionPathsTable)
    .where(eq(evolutionPathsTable.fromSpecies, creature.name));

  if (paths.length === 0) return false;

  for (const path of paths) {
    const conditionsMet =
      creature.population >= path.minPopulation &&
      creature.huntSuccesses >= path.minHuntSuccesses &&
      creature.ageTicks >= path.minAgeTicks;

    if (!conditionsMet) continue;

    // Check if evolved form already exists
    const [existing] = await db
      .select()
      .from(creaturesTable)
      .where(eq(creaturesTable.name, path.toSpecies));

    if (existing) {
      const migrate = Math.floor(creature.population * 0.12);
      if (migrate < 1) continue;
      await db.update(creaturesTable)
        .set({ population: existing.population + migrate, status: "alive" })
        .where(eq(creaturesTable.id, existing.id));
      await db.update(creaturesTable)
        .set({ population: creature.population - migrate, evolutionStage: creature.evolutionStage + 1 })
        .where(eq(creaturesTable.id, creature.id));
    } else {
      const migrate = Math.floor(creature.population * 0.20);
      await db.insert(creaturesTable).values({
        name: path.toSpecies,
        rank: path.toRank,
        rankLevel: path.toRankLevel,
        element: path.toElement,
        habitat: creature.habitat,
        population: Math.max(migrate, 5),
        lifespan: Math.floor(creature.lifespan * 1.3),
        reproductionRate: creature.reproductionRate * 0.85,
        description: path.toDescription,
        status: "alive",
        isHybrid: false,
        energy: 130,
        hunger: 15,
        ageTicks: 0,
        maturityAge: creature.maturityAge + 2,
        gender: "mixed",
        preySpecies: creature.preySpecies,
        predatorSpecies: creature.predatorSpecies,
        generation: creature.generation + 1,
        huntSuccesses: 0,
        evolutionStage: creature.evolutionStage + 1,
        evolutionChain: JSON.stringify([...parseJson(creature.evolutionChain), creature.name]),
        maxPopulation: Math.floor(creature.maxPopulation * 0.75),
        dietType: creature.dietType,
        mutationChance: creature.mutationChance,
        isMutant: false,
      });
      await db.update(creaturesTable)
        .set({ population: creature.population - migrate, evolutionStage: creature.evolutionStage + 1 })
        .where(eq(creaturesTable.id, creature.id));
    }

    const msg = `[Năm ${worldDay}] TIẾN HÓA! ${creature.name} → ${path.toSpecies}! Loài ${path.toRank} xuất hiện tại ${creature.habitat}.`;
    await logHistory(worldDay, "evolution", msg);
    return true;
  }

  return false;
}

// ============================================================
// WORLD EVENT
// ============================================================
async function triggerWorldEvent(
  creatures: (typeof creaturesTable.$inferSelect)[],
  worldDay: number
): Promise<string | null> {
  const event = pick(WORLD_EVENTS);
  await db.insert(worldEventsTable).values({
    worldDay,
    eventName: event.name,
    targetZone: event.zones[0] ?? "all",
    targetSpecies: "all",
    effectType: event.effect,
    severity: event.severity,
    description: event.description,
  });

  const affected = event.zones[0] === "all"
    ? creatures
    : creatures.filter(c => c.habitat === event.zones[0]);

  for (const creature of affected) {
    if (creature.status === "extinct" || creature.population === 0) continue;
    let newPop = creature.population;
    let newEnergy = creature.energy;

    switch (event.effect) {
      case "population":
        newPop = Math.max(0, Math.floor(creature.population * (1 - event.severity * r(0.5, 1.5))));
        break;
      case "boost":
        newPop = Math.floor(creature.population * (1 + event.severity));
        newEnergy = Math.min(200, creature.energy + 30);
        break;
      case "energy_boost":
        newEnergy = Math.min(200, creature.energy + ri(20, 40));
        break;
      case "mixed_fire":
        if (creature.element === "Hỏa" || creature.element.includes("Hỏa")) {
          newEnergy = Math.min(200, creature.energy + 40);
          newPop = Math.floor(creature.population * 1.05);
        } else if (creature.habitat === "Hỏa Sơn Vực") {
          newPop = Math.max(0, Math.floor(creature.population * (1 - event.severity)));
        }
        break;
      case "mixed_ice":
        if (creature.element === "Băng" || creature.element.includes("Băng")) {
          newEnergy = Math.min(200, creature.energy + 35);
        } else if (creature.habitat === "Băng Tuyết Vực") {
          newPop = Math.max(0, Math.floor(creature.population * (1 - event.severity)));
        }
        break;
      case "single_species":
        continue;
    }

    await db.update(creaturesTable)
      .set({ population: newPop, energy: newEnergy })
      .where(eq(creaturesTable.id, creature.id));

    if (newPop === 0 && creature.population > 0) {
      await db.update(creaturesTable).set({ status: "extinct" }).where(eq(creaturesTable.id, creature.id));
      await logHistory(worldDay, "extinction", `[Năm ${worldDay}] Loài ${creature.name} tuyệt chủng do ${event.name}!`);
    }
  }

  if (event.effect === "single_species" && affected.length > 0) {
    const victim = pick(affected.filter(c => c.status !== "extinct" && c.population > 0));
    if (victim) {
      const loss = Math.floor(victim.population * event.severity * r(0.8, 1.2));
      const newPop = Math.max(0, victim.population - loss);
      await db.update(creaturesTable)
        .set({ population: newPop, status: newPop === 0 ? "extinct" : "alive" })
        .where(eq(creaturesTable.id, victim.id));
      const msg = newPop === 0
        ? `[Năm ${worldDay}] Dịch bệnh diệt vong loài ${victim.name}!`
        : `[Năm ${worldDay}] Dịch bệnh tàn phá loài ${victim.name}: mất ${loss} cá thể.`;
      await logHistory(worldDay, newPop === 0 ? "extinction" : "disaster", msg);
    }
  }

  const msg = `[Năm ${worldDay}] SỰ KIỆN: ${event.name} — ${event.description}`;
  await logHistory(worldDay, "event", msg);
  return msg;
}

// ============================================================
// MAIN TICK
// ============================================================
export async function runSimulationTick() {
  let [worldState] = await db.select().from(worldStateTable).limit(1);
  if (!worldState) {
    [worldState] = await db.insert(worldStateTable).values({ worldDay: 1 }).returning();
  }

  const nextDay = worldState.worldDay + 1;
  const allCreatures = await db.select().from(creaturesTable);
  const alive = allCreatures.filter(c => c.status === "alive" && c.population > 0);
  const events: string[] = [];
  const populations: { id: number; name: string; population: number; status: string }[] = [];

  // Step 1: Food chain deltas
  const foodDeltas = await runFoodChain(alive);

  // Step 2: Per-species simulation
  const newMutants: (typeof creaturesTable.$inferInsert)[] = [];

  for (const creature of alive) {
    const fd = foodDeltas.get(creature.id) ?? { popDelta: 0, energyDelta: 0, kills: 0 };
    const newAgeTicks = creature.ageTicks + 1;

    // Energy: gains from hunting, loses from living
    let newEnergy = Math.max(0, Math.min(200, creature.energy + fd.energyDelta - ri(3, 8)));
    const newHunger = newEnergy < 40
      ? Math.min(100, creature.hunger + ri(10, 20))
      : Math.max(0, creature.hunger - ri(5, 10));

    // Death rates
    let deathRate = r(0.02, 0.05);
    if (newEnergy < 30) deathRate += r(0.05, 0.12);
    if (newAgeTicks > creature.lifespan) deathRate += r(0.05, 0.15);

    const zoneCreatures = alive.filter(c => c.habitat === creature.habitat);
    const zonePop = zoneCreatures.reduce((s, c) => s + c.population, 0);
    const zoneCapacity = creature.habitat === "Hỏa Sơn Vực" ? 6000
      : creature.habitat === "Băng Tuyết Vực" ? 4500 : 10000;
    const capacityPressure = Math.max(0, (zonePop - zoneCapacity) / zoneCapacity);
    if (capacityPressure > 0) deathRate += capacityPressure * 0.15;

    const deaths = Math.floor(creature.population * Math.min(deathRate, 0.40));

    // Births
    let births = 0;
    if (newEnergy > 60 && newAgeTicks >= creature.maturityAge && creature.population >= 4) {
      const capacityFactor = Math.max(0, 1 - capacityPressure * 2);
      const energyFactor = (newEnergy - 60) / 140;
      births = Math.floor(creature.population * creature.reproductionRate * capacityFactor * energyFactor * r(0.7, 1.3));
    }

    // Mutation on birth
    if (births > 0 && Math.random() < creature.mutationChance) {
      const mutantData = await applyMutation(creature, nextDay);
      newMutants.push({
        name: mutantData.name,
        rank: creature.rank,
        rankLevel: creature.rankLevel,
        element: mutantData.element,
        habitat: creature.habitat,
        population: Math.max(1, Math.floor(births * 0.1)),
        lifespan: mutantData.lifespan,
        reproductionRate: mutantData.reproductionRate,
        description: `Đột biến từ ${creature.name}. Mang đặc điểm dị thường vượt ngoài tiến hóa thông thường.`,
        status: "alive",
        isHybrid: false,
        energy: mutantData.energy,
        hunger: creature.hunger,
        ageTicks: 0,
        maturityAge: creature.maturityAge,
        gender: "mixed",
        preySpecies: creature.preySpecies,
        predatorSpecies: creature.predatorSpecies,
        generation: creature.generation + 1,
        huntSuccesses: 0,
        evolutionStage: creature.evolutionStage,
        evolutionChain: JSON.stringify([creature.name]),
        maxPopulation: creature.maxPopulation,
        dietType: creature.dietType,
        mutationChance: Math.min(0.05, creature.mutationChance * 1.2),
        isMutant: true,
      });
      births = Math.max(0, births - Math.floor(births * 0.1)); // some births become mutants
    }

    const newHuntSuccesses = creature.huntSuccesses + fd.kills;
    const foodPop = fd.popDelta;
    let newPop = Math.max(0, creature.population + births - deaths + foodPop);
    let newStatus = creature.status;

    if (newPop === 0) {
      newStatus = "extinct";
      const msg = `[Năm ${nextDay}] Loài ${creature.name} đã tuyệt chủng.`;
      await logHistory(nextDay, "extinction", msg);
      events.push(msg);
    } else if (births > 0) {
      events.push(`[Năm ${nextDay}] ${creature.name} sinh thêm ${births} cá thể. Năng lượng: ${newEnergy}. Tổng: ${newPop}.`);
    }

    await db.update(creaturesTable).set({
      population: newPop,
      energy: newEnergy,
      hunger: newHunger,
      ageTicks: newAgeTicks,
      huntSuccesses: newHuntSuccesses,
      status: newStatus,
    }).where(eq(creaturesTable.id, creature.id));

    populations.push({ id: creature.id, name: creature.name, population: newPop, status: newStatus });
  }

  // Insert new mutant species
  for (const mutant of newMutants) {
    await db.insert(creaturesTable).values(mutant);
    events.push(`[Năm ${nextDay}] ĐỘT BIẾN! Loài ${mutant.name} xuất hiện!`);
  }

  // Step 3: Evolution check
  const refreshed = await db.select().from(creaturesTable)
    .where(eq(creaturesTable.status, "alive"));
  for (const creature of refreshed) {
    const evolved = await checkEvolution(creature, nextDay);
    if (evolved) {
      events.push(`[Năm ${nextDay}] Tiến hóa diễn ra: ${creature.name}!`);
    }
  }

  // Step 4: Random world event (8% chance)
  if (Math.random() < 0.08) {
    const eventMsg = await triggerWorldEvent(
      await db.select().from(creaturesTable).where(eq(creaturesTable.status, "alive")),
      nextDay
    );
    if (eventMsg) events.push(eventMsg);
  }

  // Step 5: Advance world day
  await db.update(worldStateTable)
    .set({ worldDay: nextDay })
    .where(eq(worldStateTable.id, worldState.id));

  return { worldDay: nextDay, events, populations };
}

export function combineElements(elemA: string, elemB: string): string {
  const combos: Record<string, string> = {
    "Hỏa+Lôi": "Lôi Hỏa", "Lôi+Hỏa": "Lôi Hỏa",
    "Hỏa+Phong": "Hỏa Phong", "Phong+Hỏa": "Hỏa Phong",
    "Thủy+Băng": "Băng", "Băng+Thủy": "Băng",
    "Quang+Ám": "Hư Vô", "Ám+Quang": "Hư Vô",
    "Thổ+Hỏa": "Nham Thạch", "Hỏa+Thổ": "Nham Thạch",
    "Lôi+Phong": "Phong Lôi", "Phong+Lôi": "Phong Lôi",
    "Thủy+Phong": "Băng Phong", "Phong+Thủy": "Băng Phong",
    "Ám+Thổ": "Địa Ám", "Thổ+Ám": "Địa Ám",
    "Quang+Hỏa": "Thần Hỏa", "Hỏa+Quang": "Thần Hỏa",
    "Kim+Thổ": "Địa Kim", "Thổ+Kim": "Địa Kim",
  };
  return combos[`${elemA}+${elemB}`] ?? elemA;
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
