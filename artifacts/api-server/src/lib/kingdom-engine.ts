// ============================================================
// THÚ GIỚI AI — Kingdom & Territory Engine V5
// ============================================================
import { db, creaturesTable, territoriesTable, beastKingdomsTable, packsTable, kingdomRelationsTable, historyTable, worldStateTable } from "@workspace/db";
import { eq, desc, and, or } from "drizzle-orm";

function ri(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[ri(0, arr.length - 1)]; }

// ─── Name generators ──────────────────────────────────────────
const KINGDOM_SUFFIXES = ["Quốc", "Đế Quốc", "Vương Quốc", "Liên Minh"];
const LEADER_TITLES = ["Vương", "Đại Đế", "Thủ Lĩnh", "Tộc Trưởng", "Chiến Chủ"];

function generateKingdomName(species: string, element: string): string {
  const suffix = pick(KINGDOM_SUFFIXES);
  return `${element} ${species} ${suffix}`;
}

function generateLeaderName(speciesName: string): string {
  const title = pick(LEADER_TITLES);
  const parts = speciesName.split(" ");
  const base = parts[parts.length - 1] ?? speciesName;
  return `${speciesName} ${title}`;
}

// ─── Territory resource map ─────────────────────────────────
const TERRITORY_RESOURCES: Record<string, {
  food: number; water: number; mineral: number; spirit: number;
  foodMax: number; waterMax: number; mineralMax: number; spiritMax: number;
  climate: string;
}> = {
  "Hỏa Sơn Vực":  { food: 600, water: 300, mineral: 800, spirit: 200, foodMax: 900, waterMax: 500, mineralMax: 1000, spiritMax: 300, climate: "volcanic" },
  "Băng Tuyết Vực":{ food: 400, water: 900, mineral: 300, spirit: 350, foodMax: 700, waterMax: 1000, mineralMax: 400, spiritMax: 500, climate: "frozen" },
  "Cổ Mộc Vực":   { food: 950, water: 750, mineral: 200, spirit: 450, foodMax: 1000, waterMax: 900, mineralMax: 300, spiritMax: 600, climate: "forest" },
  "Lôi Đình Vực": { food: 500, water: 600, mineral: 450, spirit: 600, foodMax: 800, waterMax: 800, mineralMax: 600, spiritMax: 800, climate: "storm" },
  "Hắc Ám Vực":   { food: 300, water: 400, mineral: 650, spirit: 900, foodMax: 500, waterMax: 600, mineralMax: 800, spiritMax: 1000, climate: "dark" },
};

// Resource regen per tick (percentage)
const REGEN_RATES: Record<string, number> = {
  volcanic: 0.04, frozen: 0.03, forest: 0.07, storm: 0.05, dark: 0.02,
};

// ─── Seed territories from zones ───────────────────────────────
export async function seedTerritories() {
  for (const [zoneName, res] of Object.entries(TERRITORY_RESOURCES)) {
    const existing = await db.select().from(territoriesTable).where(eq(territoriesTable.zoneName, zoneName));
    if (existing.length === 0) {
      await db.insert(territoriesTable).values({ zoneName, ...res });
    }
  }
}

// ─── Resource regeneration ─────────────────────────────────────
export async function regenerateResources() {
  const territories = await db.select().from(territoriesTable);
  for (const t of territories) {
    const rate = REGEN_RATES[t.climate] ?? 0.04;
    const newFood    = Math.min(t.foodMax,    t.food    + Math.floor(t.foodMax    * rate));
    const newWater   = Math.min(t.waterMax,   t.water   + Math.floor(t.waterMax   * rate));
    const newMineral = Math.min(t.mineralMax, t.mineral + Math.floor(t.mineralMax * 0.01));
    const newSpirit  = Math.min(t.spiritMax,  t.spirit  + Math.floor(t.spiritMax  * 0.02));
    await db.update(territoriesTable)
      .set({ food: newFood, water: newWater, mineral: newMineral, spirit: newSpirit })
      .where(eq(territoriesTable.id, t.id));
  }
}

