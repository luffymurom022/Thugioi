import {
  db,
  creaturesTable,
  beastKingdomsTable,
  warsTable,
  heroesTable,
  historyTable,
  worldAgesTable,
  legendsTable,
  mythsTable,
  bloodlineHistoriesTable,
  loreBooksTable,
  loreNewsTable,
} from "@workspace/db";
import { eq, desc, asc, sql, notInArray, inArray } from "drizzle-orm";

const AGE_TRIGGERS = [
  {
    trigger: "genesis",
    name: "Kỷ Nguyên Khai Sinh",
    description:
      "Thủa ban đầu của Thú Giới — khi những sinh vật đầu tiên xuất hiện và thế giới còn hoang sơ, chưa có dấu chân văn minh.",
  },
  {
    trigger: "first_kingdom",
    name: "Kỷ Nguyên Vạn Thú",
    description:
      "Thời đại của muôn thú — các loài sinh vật sinh sôi phát triển mạnh mẽ, những vương quốc đầu tiên hình thành trên các vùng đất rộng lớn.",
  },
  {
    trigger: "first_war",
    name: "Kỷ Nguyên Chinh Chiến",
    description:
      "Thời đại binh đao — máu và lửa bao phủ khắp Thú Giới, các Vương Quốc giao chiến không ngừng để tranh giành quyền thống trị.",
  },
  {
    trigger: "divine_beast",
    name: "Kỷ Nguyên Thần Thú",
    description:
      "Thời đại của những Thần Thú huyền bí — các sinh vật có quyền năng vượt trội mọi sinh linh xuất hiện, định hình lại trật tự Thú Giới.",
  },
  {
    trigger: "mass_extinction",
    name: "Kỷ Nguyên Hỗn Độn",
    description:
      "Thế giới rơi vào hỗn loạn — các loài đứng trước bờ vực tuyệt chủng hàng loạt, chỉ những sinh vật mạnh nhất mới tồn tại.",
  },
];

export async function runLoreEngine(worldDay: number): Promise<void> {
  try {
    const [creatures, kingdoms, wars, heroes, history] = await Promise.all([
      db.select().from(creaturesTable),
      db.select().from(beastKingdomsTable),
      db.select().from(warsTable),
      db.select().from(heroesTable),
      db.select().from(historyTable).orderBy(desc(historyTable.id)).limit(100),
    ]);

    await generateAgesIfNeeded(worldDay, creatures, kingdoms, wars);
    await generateLegendsFromHistory(worldDay, history, creatures, kingdoms, heroes, wars);
    await generateMythsIfNeeded(worldDay, creatures, kingdoms, heroes, wars);
    await generateBloodlineHistories(creatures);
    await generateLoreNews(worldDay, history, kingdoms, wars, heroes);
    await generateLoreBooks(worldDay);
  } catch (_err) {
    // Lore engine errors are non-fatal
  }
}

async function generateAgesIfNeeded(
  worldDay: number,
  creatures: any[],
  kingdoms: any[],
  wars: any[]
): Promise<void> {
  const existingAges = await db.select().from(worldAgesTable).orderBy(asc(worldAgesTable.id));
  const existingTriggers = new Set(existingAges.map((a) => a.trigger));

  const livingSpecies = creatures.filter((c) => c.status === "alive");
  const extinctSpecies = creatures.filter((c) => c.status === "extinct");
  const hasDivineBeast = creatures.some((c) => c.rankLevel >= 7 && c.status === "alive");
  const massExtinction =
    creatures.length > 5 && extinctSpecies.length > livingSpecies.length;

  const toAdd: string[] = [];

  if (!existingTriggers.has("genesis")) {
    toAdd.push("genesis");
  }
  if (!existingTriggers.has("first_kingdom") && kingdoms.length > 0) {
    toAdd.push("first_kingdom");
  }
  if (!existingTriggers.has("first_war") && wars.length > 0) {
    toAdd.push("first_war");
  }
  if (!existingTriggers.has("divine_beast") && hasDivineBeast) {
    toAdd.push("divine_beast");
  }
  if (!existingTriggers.has("mass_extinction") && massExtinction) {
    toAdd.push("mass_extinction");
  }

  if (toAdd.length === 0) return;

  // Mark all existing as not current
  if (existingAges.length > 0) {
    await db.update(worldAgesTable).set({ isCurrent: false, endDay: worldDay });
  }

  for (const trigger of toAdd) {
    const def = AGE_TRIGGERS.find((a) => a.trigger === trigger);
    if (!def) continue;
    await db.insert(worldAgesTable).values({
      name: def.name,
      description: def.description,
      trigger: def.trigger,
      startDay: worldDay,
      isCurrent: trigger === toAdd[toAdd.length - 1],
    });
  }
}

