// ============================================================
// THÚ GIỚI AI — Kingdom & Territory Engine V6
// War & World Conquest System
// ============================================================
import {
  db, creaturesTable, territoriesTable, beastKingdomsTable,
  packsTable, kingdomRelationsTable, historyTable, worldStateTable,
  warsTable, heroesTable,
} from "@workspace/db";
import { eq, desc, and, or, ne } from "drizzle-orm";

function ri(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[ri(0, arr.length - 1)]!; }
function chance(pct: number) { return Math.random() < pct; }

// ─── Name generators ──────────────────────────────────────────
const KINGDOM_SUFFIXES = ["Quốc", "Đế Quốc", "Vương Quốc", "Liên Minh"];
const LEADER_TITLES    = ["Vương", "Đại Đế", "Thủ Lĩnh", "Tộc Trưởng", "Chiến Chủ"];

const HERO_TITLES = [
  "Thần", "Thánh", "Hoàng", "Đại", "Cổ", "Thiên", "Địa", "Vạn",
];
const HERO_ABILITIES = [
  "Bách Chiến Bách Thắng", "Thần Lực Vô Song", "Trí Tuệ Tuyệt Thế",
  "Chiến Thần Giáng Thế", "Bất Diệt Ý Chí", "Hào Khí Xung Thiên",
  "Thiên Kiêu Nhất Thế", "Ma Vương Tái Thế",
];

function generateKingdomName(species: string, element: string): string {
  return `${element} ${species} ${pick(KINGDOM_SUFFIXES)}`;
}
function generateLeaderName(speciesName: string): string {
  const base = speciesName.split(" ").at(-1) ?? speciesName;
  return `${base} ${pick(LEADER_TITLES)}`;
}
function generateHeroName(speciesName: string): string {
  const title = pick(HERO_TITLES);
  const base  = speciesName.split(" ").at(-1) ?? speciesName;
  return `${title} ${base} Đế`;
}

// ─── Territory resource map ─────────────────────────────────
const TERRITORY_RESOURCES: Record<string, {
  food: number; water: number; mineral: number; spirit: number;
  foodMax: number; waterMax: number; mineralMax: number; spiritMax: number;
  climate: string;
}> = {
  "Hỏa Sơn Vực":   { food: 600, water: 300, mineral: 800, spirit: 200, foodMax: 900,  waterMax: 500,  mineralMax: 1000, spiritMax: 300,  climate: "volcanic" },
  "Băng Tuyết Vực": { food: 400, water: 900, mineral: 300, spirit: 350, foodMax: 700,  waterMax: 1000, mineralMax: 400,  spiritMax: 500,  climate: "frozen"   },
  "Cổ Mộc Vực":    { food: 950, water: 750, mineral: 200, spirit: 450, foodMax: 1000, waterMax: 900,  mineralMax: 300,  spiritMax: 600,  climate: "forest"   },
  "Lôi Đình Vực":  { food: 500, water: 600, mineral: 450, spirit: 600, foodMax: 800,  waterMax: 800,  mineralMax: 600,  spiritMax: 800,  climate: "storm"    },
  "Hắc Ám Vực":    { food: 300, water: 400, mineral: 650, spirit: 900, foodMax: 500,  waterMax: 600,  mineralMax: 800,  spiritMax: 1000, climate: "dark"     },
};

const REGEN_RATES: Record<string, number> = {
  volcanic: 0.04, frozen: 0.03, forest: 0.07, storm: 0.05, dark: 0.02, temperate: 0.05,
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
    await db.update(territoriesTable).set({
      food:    Math.min(t.foodMax,    t.food    + Math.floor(t.foodMax    * rate)),
      water:   Math.min(t.waterMax,   t.water   + Math.floor(t.waterMax   * rate)),
      mineral: Math.min(t.mineralMax, t.mineral + Math.floor(t.mineralMax * 0.01)),
      spirit:  Math.min(t.spiritMax,  t.spirit  + Math.floor(t.spiritMax  * 0.02)),
    }).where(eq(territoriesTable.id, t.id));
  }
}