// ─── Update dominant species per territory ─────────────────────
export async function updateTerritoryDominance(worldDay: number) {
  const territories = await db.select().from(territoriesTable);
  const creatures = await db.select().from(creaturesTable).where(eq(creaturesTable.status, "alive"));

  for (const territory of territories) {
    const zoneCreatures = creatures
      .filter(c => c.habitat === territory.zoneName)
      .sort((a, b) => b.population - a.population);

    const dominant = zoneCreatures[0] ?? null;
    const newDominant = dominant?.name ?? null;

    if (newDominant !== territory.dominantSpecies && newDominant) {
      await db.update(territoriesTable)
        .set({ dominantSpecies: newDominant })
        .where(eq(territoriesTable.id, territory.id));
    }
  }
}

// ─── Pack synchronization ───────────────────────────────────────
export async function syncPacks(worldDay: number) {
  const creatures = await db.select().from(creaturesTable).where(eq(creaturesTable.status, "alive"));

  for (const creature of creatures) {
    if (creature.population < 10) continue;

    const [existingPack] = await db.select().from(packsTable)
      .where(and(eq(packsTable.speciesName, creature.name), eq(packsTable.territory, creature.habitat)));

    const leaderName = generateLeaderName(creature.name);
    const leaderLevel = Math.min(100, creature.rankLevel * 8 + ri(0, 10));
    const leaderInt = Math.min(100, (creature.intelligence ?? 50) + ri(-5, 10));
    const leaderCharisma = Math.min(100, ri(40, 80) + creature.rankLevel * 3);

    if (!existingPack) {
      await db.insert(packsTable).values({
        speciesName: creature.name,
        territory: creature.habitat,
        population: creature.population,
        leaderName,
        leaderLevel,
        leaderIntelligence: leaderInt,
        leaderCharisma,
        status: "active",
      });
    } else {
      await db.update(packsTable)
        .set({ population: creature.population, leaderLevel, leaderIntelligence: leaderInt, leaderCharisma })
        .where(eq(packsTable.id, existingPack.id));
    }
  }

  // Disband extinct creature packs
  const extinctNames = (await db.select().from(creaturesTable).where(eq(creaturesTable.status, "extinct"))).map(c => c.name);
  for (const name of extinctNames) {
    await db.update(packsTable).set({ status: "disbanded" }).where(eq(packsTable.speciesName, name));
  }
}

// ─── Kingdom formation ──────────────────────────────────────────
const KINGDOM_POPULATION_THRESHOLD = 300;

export async function checkKingdomFormation(worldDay: number) {
  const packs = await db.select().from(packsTable).where(eq(packsTable.status, "active"));
  const kingdoms = await db.select().from(beastKingdomsTable);
  const kingdomsBySpecies = new Set(kingdoms.map(k => k.dominantSpecies));

  for (const pack of packs) {
    if (pack.population < KINGDOM_POPULATION_THRESHOLD) continue;
    if (kingdomsBySpecies.has(pack.speciesName)) continue;

    // Get creature info for element
    const [creature] = await db.select().from(creaturesTable)
      .where(eq(creaturesTable.name, pack.speciesName));
    if (!creature) continue;

    const element = creature.element;
    const speciesParts = pack.speciesName.split(" ");
    const speciesCore = speciesParts[speciesParts.length - 1] ?? pack.speciesName;
    const kingdomName = generateKingdomName(speciesCore, element);

    const military = Math.floor(pack.population * 0.12 + pack.leaderLevel * 2);
    const economy = Math.floor(pack.population * 0.05 + pack.leaderCharisma * 3);
    const influence = Math.floor(military * 0.4 + economy * 0.3 + pack.leaderIntelligence * 2);

    await db.insert(beastKingdomsTable).values({
      name: kingdomName,
      dominantSpecies: pack.speciesName,
      foundedDay: worldDay,
      capital: pack.territory,
      militaryPower: military,
      economy,
      influence,
      population: pack.population,
      territoryCount: 1,
      status: "active",
    });

    // Link pack to kingdom
    await db.update(packsTable)
      .set({ kingdomName })
      .where(and(eq(packsTable.speciesName, pack.speciesName), eq(packsTable.territory, pack.territory)));

    // Update territory controlling kingdom
    await db.update(territoriesTable)
      .set({ controllingKingdom: kingdomName })
      .where(eq(territoriesTable.zoneName, pack.territory));

    await db.insert(historyTable).values({
      worldDay,
      eventType: "kingdom_founded",
      description: `[Năm ${worldDay}] 🏰 ${kingdomName} thành lập! Loài thống trị: ${pack.speciesName}. Thủ đô: ${pack.territory}. Quân lực: ${military}, Kinh tế: ${economy}.`,
    });

    kingdomsBySpecies.add(pack.speciesName);
  }
}