async function generateLegendsFromHistory(
  worldDay: number,
  history: any[],
  creatures: any[],
  kingdoms: any[],
  heroes: any[],
  wars: any[]
): Promise<void> {
  const significantTypes = new Set([
    "kingdom_founded",
    "war_declared",
    "war_won",
    "extinction",
    "evolution",
    "hero_born",
    "hero_fallen",
    "kingdom_collapsed",
    "disaster",
    "conquest",
  ]);

  const significantEvents = history.filter((e) => significantTypes.has(e.eventType));
  if (significantEvents.length === 0) return;

  const existingSourceIds = await db
    .select({ sourceEventId: legendsTable.sourceEventId })
    .from(legendsTable)
    .where(sql`${legendsTable.sourceEventId} IS NOT NULL`);
  const coveredIds = new Set(existingSourceIds.map((r) => r.sourceEventId));

  const uncoveredEvents = significantEvents
    .filter((e) => !coveredIds.has(e.id))
    .slice(0, 5);

  for (const event of uncoveredEvents) {
    const legend = buildLegendFromEvent(event, creatures, kingdoms, heroes, wars, worldDay);
    if (legend) {
      await db.insert(legendsTable).values(legend);
    }
  }
}

function buildLegendFromEvent(
  event: any,
  creatures: any[],
  kingdoms: any[],
  heroes: any[],
  wars: any[],
  worldDay: number
): any | null {
  const day = event.worldDay;
  const desc = event.description;

  switch (event.eventType) {
    case "kingdom_founded": {
      const kingdom = kingdoms.find((k) => desc.includes(k.name));
      const kName = kingdom?.name ?? desc.split(" ")[0] ?? "Vô Danh";
      return {
        title: `Sự Ra Đời Của ${kName}`,
        content: `Vào năm ${day} của Thú Giới, ${kName} được thành lập giữa vùng đất ${kingdom?.capital ?? "hoang vu"}. Từ một bầy thú nhỏ bé, ${kName} đã vươn lên trở thành một vương quốc hùng mạnh dưới sự thống trị của tộc ${kingdom?.dominantSpecies ?? "Thú"}. Sự kiện này đánh dấu một bước ngoặt lớn trong lịch sử Thú Giới — khi những con thú không còn chỉ săn mồi mà bắt đầu xây dựng văn minh của riêng mình.`,
        category: "kingdom",
        sourceEventId: event.id,
        relatedEntity: kName,
        worldDay,
      };
    }
    case "war_declared": {
      const war = wars.find((w) => desc.includes(w.attackerKingdom) || desc.includes(w.defenderKingdom));
      const attacker = war?.attackerKingdom ?? "Một vương quốc";
      const defender = war?.defenderKingdom ?? "vương quốc khác";
      return {
        title: `Đại Chiến Năm ${day}`,
        content: `Sử sách chép rằng: Vào năm thứ ${day}, ${attacker} tuyên chiến với ${defender}. Đây là một trong những cuộc chiến đẫm máu nhất Thú Giới từng chứng kiến. Các đội quân hùng mạnh xé toạc bầu trời đêm, tiếng gầm thét của muôn thú vang vọng khắp mọi vùng đất. Máu đã đổ — lịch sử đã sang trang.`,
        category: "war",
        sourceEventId: event.id,
        relatedEntity: attacker,
        worldDay,
      };
    }
    case "war_won": {
      const war = wars.find((w) => w.status === "attacker_won" && desc.includes(w.attackerKingdom));
      const winner = war?.attackerKingdom ?? desc.split(" ")[0] ?? "Anh hùng";
      const territory = war?.territoryWon ?? "vùng đất tranh chấp";
      return {
        title: `Chiến Thắng Của ${winner}`,
        content: `Lịch sử Thú Giới ghi lại: Vào năm ${day}, ${winner} đã giành chiến thắng vẻ vang, thu phục ${territory}. Những chiến binh dũng mãnh đã hi sinh xương máu để bảo vệ vương quốc. Chiến công này được lưu truyền qua nhiều thế hệ như một minh chứng cho sức mạnh và ý chí kiên cường của dòng tộc chiến thắng.`,
        category: "war",
        sourceEventId: event.id,
        relatedEntity: winner,
        worldDay,
      };
    }
    case "extinction": {
      const speciesName = desc.match(/loài\s+(.+?)\s/i)?.[1] ?? desc.split(" ").slice(-1)[0];
      return {
        title: `Sự Tuyệt Diệt Của ${speciesName ?? "Một Loài"}`,
        content: `Năm ${day} — một ngày đen tối trong biên niên sử Thú Giới. ${speciesName ? `Loài ${speciesName}` : "Một loài sinh vật"} đã hoàn toàn biến mất khỏi thế giới này. Từng một thời hùng mạnh, giờ chỉ còn lại trong ký ức của những loài còn sống sót. Sự tuyệt diệt này nhắc nhở mọi sinh linh rằng: không có gì trường tồn mãi mãi.`,
        category: "extinction",
        sourceEventId: event.id,
        relatedEntity: speciesName ?? "",
        worldDay,
      };
    }
    case "evolution": {
      const creature = creatures.find((c) => desc.includes(c.name));
      const cName = creature?.name ?? "Một loài bí ẩn";
      return {
        title: `Tiến Hóa Của ${cName}`,
        content: `Biên niên sử ghi lại sự kiện phi thường vào năm ${day}: ${cName} đã vượt qua giới hạn của chính mình, tiến hóa lên một hình thái hoàn toàn mới. Đây không chỉ là sự thay đổi về thể xác — mà là một cuộc lột xác về linh hồn. Từ đây, ${cName} viết tiếp trang sử hào hùng của dòng tộc mình trên đỉnh cao quyền năng.`,
        category: "evolution",
        sourceEventId: event.id,
        relatedEntity: cName,
        worldDay,
      };
    }
    case "hero_born": {
      const hero = heroes.find((h) => desc.includes(h.name));
      const hName = hero?.name ?? "Đấng Anh Hùng";
      const kName = hero?.kingdomName ?? "Thú Giới";
      return {
        title: `Sự Ra Đời Của Anh Hùng ${hName}`,
        content: `Năm ${day}, Thú Giới chứng kiến sự xuất hiện của một nhân vật phi thường: ${hName}. Sinh ra từ vương quốc ${kName}, ngay từ khi còn nhỏ đã thể hiện tài năng kiệt xuất vượt trội mọi đồng loại. Với khả năng "${hero?.ability ?? "siêu phàm"}", ${hName} được mệnh danh là anh hùng của thời đại — người mà tên tuổi sẽ được lưu truyền mãi mãi trong sử sách Thú Giới.`,
        category: "hero",
        sourceEventId: event.id,
        relatedEntity: hName,
        worldDay,
      };
    }
    case "kingdom_collapsed": {
      const kName = desc.split(" ")[0] ?? "Một vương quốc";
      return {
        title: `Sự Sụp Đổ Của ${kName}`,
        content: `Năm ${day} — ngày tang tóc khi ${kName} sụp đổ. Một đế chế từng hùng bá nay chỉ còn là tro tàn và ký ức. Dân chúng tản mác, anh hùng ngã xuống, lãnh thổ rơi vào tay kẻ thù. Lịch sử một lần nữa chứng minh rằng mọi đế chế đều có ngày tàn — chỉ có di sản mới trường tồn.`,
        category: "kingdom",
        sourceEventId: event.id,
        relatedEntity: kName,
        worldDay,
      };
    }
    default:
      return null;
  }
}