// ─── Update dominant species per territory ─────────────────────
export async function updateTerritoryDominance(worldDay: number) {
  const territories = await db.select().from(territoriesTable);
  const creatures   = await db.select().from(creaturesTable).where(eq(creaturesTable.status, "alive"));
  for (const territory of territories) {
    const dominant = creatures
      .filter(c => c.habitat === territory.zoneName)
      .sort((a, b) => b.population - a.population)[0] ?? null;
    if (dominant && dominant.name !== territory.dominantSpecies) {
      await db.update(territoriesTable)
        .set({ dominantSpecies: dominant.name })
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
    const leaderLevel = Math.min(100, creature.rankLevel * 8 + ri(0, 10));
    const leaderInt   = Math.min(100, (creature.intelligence ?? 50) + ri(-5, 10));
    const leaderChar  = Math.min(100, ri(40, 80) + creature.rankLevel * 3);
    if (!existingPack) {
      await db.insert(packsTable).values({
        speciesName: creature.name, territory: creature.habitat,
        population: creature.population,
        leaderName: generateLeaderName(creature.name),
        leaderLevel, leaderIntelligence: leaderInt, leaderCharisma: leaderChar, status: "active",
      });
    } else {
      await db.update(packsTable)
        .set({ population: creature.population, leaderLevel, leaderIntelligence: leaderInt, leaderCharisma: leaderChar })
        .where(eq(packsTable.id, existingPack.id));
    }
  }
  const extinctNames = (await db.select().from(creaturesTable).where(eq(creaturesTable.status, "extinct"))).map(c => c.name);
  for (const name of extinctNames) {
    await db.update(packsTable).set({ status: "disbanded" }).where(eq(packsTable.speciesName, name));
  }
}

// ─── Kingdom formation ──────────────────────────────────────────
const KINGDOM_POPULATION_THRESHOLD = 300;
export async function checkKingdomFormation(worldDay: number) {
  const packs    = await db.select().from(packsTable).where(eq(packsTable.status, "active"));
  const kingdoms = await db.select().from(beastKingdomsTable);
  const bySpecies = new Set(kingdoms.map(k => k.dominantSpecies));
  for (const pack of packs) {
    if (pack.population < KINGDOM_POPULATION_THRESHOLD) continue;
    if (bySpecies.has(pack.speciesName)) continue;
    const [creature] = await db.select().from(creaturesTable).where(eq(creaturesTable.name, pack.speciesName));
    if (!creature) continue;
    const core        = pack.speciesName.split(" ").at(-1) ?? pack.speciesName;
    const kingdomName = generateKingdomName(core, creature.element);
    const military    = Math.floor(pack.population * 0.12 + pack.leaderLevel * 2);
    const economy     = Math.floor(pack.population * 0.05 + pack.leaderCharisma * 3);
    const influence   = Math.floor(military * 0.4 + economy * 0.3 + pack.leaderIntelligence * 2);
    await db.insert(beastKingdomsTable).values({
      name: kingdomName, dominantSpecies: pack.speciesName,
      foundedDay: worldDay, capital: pack.territory,
      militaryPower: military, economy, influence,
      population: pack.population, territoryCount: 1, status: "active",
      technologyLevel: 1, morale: 70, warCount: 0, warWins: 0,
    });
    await db.update(packsTable).set({ kingdomName })
      .where(and(eq(packsTable.speciesName, pack.speciesName), eq(packsTable.territory, pack.territory)));
    await db.update(territoriesTable).set({ controllingKingdom: kingdomName })
      .where(eq(territoriesTable.zoneName, pack.territory));
    await db.insert(historyTable).values({
      worldDay, eventType: "kingdom_founded",
      description: `[Năm ${worldDay}] 🏰 ${kingdomName} thành lập! Loài: ${pack.speciesName}. Thủ đô: ${pack.territory}. Quân lực: ${military}.`,
    });
    bySpecies.add(pack.speciesName);
  }
}

// ─── Kingdom stats update ────────────────────────────────────────
export async function updateKingdomStats(worldDay: number) {
  const kingdoms = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.status, "active"));
  for (const kingdom of kingdoms) {
    const [creature] = await db.select().from(creaturesTable).where(eq(creaturesTable.name, kingdom.dominantSpecies));
    if (!creature) {
      await db.update(beastKingdomsTable).set({ status: "collapsed" }).where(eq(beastKingdomsTable.id, kingdom.id));
      await db.insert(historyTable).values({
        worldDay, eventType: "kingdom_collapsed",
        description: `[Năm ${worldDay}] 💀 ${kingdom.name} sụp đổ! Loài ${kingdom.dominantSpecies} tuyệt chủng.`,
      });
      continue;
    }
    const pop       = creature.population;
    const techMult  = 1 + (kingdom.technologyLevel - 1) * 0.05;
    const military  = Math.max(10, Math.floor(pop * 0.12 * techMult + (creature.strength ?? 50) * 2));
    const economy   = Math.max(10, Math.floor(pop * 0.05 + (creature.intelligence ?? 50) * 2));
    const influence = Math.max(5, Math.floor(military * 0.4 + economy * 0.3 + creature.rankLevel * 5));
    const territories = await db.select().from(territoriesTable).where(eq(territoriesTable.controllingKingdom, kingdom.name));
    // Tech grows slowly
    const newTech = Math.min(10, kingdom.technologyLevel + (chance(0.1) ? 1 : 0));
    // Morale slowly recovers
    const newMorale = Math.min(100, kingdom.morale + ri(1, 3));
    await db.update(beastKingdomsTable).set({
      militaryPower: military, economy, influence, population: pop,
      territoryCount: territories.length, technologyLevel: newTech, morale: newMorale,
    }).where(eq(beastKingdomsTable.id, kingdom.id));
  }
}

