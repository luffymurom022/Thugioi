import {
  db,
  worldsTable,
  universePortalsTable,
  universeEventsTable,
  interworldWarsTable,
  creaturesTable,
  beastKingdomsTable,
  warsTable,
} from "@workspace/db";
import { eq, count, sum, and } from "drizzle-orm";
import { logger } from "./logger";

// ── World adjacency (which worlds can open portals to each other) ──────────
export const WORLD_ADJACENCY: [number, number][] = [
  [1, 2], // Thú Giới ↔ Nhân Giới
  [1, 6], // Thú Giới ↔ Long Giới
  [2, 3], // Nhân Giới ↔ Ma Giới
  [2, 4], // Nhân Giới ↔ Tiên Giới
  [3, 8], // Ma Giới ↔ Minh Giới
  [4, 5], // Tiên Giới ↔ Thần Giới
  [4, 7], // Tiên Giới ↔ Linh Giới
  [5, 9], // Thần Giới ↔ Thiên Giới
  [6, 9], // Long Giới ↔ Thiên Giới
  [7, 8], // Linh Giới ↔ Minh Giới
];

// ── Base growth profiles per world type ───────────────────────────────────
const WORLD_PROFILES: Record<string, { growthRate: number; powerBase: number; spiritBase: number }> = {
  beast:      { growthRate: 0.03, powerBase: 800,  spiritBase: 150 },
  human:      { growthRate: 0.04, powerBase: 600,  spiritBase: 100 },
  demon:      { growthRate: 0.02, powerBase: 950,  spiritBase: 80  },
  immortal:   { growthRate: 0.01, powerBase: 1200, spiritBase: 400 },
  divine:     { growthRate: 0.005,powerBase: 2000, spiritBase: 800 },
  dragon:     { growthRate: 0.015,powerBase: 1500, spiritBase: 200 },
  spirit:     { growthRate: 0.02, powerBase: 700,  spiritBase: 600 },
  underworld: { growthRate: 0.025,powerBase: 900,  spiritBase: 50  },
  heaven:     { growthRate: 0.008,powerBase: 2500, spiritBase: 999 },
};

// ── Update Thú Giới (world 1) stats from actual DB ────────────────────────
async function updateThuGioiStats(universeDay: number): Promise<void> {
  const [creaturesRow] = await db
    .select({ total: sum(creaturesTable.population), species: count() })
    .from(creaturesTable)
    .where(eq(creaturesTable.status, "alive"));

  const [kingdomsRow] = await db
    .select({ n: count() })
    .from(beastKingdomsTable)
    .where(eq(beastKingdomsTable.status, "active"));

  const kingdoms = await db
    .select({ mp: beastKingdomsTable.militaryPower })
    .from(beastKingdomsTable)
    .where(eq(beastKingdomsTable.status, "active"));

  const totalPower = kingdoms.reduce((s, k) => s + k.mp, 0);

  await db
    .update(worldsTable)
    .set({
      totalCreatures: Number(creaturesRow.total ?? 0),
      totalSpecies: Number(creaturesRow.species ?? 0),
      totalKingdoms: kingdomsRow.n,
      powerLevel: Math.max(1, totalPower),
      worldDay: universeDay,
    })
    .where(eq(worldsTable.id, 1));
}