// ─── Kingdom stats update ────────────────────────────────────────
export async function updateKingdomStats(worldDay: number) {
  const kingdoms = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.status, "active"));

  for (const kingdom of kingdoms) {
    const [creature] = await db.select().from(creaturesTable)
      .where(eq(creaturesTable.name, kingdom.dominantSpecies));
    if (!creature) {
      await db.update(beastKingdomsTable).set({ status: "collapsed" }).where(eq(beastKingdomsTable.id, kingdom.id));
      await db.insert(historyTable).values({
        worldDay,
        eventType: "kingdom_collapsed",
        description: `[Năm ${worldDay}] 💀 ${kingdom.name} sụp đổ! Loài ${kingdom.dominantSpecies} tuyệt chủng.`,
      });
      continue;
    }

    const pop = creature.population;
    const military = Math.max(10, Math.floor(pop * 0.12 + (creature.strength ?? 50) * 2));
    const economy = Math.max(10, Math.floor(pop * 0.05 + (creature.intelligence ?? 50) * 2));
    const influence = Math.max(5, Math.floor(military * 0.4 + economy * 0.3 + creature.rankLevel * 5));

    // Count territories
    const territories = await db.select().from(territoriesTable)
      .where(eq(territoriesTable.controllingKingdom, kingdom.name));

    await db.update(beastKingdomsTable).set({
      militaryPower: military,
      economy,
      influence,
      population: pop,
      territoryCount: territories.length,
    }).where(eq(beastKingdomsTable.id, kingdom.id));
  }
}

// ─── Territory expansion ─────────────────────────────────────────
export async function checkTerritoryExpansion(worldDay: number) {
  const kingdoms = await db.select().from(beastKingdomsTable)
    .where(eq(beastKingdomsTable.status, "active"))
    .orderBy(desc(beastKingdomsTable.militaryPower));

  const territories = await db.select().from(territoriesTable);
  const unclaimedTerritories = territories.filter(t => !t.controllingKingdom);

  for (const kingdom of kingdoms) {
    const [creature] = await db.select().from(creaturesTable)
      .where(eq(creaturesTable.name, kingdom.dominantSpecies));
    if (!creature || creature.population < 800) continue;

    // Find unclaimed territory to expand into
    if (unclaimedTerritories.length === 0) break;
    const targetIdx = Math.floor(Math.random() * unclaimedTerritories.length);
    const target = unclaimedTerritories[targetIdx];
    if (!target) continue;

    await db.update(territoriesTable)
      .set({ controllingKingdom: kingdom.name, contested: false })
      .where(eq(territoriesTable.id, target.id));

    await db.update(beastKingdomsTable)
      .set({ territoryCount: kingdom.territoryCount + 1 })
      .where(eq(beastKingdomsTable.id, kingdom.id));

    await db.insert(historyTable).values({
      worldDay,
      eventType: "territory_expansion",
      description: `[Năm ${worldDay}] ⚔ ${kingdom.name} chiếm ${target.zoneName}! Lãnh thổ mở rộng.`,
    });

    unclaimedTerritories.splice(targetIdx, 1);
    break; // one expansion per tick
  }
}