// ─── Territory expansion ─────────────────────────────────────────
export async function checkTerritoryExpansion(worldDay: number) {
  const kingdoms      = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.status, "active")).orderBy(desc(beastKingdomsTable.militaryPower));
  const territories   = await db.select().from(territoriesTable);
  const unclaimed     = territories.filter(t => !t.controllingKingdom);
  for (const kingdom of kingdoms) {
    const [creature] = await db.select().from(creaturesTable).where(eq(creaturesTable.name, kingdom.dominantSpecies));
    if (!creature || creature.population < 800) continue;
    if (unclaimed.length === 0) break;
    const idx    = Math.floor(Math.random() * unclaimed.length);
    const target = unclaimed[idx];
    if (!target) continue;
    await db.update(territoriesTable).set({ controllingKingdom: kingdom.name, contested: false }).where(eq(territoriesTable.id, target.id));
    await db.update(beastKingdomsTable).set({ territoryCount: kingdom.territoryCount + 1 }).where(eq(beastKingdomsTable.id, kingdom.id));
    await db.insert(historyTable).values({
      worldDay, eventType: "territory_expansion",
      description: `[Năm ${worldDay}] ⚔ ${kingdom.name} chiếm ${target.zoneName}! Lãnh thổ mở rộng.`,
    });
    unclaimed.splice(idx, 1);
    break;
  }
}

// ─── Diplomacy updates ───────────────────────────────────────────
export async function updateDiplomacy(worldDay: number) {
  const kingdoms = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.status, "active"));
  if (kingdoms.length < 2) return;
  if (!chance(0.3)) return;
  const a = kingdoms[ri(0, kingdoms.length - 1)];
  const b = kingdoms[ri(0, kingdoms.length - 1)];
  if (!a || !b || a.id === b.id) return;
  const [existing] = await db.select().from(kingdomRelationsTable).where(
    or(
      and(eq(kingdomRelationsTable.kingdomNameA, a.name), eq(kingdomRelationsTable.kingdomNameB, b.name)),
      and(eq(kingdomRelationsTable.kingdomNameA, b.name), eq(kingdomRelationsTable.kingdomNameB, a.name)),
    )
  );
  const RELATIONS = ["alliance", "neutral", "hostile"] as const;
  const newRel = pick(RELATIONS);
  if (!existing) {
    await db.insert(kingdomRelationsTable).values({ kingdomNameA: a.name, kingdomNameB: b.name, relation: newRel, sinceDay: worldDay });
    const action = newRel === "alliance" ? "ký hiệp ước liên minh với" : newRel === "hostile" ? "tuyên chiến với" : "lập quan hệ trung lập với";
    await db.insert(historyTable).values({ worldDay, eventType: "diplomacy", description: `[Năm ${worldDay}] 🤝 ${a.name} ${action} ${b.name}.` });
  } else if (chance(0.2)) {
    await db.update(kingdomRelationsTable).set({ relation: newRel, sinceDay: worldDay }).where(eq(kingdomRelationsTable.id, existing.id));
  }
}