async function generateMythsIfNeeded(
  worldDay: number,
  creatures: any[],
  kingdoms: any[],
  heroes: any[],
  wars: any[]
): Promise<void> {
  const existingMythCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(mythsTable);
  const count = Number(existingMythCount[0]?.count ?? 0);

  // Generate myths progressively as the world grows
  const myths: any[] = [];

  // Myth 1: The strongest creature ever
  if (count < 1) {
    const strongest = [...creatures].sort((a, b) => b.rankLevel - a.rankLevel)[0];
    if (strongest) {
      myths.push({
        title: `Huyền Thoại Về ${strongest.name}`,
        content: `Theo truyền thuyết cổ xưa nhất của Thú Giới, trong buổi bình minh của vũ trụ, ${strongest.name} — một sinh linh cấp ${strongest.rank} hệ ${strongest.element} — đã giáng thế tại vùng ${strongest.habitat}. Với sức mạnh ${strongest.strength} điểm, trí tuệ ${strongest.intelligence} và sinh lực ${strongest.vitality}, đây là sinh vật được coi là gần nhất với đấng thần linh. Dân gian kể rằng tiếng gầm của nó có thể rung chuyển cả đất trời, và bóng dáng của nó làm mây tối che khuất mặt trời.`,
        subject: "creature",
        subjectName: strongest.name,
        worldDay,
      });
    }
  }

  // Myth 2: Origin of the first kingdom
  if (count < 2 && kingdoms.length > 0) {
    const oldest = [...kingdoms].sort((a, b) => a.foundedDay - b.foundedDay)[0];
    if (oldest) {
      myths.push({
        title: `Thần Thoại Sáng Lập ${oldest.name}`,
        content: `Từ xa xưa, người ta kể rằng vào thời hỗn mang khi Thú Giới vừa được tạo ra, một vị tổ tiên vĩ đại của tộc ${oldest.dominantSpecies} đã đứng trên đỉnh cao nhất của vùng ${oldest.capital}, hướng mặt về bốn phương, dang rộng đôi cánh và tuyên bố chủ quyền. Đó là ngày ${oldest.foundedDay} — ngày ${oldest.name} được khai sinh. Theo thần thoại, chính linh khí của vùng đất ${oldest.capital} đã ban phước cho vương quốc này, khiến nó trở thành nơi đầu tiên ánh sáng văn minh soi rọi.`,
        subject: "kingdom",
        subjectName: oldest.name,
        worldDay,
      });
    }
  }

  // Myth 3: The bloodline of war
  if (count < 3 && wars.length >= 3) {
    const topWinner = [...kingdoms].sort((a, b) => b.warWins - a.warWins)[0];
    if (topWinner && topWinner.warWins > 0) {
      myths.push({
        title: `Thần Chiến Của ${topWinner.name}`,
        content: `Truyền thuyết chiến trận kể rằng: ${topWinner.name} không đơn thuần là một vương quốc — đây là đội quân được ban phước bởi Thần Chiến. Với ${topWinner.warWins} chiến thắng lừng danh, quân đội của ${topWinner.name} được mệnh danh là "Không Thể Bại". Tương truyền rằng mỗi khi ${topWinner.name} ra quân, bầu trời sẽ nổi sấm sét như điềm báo từ thần linh — và kẻ thù run sợ trước cả khi trận đánh bắt đầu.`,
        subject: "kingdom",
        subjectName: topWinner.name,
        worldDay,
      });
    }
  }

  // Myth 4: The great hero myth
  if (count < 4 && heroes.length > 0) {
    const greatestHero = [...heroes].sort((a, b) => b.level - a.level)[0];
    if (greatestHero) {
      myths.push({
        title: `Anh Hùng Bất Tử ${greatestHero.name}`,
        content: `Từ thời thượng cổ, dân gian Thú Giới truyền nhau câu chuyện về ${greatestHero.name} — vị anh hùng cấp ${greatestHero.level} của ${greatestHero.kingdomName}. Tương truyền rằng khi ${greatestHero.name} sinh ra, các vì sao đã xếp thành hình kiếm trên bầu trời — điềm báo cho sự ra đời của một chiến thần. Với khả năng "${greatestHero.ability}" bẩm sinh, không ai có thể sánh kịp tài năng của người anh hùng này. Tên tuổi của ${greatestHero.name} sẽ sống mãi trong tim muôn thú.`,
        subject: "hero",
        subjectName: greatestHero.name,
        worldDay,
      });
    }
  }

  for (const myth of myths) {
    await db.insert(mythsTable).values(myth);
  }
}