// ── Lite simulation for non-Thú-Giới worlds ───────────────────────────────
async function runWorldLiteSimulation(world: { id: number; type: string; totalCreatures: number; totalKingdoms: number; powerLevel: number; spiritualEnergy: number; worldDay: number }): Promise<void> {
  const profile = WORLD_PROFILES[world.type] ?? WORLD_PROFILES.beast;

  // Population growth with carrying capacity
  const capacity = 50000;
  const growthFactor = 1 + profile.growthRate * (1 - world.totalCreatures / capacity);
  const newCreatures = Math.min(capacity, Math.max(0, Math.round(world.totalCreatures * growthFactor)));

  // Kingdom count evolves slowly
  const maxKingdoms = 8;
  let newKingdoms = world.totalKingdoms;
  if (world.totalCreatures > 1000 && world.totalKingdoms < maxKingdoms && Math.random() < 0.05) {
    newKingdoms++;
  } else if (world.totalCreatures < 200 && world.totalKingdoms > 1 && Math.random() < 0.08) {
    newKingdoms = Math.max(0, newKingdoms - 1);
  }

  // Power level fluctuates with kingdoms and random events
  const powerDelta = (Math.random() - 0.48) * 20;
  const newPower = Math.max(1, Math.round(world.powerLevel + powerDelta + newKingdoms * 5));

  // Spiritual energy regenerates slowly, capped
  const spiritRegen = Math.round(profile.spiritBase * 0.01);
  const newSpirit = Math.min(999, world.spiritualEnergy + spiritRegen);

  await db
    .update(worldsTable)
    .set({
      totalCreatures: newCreatures,
      totalKingdoms: newKingdoms,
      powerLevel: newPower,
      spiritualEnergy: newSpirit,
      worldDay: world.worldDay + 1,
    })
    .where(eq(worldsTable.id, world.id));
}

// ── Portal system ──────────────────────────────────────────────────────────
async function processPortals(universeDay: number, worlds: { id: number; spiritualEnergy: number }[]): Promise<void> {
  const worldMap = new Map(worlds.map((w) => [w.id, w]));

  for (const [a, b] of WORLD_ADJACENCY) {
    const wA = worldMap.get(a);
    const wB = worldMap.get(b);
    if (!wA || !wB) continue;

    // Check if portal already exists
    const [existing] = await db
      .select()
      .from(universePortalsTable)
      .where(
        and(eq(universePortalsTable.worldAId, a), eq(universePortalsTable.worldBId, b))
      )
      .limit(1);

    if (!existing) {
      // Small chance to open a new portal when both worlds have high spiritual energy
      if (wA.spiritualEnergy > 300 && wB.spiritualEnergy > 300 && Math.random() < 0.02) {
        await db.insert(universePortalsTable).values({
          worldAId: a,
          worldBId: b,
          status: "open",
          openedDay: universeDay,
          portalStrength: Math.round(Math.min(wA.spiritualEnergy, wB.spiritualEnergy) / 10),
        });

        const worldNames = await db.select({ id: worldsTable.id, name: worldsTable.displayName }).from(worldsTable);
        const nameMap = new Map(worldNames.map((w) => [w.id, w.name]));
        await db.insert(universeEventsTable).values({
          universeDay,
          eventType: "portal_open",
          title: `Cổng Không Gian Mở: ${nameMap.get(a)} ↔ ${nameMap.get(b)}`,
          description: `Cổng không gian huyền bí kết nối ${nameMap.get(a)} và ${nameMap.get(b)} chính thức mở ra, mở ra kỷ nguyên giao thương và xung đột liên giới.`,
          affectedWorlds: JSON.stringify([a, b]),
          severity: "major",
        });
      }
    } else if (existing.status === "open") {
      // Small chance portal becomes unstable or closes
      if (Math.random() < 0.005) {
        await db
          .update(universePortalsTable)
          .set({ status: "unstable" })
          .where(eq(universePortalsTable.id, existing.id));
      } else if (Math.random() < 0.002) {
        await db
          .update(universePortalsTable)
          .set({ status: "closed", closedDay: universeDay })
          .where(eq(universePortalsTable.id, existing.id));
      }
    }
  }
}