// ─── Resource shortage: migration ────────────────────────────────
export async function handleResourceShortage(worldDay: number) {
  const territories = await db.select().from(territoriesTable);
  const creatures   = await db.select().from(creaturesTable).where(eq(creaturesTable.status, "alive"));
  for (const territory of territories) {
    if (territory.food >= 100 && territory.water >= 100) continue;
    const zoneCreatures = creatures.filter(c => c.habitat === territory.zoneName && c.population > 20);
    if (zoneCreatures.length === 0) continue;
    const richest = territories.filter(t => t.zoneName !== territory.zoneName).sort((a, b) => (b.food + b.water) - (a.food + a.water))[0];
    if (!richest) continue;
    const migrant      = zoneCreatures[ri(0, zoneCreatures.length - 1)]!;
    const migrateAmt   = Math.floor(migrant.population * 0.15);
    if (migrateAmt < 5) continue;
    await db.update(creaturesTable).set({ population: migrant.population - migrateAmt }).where(eq(creaturesTable.id, migrant.id));
    await db.update(territoriesTable).set({ food: Math.max(0, territory.food - 50), water: Math.max(0, territory.water - 30) }).where(eq(territoriesTable.id, territory.id));
    await db.insert(historyTable).values({ worldDay, eventType: "migration", description: `[Năm ${worldDay}] 🚶 ${migrant.name} di cư khỏi ${territory.zoneName} do thiếu tài nguyên. ${migrateAmt} cá thể rời đi.` });
  }
}

// ═══════════════════════════════════════════════════════════════
// V6 — WAR SYSTEM
// ═══════════════════════════════════════════════════════════════

// Calculate war power for a kingdom (military + morale + tech + hero bonuses)
async function calcWarPower(kingdom: { name: string; militaryPower: number; morale: number; technologyLevel: number }, isDefender: boolean): Promise<number> {
  const heroes     = await db.select().from(heroesTable).where(and(eq(heroesTable.kingdomName, kingdom.name), eq(heroesTable.status, "active")));
  const heroBonus  = heroes.reduce((sum, h) => sum + h.militaryBonus, 0);
  const moraleMult = kingdom.morale / 100;
  const techMult   = 1 + (kingdom.technologyLevel - 1) * 0.08;
  const homeMult   = isDefender ? 1.25 : 1.0; // home advantage
  return Math.floor((kingdom.militaryPower + heroBonus) * moraleMult * techMult * homeMult);
}

// Declare war between two hostile kingdoms
export async function runWarDeclarations(worldDay: number) {
  const kingdoms = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.status, "active"));
  if (kingdoms.length < 2) return;

  const activeWars  = await db.select().from(warsTable).where(eq(warsTable.status, "ongoing"));
  const atWarNames  = new Set([...activeWars.map(w => w.attackerKingdom), ...activeWars.map(w => w.defenderKingdom)]);

  const hostileRels = await db.select().from(kingdomRelationsTable).where(eq(kingdomRelationsTable.relation, "hostile"));

  for (const rel of hostileRels) {
    if (!chance(0.25)) continue; // 25% chance per hostile pair per tick
    const attacker = kingdoms.find(k => k.name === rel.kingdomNameA);
    const defender = kingdoms.find(k => k.name === rel.kingdomNameB);
    if (!attacker || !defender) continue;
    if (atWarNames.has(attacker.name) || atWarNames.has(defender.name)) continue;
    // Need sufficient military power to declare war
    if (attacker.militaryPower < 50) continue;

    await db.insert(warsTable).values({
      attackerKingdom: attacker.name,
      defenderKingdom: defender.name,
      status: "ongoing",
      startDay: worldDay,
      resultDescription: `${attacker.name} tuyên chiến với ${defender.name}!`,
    });
    await db.update(beastKingdomsTable).set({ warCount: attacker.warCount + 1 }).where(eq(beastKingdomsTable.id, attacker.id));
    await db.insert(historyTable).values({
      worldDay, eventType: "war_declared",
      description: `[Năm ${worldDay}] ⚔️ CHIẾN TRANH! ${attacker.name} tuyên chiến với ${defender.name}! Quân lực: ${attacker.militaryPower} vs ${defender.militaryPower}.`,
    });
    atWarNames.add(attacker.name);
    atWarNames.add(defender.name);
  }
}