async function generateBloodlineHistories(creatures: any[]): Promise<void> {
  const bloodlineMap = new Map<string, any[]>();
  for (const c of creatures) {
    const bl = c.bloodline ?? "common";
    if (!bloodlineMap.has(bl)) bloodlineMap.set(bl, []);
    bloodlineMap.get(bl)!.push(c);
  }

  const existing = await db.select({ name: bloodlineHistoriesTable.bloodlineName }).from(bloodlineHistoriesTable);
  const existingNames = new Set(existing.map((e) => e.name));

  for (const [bloodline, members] of bloodlineMap.entries()) {
    if (existingNames.has(bloodline)) continue;
    if (members.length === 0) continue;

    const oldest = [...members].sort((a, b) => b.ageTicks - a.ageTicks)[0];
    const strongest = [...members].sort((a, b) => b.rankLevel - a.rankLevel)[0];
    const alive = members.filter((m) => m.status === "alive");
    const totalPop = members.reduce((s: number, c: any) => s + c.population, 0);
    const elements = [...new Set(members.map((m: any) => m.element))];

    const bloodlineTitles: Record<string, string> = {
      common: "Dân Thường Tộc",
      rare: "Hiếm Tộc",
      epic: "Sử Thi Tộc",
      legendary: "Huyền Thoại Tộc",
      mythic: "Thần Thoại Tộc",
      divine: "Thần Thánh Tộc",
    };
    const title = bloodlineTitles[bloodline] ?? `${bloodline} Tộc`;

    const content = `Huyết mạch ${bloodline} — còn gọi là "${title}" — là một trong những dòng tộc lâu đời của Thú Giới. Tổ tiên của dòng tộc này là ${oldest.name}, đã tồn tại ${oldest.ageTicks} chu kỳ thời gian. Trong tổng số ${members.length} loài thuộc huyết mạch này, hiện có ${alive.length} loài vẫn còn sinh sống với tổng dân số ${totalPop.toLocaleString()}. Dòng tộc này bao gồm các nguyên tố: ${elements.join(", ")}. Cá thể mạnh nhất hiện tại là ${strongest.name} — cấp ${strongest.rank} rank ${strongest.rankLevel}, được coi là đại diện xuất sắc nhất của huyết mạch ${bloodline} trong thời đại này.`;

    await db.insert(bloodlineHistoriesTable).values({
      bloodlineName: bloodline,
      ancestorName: oldest.name,
      totalAgeTicks: oldest.ageTicks,
      peakPopulation: totalPop,
      content,
    });
  }
}