// ── Inter-world wars ───────────────────────────────────────────────────────
async function processInterworldWars(universeDay: number, worlds: { id: number; powerLevel: number; displayName: string }[]): Promise<void> {
  // Check for ongoing wars first
  const ongoingWars = await db
    .select()
    .from(interworldWarsTable)
    .where(eq(interworldWarsTable.status, "ongoing"));

  for (const war of ongoingWars) {
    // Resolve after a few days
    if (universeDay - war.startDay >= 3 && Math.random() < 0.3) {
      const attacker = worlds.find((w) => w.id === war.attackerWorldId);
      const defender = worlds.find((w) => w.id === war.defenderWorldId);
      if (!attacker || !defender) continue;

      const attackPower = attacker.powerLevel * (0.8 + Math.random() * 0.4);
      const defensePower = defender.powerLevel * 1.1 * (0.8 + Math.random() * 0.4);
      const attackerWon = attackPower > defensePower;

      await db
        .update(interworldWarsTable)
        .set({
          status: attackerWon ? "attacker_won" : "defender_won",
          endDay: universeDay,
        })
        .where(eq(interworldWarsTable.id, war.id));

      await db.insert(universeEventsTable).values({
        universeDay,
        eventType: "interworld_war",
        title: `${attackerWon ? attacker.displayName : defender.displayName} Thắng Chiến`,
        description: `Cuộc chiến liên giới giữa ${attacker.displayName} và ${defender.displayName} kết thúc. ${attackerWon ? attacker.displayName : defender.displayName} giành chiến thắng sau trận quyết chiến khốc liệt.`,
        affectedWorlds: JSON.stringify([war.attackerWorldId, war.defenderWorldId]),
        severity: "major",
      });
    }
  }

  // Small chance a new interworld war breaks out through an open portal
  if (Math.random() < 0.008) {
    const openPortals = await db
      .select()
      .from(universePortalsTable)
      .where(eq(universePortalsTable.status, "open"));

    if (openPortals.length > 0) {
      const portal = openPortals[Math.floor(Math.random() * openPortals.length)];
      const alreadyAtWar = ongoingWars.some(
        (w) =>
          (w.attackerWorldId === portal.worldAId && w.defenderWorldId === portal.worldBId) ||
          (w.attackerWorldId === portal.worldBId && w.defenderWorldId === portal.worldAId)
      );

      if (!alreadyAtWar) {
        const wA = worlds.find((w) => w.id === portal.worldAId);
        const wB = worlds.find((w) => w.id === portal.worldBId);
        if (wA && wB) {
          const attacker = wA.powerLevel > wB.powerLevel ? wA : wB;
          const defender = attacker === wA ? wB : wA;

          const attackerKingdoms = await db
            .select({ name: beastKingdomsTable.name })
            .from(beastKingdomsTable)
            .where(and(eq(beastKingdomsTable.status, "active"), eq(beastKingdomsTable.worldId, attacker.id)))
            .limit(1);

          const defenderKingdoms = await db
            .select({ name: beastKingdomsTable.name })
            .from(beastKingdomsTable)
            .where(and(eq(beastKingdomsTable.status, "active"), eq(beastKingdomsTable.worldId, defender.id)))
            .limit(1);

          const attackerKingdom = attackerKingdoms[0]?.name ?? `${attacker.displayName} Đế Quốc`;
          const defenderKingdom = defenderKingdoms[0]?.name ?? `${defender.displayName} Liên Minh`;

          await db.insert(interworldWarsTable).values({
            attackerWorldId: attacker.id,
            defenderWorldId: defender.id,
            attackerKingdom,
            defenderKingdom,
            status: "ongoing",
            startDay: universeDay,
            portalId: portal.id,
            description: `${attacker.displayName} xâm lược ${defender.displayName} qua cổng không gian, tuyên bố mở rộng đế quốc liên giới.`,
          });

          await db.insert(universeEventsTable).values({
            universeDay,
            eventType: "interworld_war",
            title: `Chiến Tranh Liên Giới: ${attacker.displayName} → ${defender.displayName}`,
            description: `${attacker.displayName} phát động chiến tranh xâm lược ${defender.displayName}. Lực lượng từ hai thế giới đang đối đầu tại cổng không gian.`,
            affectedWorlds: JSON.stringify([attacker.id, defender.id]),
            severity: "catastrophic",
          });
        }
      }
    }
  }
}