// Resolve ongoing wars
export async function resolveWars(worldDay: number) {
  const ongoingWars = await db.select().from(warsTable).where(eq(warsTable.status, "ongoing"));
  const allKingdoms = await db.select().from(beastKingdomsTable);
  const territories = await db.select().from(territoriesTable);

  for (const war of ongoingWars) {
    // War lasts 3-6 ticks before resolution
    if (worldDay - war.startDay < 3) continue;
    if (!chance(0.5)) continue; // 50% chance to resolve each tick after min duration

    const attacker = allKingdoms.find(k => k.name === war.attackerKingdom);
    const defender = allKingdoms.find(k => k.name === war.defenderKingdom);
    if (!attacker || !defender) {
      // One side collapsed — auto end
      await db.update(warsTable).set({ status: "ceasefire", endDay: worldDay, resultDescription: "Một bên sụp đổ, chiến tranh kết thúc." }).where(eq(warsTable.id, war.id));
      continue;
    }

    const attackPower  = await calcWarPower(attacker, false);
    const defendPower  = await calcWarPower(defender, true);
    const total        = attackPower + defendPower;
    const attackerWins = Math.random() < attackPower / total;

    // Calculate casualties
    const attackCasualties = ri(Math.floor(attacker.militaryPower * 0.1), Math.floor(attacker.militaryPower * 0.3));
    const defendCasualties = ri(Math.floor(defender.militaryPower * 0.1), Math.floor(defender.militaryPower * 0.3));

    // Apply population losses from casualties
    const [attackCreature] = await db.select().from(creaturesTable).where(eq(creaturesTable.name, attacker.dominantSpecies));
    const [defendCreature] = await db.select().from(creaturesTable).where(eq(creaturesTable.name, defender.dominantSpecies));
    if (attackCreature) {
      await db.update(creaturesTable).set({ population: Math.max(10, attackCreature.population - attackCasualties) }).where(eq(creaturesTable.id, attackCreature.id));
    }
    if (defendCreature) {
      await db.update(creaturesTable).set({ population: Math.max(10, defendCreature.population - defendCasualties) }).where(eq(creaturesTable.id, defendCreature.id));
    }

    if (attackerWins) {
      // Attacker takes one of defender's territories
      const defenderTerritories = territories.filter(t => t.controllingKingdom === defender.name);
      const conqueredTerritory  = defenderTerritories.length > 0 ? defenderTerritories[ri(0, defenderTerritories.length - 1)] : null;
      let territoryWon: string | undefined;
      if (conqueredTerritory) {
        territoryWon = conqueredTerritory.zoneName;
        await db.update(territoriesTable).set({ controllingKingdom: attacker.name, contested: false }).where(eq(territoriesTable.id, conqueredTerritory.id));
        await db.update(beastKingdomsTable).set({ territoryCount: attacker.territoryCount + 1 }).where(eq(beastKingdomsTable.id, attacker.id));
        await db.update(beastKingdomsTable).set({ territoryCount: Math.max(0, defender.territoryCount - 1) }).where(eq(beastKingdomsTable.id, defender.id));
      }
      // Attacker morale up, defender morale down
      await db.update(beastKingdomsTable).set({ morale: Math.min(100, attacker.morale + 15), warWins: attacker.warWins + 1 }).where(eq(beastKingdomsTable.id, attacker.id));
      await db.update(beastKingdomsTable).set({ morale: Math.max(10, defender.morale - 20) }).where(eq(beastKingdomsTable.id, defender.id));
      const result = territoryWon
        ? `${attacker.name} đại thắng! Chiếm ${territoryWon} từ tay ${defender.name}.`
        : `${attacker.name} đại thắng! ${defender.name} tổn thất nặng nề.`;
      await db.update(warsTable).set({
        status: "attacker_won", endDay: worldDay, territoryWon: territoryWon ?? null,
        attackerCasualties: attackCasualties, defenderCasualties: defendCasualties,
        resultDescription: result,
      }).where(eq(warsTable.id, war.id));
      await db.insert(historyTable).values({
        worldDay, eventType: "war_won",
        description: `[Năm ${worldDay}] 🏆 ${result} Thương vong: ${attacker.name} mất ${attackCasualties}, ${defender.name} mất ${defendCasualties} quân.`,
      });
      // Check if defender lost their capital
      if (conqueredTerritory?.zoneName === defender.capital) {
        await db.update(beastKingdomsTable).set({ status: "collapsed" }).where(eq(beastKingdomsTable.id, defender.id));
        await db.insert(historyTable).values({
          worldDay, eventType: "kingdom_collapsed",
          description: `[Năm ${worldDay}] 💀 ${defender.name} sụp đổ! Thủ đô thất thủ trước ${attacker.name}.`,
        });
      }
    } else {
      // Defender repels — attacker morale down
      await db.update(beastKingdomsTable).set({ morale: Math.max(10, attacker.morale - 15) }).where(eq(beastKingdomsTable.id, attacker.id));
      await db.update(beastKingdomsTable).set({ morale: Math.min(100, defender.morale + 10) }).where(eq(beastKingdomsTable.id, defender.id));
      const result = `${defender.name} phòng thủ thành công! ${attacker.name} bại trận rút lui.`;
      await db.update(warsTable).set({
        status: "defender_won", endDay: worldDay,
        attackerCasualties: attackCasualties, defenderCasualties: defendCasualties,
        resultDescription: result,
      }).where(eq(warsTable.id, war.id));
      await db.insert(historyTable).values({
        worldDay, eventType: "war_won",
        description: `[Năm ${worldDay}] 🛡️ ${result} Thương vong: ${attacker.name} mất ${attackCasualties}, ${defender.name} mất ${defendCasualties} quân.`,
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// V6 — REBELLION SYSTEM
// ═══════════════════════════════════════════════════════════════
export async function checkRebellions(worldDay: number) {
  const kingdoms   = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.status, "active"));
  const allKingdoms= await db.select().from(beastKingdomsTable);
  for (const kingdom of kingdoms) {
    if (kingdom.morale > 30) continue; // Only low-morale kingdoms face rebellion
    if (!chance(0.15)) continue;        // 15% chance per low-morale kingdom per tick
    const myTerritories = await db.select().from(territoriesTable).where(eq(territoriesTable.controllingKingdom, kingdom.name));
    if (myTerritories.length < 2) continue; // Need at least 2 territories to lose one
    // A non-capital territory rebels
    const nonCapitals = myTerritories.filter(t => t.zoneName !== kingdom.capital);
    if (nonCapitals.length === 0) continue;
    const rebel = nonCapitals[ri(0, nonCapitals.length - 1)]!;
    // The dominant species in that territory forms a new kingdom
    const rebels        = await db.select().from(creaturesTable).where(eq(creaturesTable.habitat, rebel.zoneName));
    const dominantRebel = rebels.filter(c => c.status === "alive").sort((a, b) => b.population - a.population)[0];
    if (!dominantRebel || dominantRebel.population < 100) continue;
    const core        = dominantRebel.name.split(" ").at(-1) ?? dominantRebel.name;
    const newName     = `Xích ${core} Quốc`;
    const alreadyExists = allKingdoms.some(k => k.name === newName);
    if (alreadyExists) continue;
    const military    = Math.floor(dominantRebel.population * 0.10);
    await db.insert(beastKingdomsTable).values({
      name: newName, dominantSpecies: dominantRebel.name,
      foundedDay: worldDay, capital: rebel.zoneName,
      militaryPower: military, economy: Math.floor(military * 0.5), influence: Math.floor(military * 0.3),
      population: dominantRebel.population, territoryCount: 1, status: "active",
      technologyLevel: 1, morale: 90, warCount: 0, warWins: 0,
    });
    await db.update(territoriesTable).set({ controllingKingdom: newName }).where(eq(territoriesTable.id, rebel.id));
    await db.update(beastKingdomsTable).set({
      territoryCount: Math.max(0, kingdom.territoryCount - 1),
      morale: Math.max(5, kingdom.morale - 15),
    }).where(eq(beastKingdomsTable.id, kingdom.id));
    // New kingdom is hostile to former ruler
    await db.insert(kingdomRelationsTable).values({ kingdomNameA: newName, kingdomNameB: kingdom.name, relation: "hostile", sinceDay: worldDay });
    await db.insert(historyTable).values({
      worldDay, eventType: "rebellion",
      description: `[Năm ${worldDay}] 🔥 NỔI LOẠN! ${rebel.zoneName} ly khai khỏi ${kingdom.name}. ${newName} thành lập! Dân số: ${dominantRebel.population}.`,
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// V6 — HERO SYSTEM
// ═══════════════════════════════════════════════════════════════
export async function runHeroSystem(worldDay: number) {
  const kingdoms = await db.select().from(beastKingdomsTable).where(eq(beastKingdomsTable.status, "active"));
  for (const kingdom of kingdoms) {
    if (kingdom.militaryPower < 200) continue; // Only powerful kingdoms get heroes
    if (!chance(0.05)) continue; // 5% chance per tick
    // Check if already has 2 heroes (cap)
    const existingHeroes = await db.select().from(heroesTable).where(and(eq(heroesTable.kingdomName, kingdom.name), eq(heroesTable.status, "active")));
    if (existingHeroes.length >= 2) continue;
    const heroName    = generateHeroName(kingdom.dominantSpecies);
    const level       = ri(5, 15);
    const ability     = pick(HERO_ABILITIES);
    const milBonus    = ri(20, 60);
    const morBonus    = ri(5, 20);
    await db.insert(heroesTable).values({
      name: heroName, kingdomName: kingdom.name, level, ability,
      militaryBonus: milBonus, moraleBonus: morBonus, status: "active", bornDay: worldDay,
    });
    // Hero boosts morale
    await db.update(beastKingdomsTable).set({ morale: Math.min(100, kingdom.morale + morBonus) }).where(eq(beastKingdomsTable.id, kingdom.id));
    await db.insert(historyTable).values({
      worldDay, eventType: "hero_born",
      description: `[Năm ${worldDay}] ⭐ ANH HÙNG XUẤT THẾ! ${heroName} xuất hiện tại ${kingdom.name}! Tuyệt kỹ: ${ability}. Quân lực +${milBonus}.`,
    });
  }
  // Heroes occasionally fall in battle
  const activeHeroes = await db.select().from(heroesTable).where(eq(heroesTable.status, "active"));
  for (const hero of activeHeroes) {
    if (!chance(0.02)) continue; // 2% chance to fall per tick
    await db.update(heroesTable).set({ status: "fallen" }).where(eq(heroesTable.id, hero.id));
    await db.insert(historyTable).values({
      worldDay, eventType: "hero_fallen",
      description: `[Năm ${worldDay}] 💔 ${hero.name} của ${hero.kingdomName} đã anh dũng hy sinh trong chiến trận!`,
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
  // V6
  if (worldDay % 2 === 0) await runWarDeclarations(worldDay);
  await resolveWars(worldDay);
  if (worldDay % 6 === 0) await checkRebellions(worldDay);
  if (worldDay % 7 === 0) await runHeroSystem(worldDay);
}
