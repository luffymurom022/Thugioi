import { db, creaturesTable, historyTable, worldStateTable, worldEventsTable, evolutionPathsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

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
    effect: "mixed",
    severity: 0.18,
    description: "Núi lửa phun trào! Các loài phi Hỏa bị thiệt hại nặng. Sinh vật Hỏa tăng năng lượng.",
  },
  {
    name: "Bão Tuyết Cực Đại",
    zones: ["Băng Tuyết Vực"],
    effect: "mixed",
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
];

function r(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function ri(min: number, max: number) {
  return Math.floor(r(min, max));
}

function parseJson(s: string): string[] {
  try { return JSON.parse(s) as string[]; }
  catch { return []; }
}

async function logHistory(worldDay: number, eventType: string, description: string) {
  await db.insert(historyTable).values({ worldDay, eventType, description });
}

async function runFoodChain(
  creatures: (typeof creaturesTable.$inferSelect)[],
  nextDay: number
): Promise<Map<number, { popDelta: number; energyDelta: number }>> {
  const deltas = new Map<number, { popDelta: number; energyDelta: number }>();
  const creatureByName = new Map(creatures.map(c => [c.name, c]));

  for (const creature of creatures) {
    if (creature.status === "extinct" || creature.population === 0) continue;

    const preyList = parseJson(creature.preySpecies);

    if (preyList.length === 0 || creature.dietType === "herbivore") {
      // Herbivores — gain energy from environment, no hunting needed
      const d = deltas.get(creature.id) ?? { popDelta: 0, energyDelta: 0 };
      d.energyDelta += ri(5, 15);
      deltas.set(creature.id, d);
      continue;
    }

    // Carnivore/omnivore: try to hunt
    let hunted = false;
    for (const preyName of preyList) {
      const prey = creatureByName.get(preyName);
      if (!prey || prey.population <= 5 || prey.status === "extinct") continue;

      // How many prey are killed this tick
      const killAmount = Math.max(1, Math.floor(creature.population * r(0.01, 0.03)));
      const actualKill = Math.min(killAmount, Math.floor(prey.population * 0.3));

      // Apply kill to prey
      const preyDelta = deltas.get(prey.id) ?? { popDelta: 0, energyDelta: 0 };
      preyDelta.popDelta -= actualKill;
      deltas.set(prey.id, preyDelta);

      // Apply energy gain to predator
      const predDelta = deltas.get(creature.id) ?? { popDelta: 0, energyDelta: 0 };
      predDelta.energyDelta += Math.floor(actualKill * r(0.5, 1.0));
      deltas.set(creature.id, predDelta);

      hunted = true;
      break; // Found prey this tick
    }

    if (!hunted) {
      // Starving: lose energy
      const d = deltas.get(creature.id) ?? { popDelta: 0, energyDelta: 0 };
      d.energyDelta -= ri(10, 25);
      deltas.set(creature.id, d);
    }
  }

  return deltas;
}

async function checkEvolution(
  creature: typeof creaturesTable.$inferSelect,
  worldDay: number
): Promise<boolean> {
  if (creature.population < 50) return false;

  const paths = await db
    .select()
    .from(evolutionPathsTable)
    .where(eq(evolutionPathsTable.fromSpecies, creature.name));

  if (paths.length === 0) return false;

  const path = paths[0];
  if (
    creature.population >= path.minPopulation &&
    creature.huntSuccesses >= path.minHuntSuccesses &&
    creature.ageTicks >= path.minAgeTicks
  ) {
    // Check if evolved form already exists
    const [existing] = await db
      .select()
      .from(creaturesTable)
      .where(eq(creaturesTable.name, path.toSpecies));

    if (existing) {
      // Add to existing evolved form's population
      const migrate = Math.floor(creature.population * 0.15);
      await db.update(creaturesTable)
        .set({ population: existing.population + migrate, status: "alive" })
        .where(eq(creaturesTable.id, existing.id));
      await db.update(creaturesTable)
        .set({ population: creature.population - migrate, evolutionStage: creature.evolutionStage + 1 })
        .where(eq(creaturesTable.id, creature.id));
    } else {
      // Create new evolved form
      const migrate = Math.floor(creature.population * 0.20);
      await db.insert(creaturesTable).values({
        name: path.toSpecies,
        rank: path.toRank,
        rankLevel: path.toRankLevel,
        element: path.toElement,
        habitat: creature.habitat,
        population: migrate,
        lifespan: Math.floor(creature.lifespan * 1.3),
        reproductionRate: creature.reproductionRate * 0.85,
        description: path.toDescription,
        status: "alive",
        isHybrid: false,
        energy: 120,
        hunger: 20,
        ageTicks: 0,
        maturityAge: creature.maturityAge + 2,
        gender: "mixed",
        preySpecies: creature.preySpecies,
        predatorSpecies: creature.predatorSpecies,
        generation: creature.generation + 1,
        huntSuccesses: 0,
        evolutionStage: creature.evolutionStage + 1,
        evolutionChain: JSON.stringify([...parseJson(creature.evolutionChain), creature.name]),
        maxPopulation: Math.floor(creature.maxPopulation * 0.8),
        dietType: creature.dietType,
      });

      await db.update(creaturesTable)
        .set({ population: creature.population - migrate, evolutionStage: creature.evolutionStage + 1 })
        .where(eq(creaturesTable.id, creature.id));
    }

    const msg = `[Ngày ${worldDay}] Tiến hóa: ${creature.name} → ${path.toSpecies}! Loài mới xuất hiện tại ${creature.habitat}.`;
    await logHistory(worldDay, "evolution", msg);
    return true;
  }

  return false;
}

async function triggerWorldEvent(
  creatures: (typeof creaturesTable.$inferSelect)[],
  worldDay: number
): Promise<string | null> {
  const event = WORLD_EVENTS[ri(0, WORLD_EVENTS.length)];

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
      case "mixed":
        // Fire zone event: fire creatures boosted, others hurt
        if (event.name === "Núi Lửa Phun Trào") {
          if (creature.element === "Hỏa") {
            newEnergy = Math.min(200, creature.energy + 40);
            newPop = Math.floor(creature.population * 1.05);
          } else {
            newPop = Math.max(0, Math.floor(creature.population * (1 - event.severity)));
          }
        } else if (event.name === "Bão Tuyết Cực Đại") {
          if (creature.element === "Băng") {
            newEnergy = Math.min(200, creature.energy + 35);
          } else if (creature.habitat === "Băng Tuyết Vực") {
            newPop = Math.max(0, Math.floor(creature.population * (1 - event.severity)));
          }
        }
        break;
      case "single_species":
        // Only affects one random creature — skip others
        continue;
    }

    if (event.effect === "single_species") continue;

    await db.update(creaturesTable)
      .set({ population: newPop, energy: newEnergy })
      .where(eq(creaturesTable.id, creature.id));

    if (newPop === 0 && creature.population > 0) {
      await db.update(creaturesTable).set({ status: "extinct" }).where(eq(creaturesTable.id, creature.id));
      await logHistory(worldDay, "extinction", `[Ngày ${worldDay}] Loài ${creature.name} tuyệt chủng do ${event.name}!`);
    }
  }

  // Dịch bệnh: affects single random species
  if (event.effect === "single_species" && affected.length > 0) {
    const victim = affected[ri(0, affected.length)];
    if (victim && victim.status !== "extinct" && victim.population > 0) {
      const loss = Math.floor(victim.population * event.severity * r(0.8, 1.2));
      const newPop = Math.max(0, victim.population - loss);
      await db.update(creaturesTable)
        .set({ population: newPop, status: newPop === 0 ? "extinct" : "alive" })
        .where(eq(creaturesTable.id, victim.id));
      if (newPop === 0) {
        await logHistory(worldDay, "extinction", `[Ngày ${worldDay}] Dịch bệnh diệt vong loài ${victim.name}!`);
      } else {
        await logHistory(worldDay, "disaster", `[Ngày ${worldDay}] Dịch bệnh tàn phá loài ${victim.name}: mất ${loss} cá thể.`);
      }
    }
  }

  const msg = `[Ngày ${worldDay}] SỰ KIỆN: ${event.name} — ${event.description}`;
  await logHistory(worldDay, "event", msg);
  return msg;
}