async function generateLoreNews(
  worldDay: number,
  history: any[],
  kingdoms: any[],
  wars: any[],
  heroes: any[]
): Promise<void> {
  const latestNewsDay = await db
    .select({ maxDay: sql<number>`max(world_day)` })
    .from(loreNewsTable);
  const lastDay = Number(latestNewsDay[0]?.maxDay ?? 0);

  if (lastDay >= worldDay) return;

  const recentHistory = history.filter((e) => e.worldDay > lastDay).slice(0, 5);
  if (recentHistory.length === 0) return;

  const activeWars = wars.filter((w) => w.status === "ongoing");
  const topKingdom = [...kingdoms].sort((a, b) => b.militaryPower - a.militaryPower)[0];
  const activeHeroCount = heroes.filter((h) => h.status === "active").length;

  let content = `📰 THÚ GIỚI THỜI BÁO — NĂM ${worldDay}\n\n`;

  for (const event of recentHistory.slice(0, 3)) {
    content += `• [Năm ${event.worldDay}] ${event.description}\n`;
  }

  content += `\n`;

  if (activeWars.length > 0) {
    content += `⚔️ CHIẾN SỰ: Hiện có ${activeWars.length} cuộc chiến đang diễn ra. `;
    content += `${activeWars[0].attackerKingdom} đang giao chiến với ${activeWars[0].defenderKingdom}.\n`;
  }

  if (topKingdom) {
    content += `👑 VƯƠNG QUỐC: ${topKingdom.name} dẫn đầu với sức mạnh quân sự ${topKingdom.militaryPower} điểm.\n`;
  }

  if (activeHeroCount > 0) {
    content += `⭐ ANH HÙNG: ${activeHeroCount} anh hùng đang hoạt động trên khắp Thú Giới.\n`;
  }

  const headline = recentHistory[0]
    ? `${recentHistory[0].description.slice(0, 60)}...`
    : `Thú Giới Cập Nhật — Năm ${worldDay}`;

  await db.insert(loreNewsTable).values({
    headline,
    content,
    category: activeWars.length > 0 ? "war" : "general",
    worldDay,
  });
}