// ── Cosmic events ──────────────────────────────────────────────────────────
async function maybeTriggerCosmicEvent(universeDay: number, worldIds: number[]): Promise<void> {
  if (Math.random() > 0.03) return;

  const events = [
    {
      eventType: "cosmic_event",
      title: "Hỗn Độn Bạo Động",
      description: "Năng lượng hỗn nguyên bùng phát, tất cả các giới đồng thời chấn động. Linh khí nguyên thủy tràn ngập khắp vũ trụ.",
      severity: "cosmic",
      worlds: worldIds,
    },
    {
      eventType: "cosmic_event",
      title: "Đại Diệt Thế Dư Chấn",
      description: "Dư âm của Đại Diệt Thế cổ đại vang lên. Các thế giới yếu hơn rùng mình trước sức mạnh hủy diệt.",
      severity: "catastrophic",
      worlds: worldIds.slice(0, 5),
    },
    {
      eventType: "cosmic_event",
      title: "Kỷ Nguyên Thần Thú Thức Tỉnh",
      description: "Các Thần Thú cổ đại trên khắp Cửu Giới đồng loạt thức tỉnh, linh khí vũ trụ dâng cao đến mức chưa từng thấy.",
      severity: "major",
      worlds: worldIds,
    },
    {
      eventType: "cosmic_event",
      title: "Thái Cực Dịch Chuyển",
      description: "Thái Cực — nguồn gốc của vũ trụ — đột nhiên dịch chuyển. Cân bằng giữa các giới bị phá vỡ tạm thời.",
      severity: "catastrophic",
      worlds: worldIds,
    },
  ];

  const ev = events[Math.floor(Math.random() * events.length)];
  await db.insert(universeEventsTable).values({
    universeDay,
    eventType: ev.eventType,
    title: ev.title,
    description: ev.description,
    affectedWorlds: JSON.stringify(ev.worlds),
    severity: ev.severity,
  });
}

// ── Main universe tick ─────────────────────────────────────────────────────
export async function runUniverseTick(): Promise<void> {
  try {
    const worlds = await db.select().from(worldsTable);
    if (worlds.length === 0) return;

    const thuGioi = worlds.find((w) => w.id === 1);
    const universeDay = thuGioi ? thuGioi.worldDay : 1;

    // Update Thú Giới from real data
    await updateThuGioiStats(universeDay);

    // Lite simulation for all other worlds
    for (const world of worlds) {
      if (world.id === 1) continue;
      await runWorldLiteSimulation(world);
    }

    // Universe-level systems
    await processPortals(universeDay, worlds);
    await processInterworldWars(universeDay, worlds);
    await maybeTriggerCosmicEvent(universeDay, worlds.map((w) => w.id));
  } catch (err) {
    logger.error({ err }, "Universe tick error");
  }
}

// ── Universe summary query ─────────────────────────────────────────────────
export async function getUniverseSummary() {
  const worlds = await db.select().from(worldsTable);
  const portals = await db.select().from(universePortalsTable).where(eq(universePortalsTable.status, "open"));
  const events = await db.select().from(universeEventsTable).orderBy(universeEventsTable.createdAt).limit(20);
  const wars = await db.select().from(interworldWarsTable).where(eq(interworldWarsTable.status, "ongoing"));

  const totalCreatures = worlds.reduce((s, w) => s + w.totalCreatures, 0);
  const totalKingdoms = worlds.reduce((s, w) => s + w.totalKingdoms, 0);
  const totalSpecies = worlds.reduce((s, w) => s + w.totalSpecies, 0);
  const strongestWorld = worlds.reduce((a, b) => (a.powerLevel > b.powerLevel ? a : b), worlds[0]);

  return {
    worlds,
    portals,
    events: events.reverse(),
    wars,
    summary: {
      totalWorlds: worlds.length,
      totalCreatures,
      totalKingdoms,
      totalSpecies,
      openPortals: portals.length,
      activeWars: wars.length,
      strongestWorldName: strongestWorld?.displayName ?? "—",
      strongestWorldPower: strongestWorld?.powerLevel ?? 0,
    },
  };
}