export async function runSimulationTick() {
  let [worldState] = await db.select().from(worldStateTable).limit(1);
  if (!worldState) {
    [worldState] = await db.insert(worldStateTable).values({ worldDay: 1 }).returning();
  }

  const currentDay = worldState.worldDay;
  const nextDay = currentDay + 1;

  const allCreatures = await db.select().from(creaturesTable);
  const alive = allCreatures.filter(c => c.status === "alive" && c.population > 0);

  const events: string[] = [];
  const populations: { id: number; name: string; population: number; status: string }[] = [];

  // 1. Food chain — compute energy/pop deltas from hunting
  const foodDeltas = await runFoodChain(alive, nextDay);

  // 2. Process each species
  for (const creature of alive) {
    const fd = foodDeltas.get(creature.id) ?? { popDelta: 0, energyDelta: 0 };

    // Age
    const newAgeTicks = creature.ageTicks + 1;

    // Energy
    let newEnergy = Math.max(0, Math.min(200, creature.energy + fd.energyDelta - ri(3, 8)));

    // Hunger increases if low energy
    const newHunger = newEnergy < 40 ? Math.min(100, creature.hunger + ri(10, 20)) : Math.max(0, creature.hunger - ri(5, 10));

    // Death calculations
    let deathRate = r(0.02, 0.05); // base natural death

    // Starvation
    if (newEnergy < 30) deathRate += r(0.05, 0.12);

    // Old age: if age_ticks > lifespan, accelerate death
    if (newAgeTicks > creature.lifespan) {
      deathRate += r(0.05, 0.15);
    }

    // Overpopulation pressure (capacity of zone)
    const zoneCreatures = alive.filter(c => c.habitat === creature.habitat);
    const zonePop = zoneCreatures.reduce((s, c) => s + c.population, 0);
    const zoneCapacity = creature.habitat === "Hỏa Sơn Vực" ? 5000
      : creature.habitat === "Băng Tuyết Vực" ? 3500
      : 8000;

    const capacityPressure = Math.max(0, (zonePop - zoneCapacity) / zoneCapacity);
    if (capacityPressure > 0) {
      deathRate += capacityPressure * 0.15;
    }

    const deaths = Math.floor(creature.population * deathRate);

    // Births (only if energy > 60 and mature and has both genders represented)
    let births = 0;
    if (
      newEnergy > 60 &&
      newAgeTicks >= creature.maturityAge &&
      creature.population >= 4
    ) {
      const capacityFactor = Math.max(0, 1 - capacityPressure * 2);
      const energyFactor = (newEnergy - 60) / 140; // 0 to 1
      births = Math.floor(creature.population * creature.reproductionRate * capacityFactor * energyFactor * r(0.7, 1.3));
    }

    // Food chain pop delta
    const popFromFood = fd.popDelta;

    // New population
    let newPop = Math.max(0, creature.population + births - deaths + popFromFood);

    // Hunt successes: accumulate from kills
    const newHuntSuccesses = creature.dietType !== "herbivore"
      ? creature.huntSuccesses + (births > 0 ? 1 : 0)
      : creature.huntSuccesses;

    let newStatus = creature.status;
    if (newPop === 0) {
      newStatus = "extinct";
      const msg = `[Ngày ${nextDay}] Loài ${creature.name} đã tuyệt chủng.`;
      await logHistory(nextDay, "extinction", msg);
      events.push(msg);
    } else if (births > 0) {
      const msg = `[Ngày ${nextDay}] ${creature.name} sinh thêm ${births} cá thể (Năng lượng: ${newEnergy}). Tổng: ${newPop}.`;
      await logHistory(nextDay, "birth", msg);
      events.push(msg);
    }

    await db.update(creaturesTable)
      .set({
        population: newPop,
        energy: newEnergy,
        hunger: newHunger,
        ageTicks: newAgeTicks,
        huntSuccesses: newHuntSuccesses,
        status: newStatus,
      })
      .where(eq(creaturesTable.id, creature.id));

    populations.push({ id: creature.id, name: creature.name, population: newPop, status: newStatus });
  }

  // 3. Evolution check (after population updates)
  const refreshed = await db.select().from(creaturesTable).where(eq(creaturesTable.status, "alive"));
  for (const creature of refreshed) {
    await checkEvolution(creature, nextDay);
  }

  // 4. Random world event (8% chance per tick)
  if (Math.random() < 0.08) {
    const eventMsg = await triggerWorldEvent(refreshed, nextDay);
    if (eventMsg) events.push(eventMsg);
  }

  // 5. Advance world day
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