async function generateLoreBooks(worldDay: number): Promise<void> {
  const existingBooks = await db.select().from(loreBooksTable);
  if (existingBooks.length > 0) return;

  const [legends, myths, bloodlines] = await Promise.all([
    db.select().from(legendsTable).orderBy(asc(legendsTable.worldDay)),
    db.select().from(mythsTable).orderBy(asc(mythsTable.worldDay)),
    db.select().from(bloodlineHistoriesTable),
  ]);

  if (legends.length >= 2) {
    const content = legends.map((l) => `# ${l.title}\n\n${l.content}`).join("\n\n---\n\n");
    await db.insert(loreBooksTable).values({
      title: "Đại Biên Niên Sử Thú Giới",
      category: "history",
      content,
      worldDay,
    });
  }

  if (myths.length >= 1) {
    const content = myths.map((m) => `# ${m.title}\n\n${m.content}`).join("\n\n---\n\n");
    await db.insert(loreBooksTable).values({
      title: "Thần Thoại Cổ Đại Thú Giới",
      category: "mythology",
      content,
      worldDay,
    });
  }

  if (bloodlines.length >= 1) {
    const content = bloodlines.map((b) => `# Huyết Mạch ${b.bloodlineName}\n\n${b.content}`).join("\n\n---\n\n");
    await db.insert(loreBooksTable).values({
      title: "Huyết Mạch Sử Thú Giới",
      category: "bloodline",
      content,
      worldDay,
    });
  }
}

export async function getLoreSummary(worldDay: number) {
  const [ages, heroes, kingdoms, creatures, recentLegend, latestNews] = await Promise.all([
    db.select().from(worldAgesTable).where(eq(worldAgesTable.isCurrent, true)).limit(1),
    db.select().from(heroesTable).where(eq(heroesTable.status, "active")),
    db.select().from(beastKingdomsTable),
    db.select().from(creaturesTable),
    db.select().from(legendsTable).orderBy(desc(legendsTable.worldDay)).limit(1),
    db.select().from(loreNewsTable).orderBy(desc(loreNewsTable.worldDay)).limit(1),
  ]);

  const currentAge = ages[0] ?? null;
  const famousHero = [...heroes].sort((a, b) => b.level - a.level)[0] ?? null;

  // Strongest bloodline by average rankLevel
  const bloodlineStrength = new Map<string, number[]>();
  for (const c of creatures) {
    if (c.status === "alive") {
      if (!bloodlineStrength.has(c.bloodline)) bloodlineStrength.set(c.bloodline, []);
      bloodlineStrength.get(c.bloodline)!.push(c.rankLevel);
    }
  }
  let strongestBloodline = "—";
  let maxAvg = 0;
  for (const [bl, ranks] of bloodlineStrength.entries()) {
    const avg = ranks.reduce((s, r) => s + r, 0) / ranks.length;
    if (avg > maxAvg) { maxAvg = avg; strongestBloodline = bl; }
  }

  // Largest historical kingdom
  const largestHistorical = [...kingdoms].sort((a, b) =>
    (b.warWins + b.territoryCount) - (a.warWins + a.territoryCount)
  )[0] ?? null;

  return {
    currentAge: currentAge?.name ?? "Kỷ Nguyên Khai Sinh",
    currentAgeDescription: currentAge?.description ?? "",
    currentAgeStartDay: currentAge?.startDay ?? 1,
    famousHeroName: famousHero?.name ?? null,
    famousHeroKingdom: famousHero?.kingdomName ?? null,
    famousHeroLevel: famousHero?.level ?? null,
    strongestBloodline,
    largestHistoricalKingdomName: largestHistorical?.name ?? null,
    latestLegendTitle: recentLegend[0]?.title ?? null,
    latestNewsHeadline: latestNews[0]?.headline ?? null,
  };
}