// ─── Diplomacy updates ───────────────────────────────────────────
export async function updateDiplomacy(worldDay: number) {
  const kingdoms = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.status, "active"));
  if (kingdoms.length < 2) return;

  // Occasionally create or update relations between random pairs
  if (Math.random() > 0.3) return; // 70% skip

  const a = kingdoms[ri(0, kingdoms.length - 1)];
  const b = kingdoms[ri(0, kingdoms.length - 1)];
  if (!a || !b || a.id === b.id) return;

  const [existingRel] = await db.select().from(kingdomRelationsTable).where(
    or(
      and(eq(kingdomRelationsTable.kingdomNameA, a.name), eq(kingdomRelationsTable.kingdomNameB, b.name)),
      and(eq(kingdomRelationsTable.kingdomNameA, b.name), eq(kingdomRelationsTable.kingdomNameB, a.name))
    )
  );

  const RELATIONS = ["alliance", "neutral", "hostile"] as const;
  const newRelation = pick(RELATIONS);

  if (!existingRel) {
    await db.insert(kingdomRelationsTable).values({
      kingdomNameA: a.name, kingdomNameB: b.name,
      relation: newRelation, sinceDay: worldDay,
    });
    const actionText = newRelation === "alliance" ? "ký hiệp ước liên minh" :
      newRelation === "hostile" ? "tuyên chiến với" : "thiết lập quan hệ trung lập với";
    await db.insert(historyTable).values({
      worldDay,
      eventType: "diplomacy",
      description: `[Năm ${worldDay}] 🤝 ${a.name} ${actionText} ${b.name}.`,
    });
  } else if (Math.random() < 0.2) {
    await db.update(kingdomRelationsTable)
      .set({ relation: newRelation, sinceDay: worldDay })
      .where(eq(kingdomRelationsTable.id, existingRel.id));
  }
}

// ─── Resource shortage: migration ────────────────────────────────
export async function handleResourceShortage(worldDay: number) {
  const territories = await db.select().from(territoriesTable);
  const creatures = await db.select().from(creaturesTable).where(eq(creaturesTable.status, "alive"));

  for (const territory of territories) {
    const isStarving = territory.food < 100 || territory.water < 100;
    if (!isStarving) continue;

    const zoneCreatures = creatures.filter(c => c.habitat === territory.zoneName && c.population > 20);
    if (zoneCreatures.length === 0) continue;

    // Find richest alternative territory
    const otherTerritories = territories
      .filter(t => t.zoneName !== territory.zoneName)
      .sort((a, b) => (b.food + b.water) - (a.food + a.water));
    const destination = otherTerritories[0];
    if (!destination) continue;

    const migrant = zoneCreatures[ri(0, zoneCreatures.length - 1)];
    if (!migrant) continue;

    const migrateAmount = Math.floor(migrant.population * 0.15);
    if (migrateAmount < 5) continue;

    await db.update(creaturesTable)
      .set({ population: migrant.population - migrateAmount })
      .where(eq(creaturesTable.id, migrant.id));

    // Consume resources
    await db.update(territoriesTable)
      .set({ food: Math.max(0, territory.food - 50), water: Math.max(0, territory.water - 30) })
      .where(eq(territoriesTable.id, territory.id));

    await db.insert(historyTable).values({
      worldDay,
      eventType: "migration",
      description: `[Năm ${worldDay}] 🚶 ${migrant.name} di cư khỏi ${territory.zoneName} do thiếu tài nguyên. ${migrateAmount} cá thể rời đi.`,
    });
  }
}

// ─── Main kingdom tick ───────────────────────────────────────────
export async function runKingdomTick(worldDay: number) {
  await seedTerritories();
  await regenerateResources();
  await updateTerritoryDominance(worldDay);
  await syncPacks(worldDay);
  await checkKingdomFormation(worldDay);
  await updateKingdomStats(worldDay);
  if (worldDay % 3 === 0) await checkTerritoryExpansion(worldDay);
  if (worldDay % 5 === 0) await updateDiplomacy(worldDay);
  if (worldDay % 4 === 0) await handleResourceShortage(worldDay);
}
