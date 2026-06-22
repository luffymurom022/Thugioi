import {
  db,
  zonesTable,
  creaturesTable,
  historyTable,
  worldStateTable,
  territoriesTable,
  beastKingdomsTable,
  packsTable,
  kingdomRelationsTable,
  evolutionPathsTable,
  worldsTable,
  universePortalsTable,
} from "@workspace/db";
import { count } from "drizzle-orm";
import { logger } from "./logger";

// ── Seed the 9 worlds of Cửu Giới ─────────────────────────────────────────
export async function seedUniverseIfEmpty(): Promise<void> {
  const [row] = await db.select({ n: count() }).from(worldsTable);
  if (row.n > 0) return;

  logger.info("Seeding Cửu Giới — 9 worlds of the universe...");

  await db.insert(worldsTable).values([
    {
      name: "thu-gioi",
      displayName: "Thú Giới",
      type: "beast",
      description: "Thế giới của muôn loài thú, nơi sức mạnh nguyên thủy và tiến hóa không ngừng tạo nên những sinh linh vĩ đại.",
      template: '{"species":"beast","element":"nature","culture":"tribal"}',
      status: "active",
      powerLevel: 850,
      totalCreatures: 2030,
      totalKingdoms: 3,
      totalSpecies: 10,
      worldDay: 1,
      dangerLevel: 6,
      spiritualEnergy: 180,
      colorHex: "#00ffcc",
    },
    {
      name: "nhan-gioi",
      displayName: "Nhân Giới",
      type: "human",
      description: "Thế giới của loài người, nơi trí tuệ và văn minh phát triển vượt bậc. Các đế quốc hùng mạnh tranh giành quyền bá chủ.",
      template: '{"species":"human","element":"mix","culture":"imperial"}',
      status: "active",
      powerLevel: 620,
      totalCreatures: 45000,
      totalKingdoms: 6,
      totalSpecies: 3,
      worldDay: 1,
      dangerLevel: 5,
      spiritualEnergy: 110,
      colorHex: "#60a5fa",
    },
    {
      name: "ma-gioi",
      displayName: "Ma Giới",
      type: "demon",
      description: "Vương quốc của ma tộc, nơi bóng tối và năng lượng hắc ám thống trị. Các Ma Vương tranh giành quyền lực trong địa ngục.",
      template: '{"species":"demon","element":"dark","culture":"warlord"}',
      status: "active",
      powerLevel: 930,
      totalCreatures: 8500,
      totalKingdoms: 4,
      totalSpecies: 8,
      worldDay: 1,
      dangerLevel: 8,
      spiritualEnergy: 85,
      colorHex: "#f43f5e",
    },
    {
      name: "tien-gioi",
      displayName: "Tiên Giới",
      type: "immortal",
      description: "Cảnh giới của tiên nhân và tiên thú, nơi thời gian trôi chậm và linh khí đạt tới mức viên mãn. Các tiên tông hùng cứ.",
      template: '{"species":"immortal","element":"spirit","culture":"sect"}',
      status: "active",
      powerLevel: 1180,
      totalCreatures: 1200,
      totalKingdoms: 5,
      totalSpecies: 15,
      worldDay: 1,
      dangerLevel: 7,
      spiritualEnergy: 420,
      colorHex: "#a78bfa",
    },
    {
      name: "than-gioi",
      displayName: "Thần Giới",
      type: "divine",
      description: "Lãnh địa tối cao của thần tộc, nơi quyền năng vô hạn ngự trị. Chỉ những sinh linh đạt đỉnh cao tiến hóa mới bước vào được.",
      template: '{"species":"divine","element":"holy","culture":"pantheon"}',
      status: "active",
      powerLevel: 2100,
      totalCreatures: 300,
      totalKingdoms: 3,
      totalSpecies: 7,
      worldDay: 1,
      dangerLevel: 10,
      spiritualEnergy: 850,
      colorHex: "#fbbf24",
    },
    {
      name: "long-gioi",
      displayName: "Long Giới",
      type: "dragon",
      description: "Vương quốc của long tộc, nơi những con rồng cổ đại ngự trị trên núi lửa và biển lửa. Sức mạnh nguyên thủy nhất vũ trụ.",
      template: '{"species":"dragon","element":"fire","culture":"draconic"}',
      status: "active",
      powerLevel: 1450,
      totalCreatures: 2500,
      totalKingdoms: 4,
      totalSpecies: 12,
      worldDay: 1,
      dangerLevel: 9,
      spiritualEnergy: 220,
      colorHex: "#fb923c",
    },
    {
      name: "linh-gioi",
      displayName: "Linh Giới",
      type: "spirit",
      description: "Thế giới của linh thú và hồn phách, ranh giới giữa vật chất và linh hồn. Các linh hồn cổ đại lang thang trong màn sương huyền bí.",
      template: '{"species":"spirit","element":"ghost","culture":"mystical"}',
      status: "active",
      powerLevel: 680,
      totalCreatures: 3800,
      totalKingdoms: 3,
      totalSpecies: 20,
      worldDay: 1,
      dangerLevel: 6,
      spiritualEnergy: 620,
      colorHex: "#34d399",
    },
    {
      name: "minh-gioi",
      displayName: "Minh Giới",
      type: "underworld",
      description: "Địa phủ tối tăm nơi linh hồn của kẻ chết quy tụ. Diêm Vương cai quản trật tự giữa sống và chết của toàn bộ vũ trụ.",
      template: '{"species":"undead","element":"death","culture":"hierarchical"}',
      status: "active",
      powerLevel: 880,
      totalCreatures: 99999,
      totalKingdoms: 2,
      totalSpecies: 18,
      worldDay: 1,
      dangerLevel: 7,
      spiritualEnergy: 55,
      colorHex: "#6366f1",
    },
    {
      name: "thien-gioi",
      displayName: "Thiên Giới",
      type: "heaven",
      description: "Tầng thiên tối cao, nơi quyền năng vũ trụ tập trung. Thiên Đế cai trị Cửu Giới từ đây. Ít ai đủ sức đặt chân lên mảnh đất thần thánh này.",
      template: '{"species":"celestial","element":"cosmos","culture":"celestial_court"}',
      status: "active",
      powerLevel: 3500,
      totalCreatures: 100,
      totalKingdoms: 1,
      totalSpecies: 5,
      worldDay: 1,
      dangerLevel: 10,
      spiritualEnergy: 999,
      colorHex: "#e0f2fe",
    },
  ]);

  logger.info("Cửu Giới seeded — 9 worlds initialized.");
}

// ── Seed initial Thú Giới world data ──────────────────────────────────────
export async function autoSeedIfEmpty(): Promise<void> {
  const [row] = await db.select({ n: count() }).from(creaturesTable);
  if (row.n > 0) {
    logger.info("Database already has data — skipping auto-seed.");
    return;
  }

  logger.info("Database is empty — seeding initial world data...");

  // ── World State ───────────────────────────────────────────────
  await db.insert(worldStateTable).values({ worldDay: 42, worldId: 1 });

  // ── Zones ─────────────────────────────────────────────────────
  await db.insert(zonesTable).values([
    { name: "Rừng Cổ Thụ",          temperature: 24,  capacity: 3000, resources: "food,water,spirit",  description: "Khu rừng nguyên sinh bí ẩn, nơi cây đại thụ ngàn năm tỏa bóng che phủ mọi sinh linh. Linh khí tích tụ dày đặc." },
    { name: "Vực Nham Thạch",        temperature: 78,  capacity: 1500, resources: "mineral,fire",       description: "Vùng đất núi lửa sôi sục, lửa dung nham phun trào không ngừng. Chỉ sinh vật Hỏa Hệ mới trụ được." },
    { name: "Băng Nguyên Vĩnh Hằng", temperature: -30, capacity: 1200, resources: "water,mineral",      description: "Đồng bằng phủ băng tuyết trắng mênh mông. Gió bắc thổi liên tục, lạnh giá chết người nhưng tài nguyên nước dồi dào." },
    { name: "Thảo Nguyên Sấm Sét",   temperature: 30,  capacity: 4000, resources: "food,mineral",       description: "Thảo nguyên rộng lớn nơi sấm sét không ngừng giáng xuống. Quần thể lớn nhất thế giới tập trung tại đây." },
    { name: "Hắc Ám Vực",            temperature: 15,  capacity: 800,  resources: "spirit,dark",        description: "Hang động tối tăm sâu thẳm dưới lòng đất. Ánh sáng không thể xuyên qua, chỉ linh khí tối tăm tồn tại." },
    { name: "Thiên Không Linh Sơn",  temperature: 5,   capacity: 1000, resources: "spirit,wind",        description: "Đỉnh núi cao chót vót giữa mây mù, nơi sinh vật thần thánh ngự trị. Linh khí thuần khiết nhất thế giới." },
  ]);

  // ── Territories ───────────────────────────────────────────────
  await db.insert(territoriesTable).values([
    { worldId: 1, zoneName: "Rừng Cổ Thụ",          food: 850, water: 900, mineral: 300, spirit: 180, foodMax: 1000, waterMax: 1000, mineralMax: 500, spiritMax: 200, climate: "forest",    dominantSpecies: "Hổ Lục Lâm",   controllingKingdom: "Vương Quốc Lâm Thú", contested: false },
    { worldId: 1, zoneName: "Vực Nham Thạch",        food: 200, water: 100, mineral: 480, spirit: 60,  foodMax: 500,  waterMax: 300,  mineralMax: 500, spiritMax: 150, climate: "volcanic",  dominantSpecies: "Long Hỏa",      controllingKingdom: "Đế Chế Hỏa Long",   contested: false },
    { worldId: 1, zoneName: "Băng Nguyên Vĩnh Hằng", food: 350, water: 950, mineral: 400, spirit: 40,  foodMax: 600,  waterMax: 1000, mineralMax: 500, spiritMax: 100, climate: "frozen",    dominantSpecies: "Gấu Băng",      controllingKingdom: "Liên Minh Băng Giá", contested: false },
    { worldId: 1, zoneName: "Thảo Nguyên Sấm Sét",   food: 920, water: 750, mineral: 450, spirit: 90,  foodMax: 1000, waterMax: 1000, mineralMax: 500, spiritMax: 200, climate: "storm",     dominantSpecies: "Sư Tử Lôi",    controllingKingdom: "Vương Quốc Lâm Thú", contested: false },
    { worldId: 1, zoneName: "Hắc Ám Vực",            food: 150, water: 200, mineral: 250, spirit: 190, foodMax: 400,  waterMax: 400,  mineralMax: 500, spiritMax: 200, climate: "dark",      dominantSpecies: "Ảo Linh Nhện", controllingKingdom: null,                  contested: false },
    { worldId: 1, zoneName: "Thiên Không Linh Sơn",  food: 300, water: 400, mineral: 200, spirit: 195, foodMax: 600,  waterMax: 600,  mineralMax: 300, spiritMax: 200, climate: "temperate", dominantSpecies: "Thần Điêu",    controllingKingdom: null,                  contested: false },
  ]);

  // ── Creatures ─────────────────────────────────────────────────
  await db.insert(creaturesTable).values([
    { worldId: 1, name: "Hổ Lục Lâm",       rank: "Vương Thú", rankLevel: 3, element: "Mộc",      habitat: "Rừng Cổ Thụ",          population: 320, status: "alive", description: "Loài hổ khổng lồ với bộ lông xanh lá ngụy trang hoàn hảo giữa rừng già.", dietType: "carnivore", strength: 85, agility: 90, intelligence: 65, vitality: 80,  sizeClass: "large",    bloodline: "rare",      huntSuccesses: 156, maxPopulation: 960,  mutationChance: 0.02 },
    { worldId: 1, name: "Long Hỏa",          rank: "Hoàng Thú", rankLevel: 4, element: "Hỏa",      habitat: "Vực Nham Thạch",        population: 45,  status: "alive", description: "Rồng lửa cổ đại sống trong miệng núi lửa. Vảy đỏ rực như than hồng.", dietType: "carnivore", strength: 95, agility: 70, intelligence: 85, vitality: 95,  sizeClass: "colossal", bloodline: "legendary", huntSuccesses: 312, maxPopulation: 135,  mutationChance: 0.02 },
    { worldId: 1, name: "Gấu Băng",          rank: "Linh Thú",  rankLevel: 2, element: "Băng",     habitat: "Băng Nguyên Vĩnh Hằng", population: 580, status: "alive", description: "Gấu khổng lồ với lớp lông dày trắng tinh, chịu được nhiệt độ -60 độ.", dietType: "omnivore",  strength: 90, agility: 45, intelligence: 55, vitality: 95,  sizeClass: "large",    bloodline: "common",    huntSuccesses: 89,  maxPopulation: 1740, mutationChance: 0.02 },
    { worldId: 1, name: "Sư Tử Lôi",         rank: "Vương Thú", rankLevel: 3, element: "Lôi",      habitat: "Thảo Nguyên Sấm Sét",   population: 760, status: "alive", description: "Sư tử mang trong mình sức mạnh sấm sét. Bờm điện phóng ra tia sét.", dietType: "carnivore", strength: 88, agility: 82, intelligence: 70, vitality: 85,  sizeClass: "large",    bloodline: "rare",      huntSuccesses: 234, maxPopulation: 2280, mutationChance: 0.02 },
    { worldId: 1, name: "Ảo Linh Nhện",      rank: "Đế Thú",    rankLevel: 5, element: "Ám",       habitat: "Hắc Ám Vực",            population: 120, status: "alive", description: "Nhện tám mắt khổng lồ sống trong bóng tối tuyệt đối.", dietType: "carnivore", strength: 75, agility: 95, intelligence: 92, vitality: 70,  sizeClass: "medium",   bloodline: "epic",      huntSuccesses: 445, maxPopulation: 360,  mutationChance: 0.02 },
    { worldId: 1, name: "Thần Điêu",         rank: "Thánh Thú", rankLevel: 6, element: "Quang",    habitat: "Thiên Không Linh Sơn",  population: 28,  status: "alive", description: "Đại bàng thần thánh với sải cánh rộng 30 mét, lông vũ tỏa sáng rực rỡ.", dietType: "carnivore", strength: 80, agility: 98, intelligence: 95, vitality: 75,  sizeClass: "large",    bloodline: "mythic",    huntSuccesses: 567, maxPopulation: 84,   mutationChance: 0.02 },
    { worldId: 1, name: "Kỳ Lân Lâm",        rank: "Linh Thú",  rankLevel: 2, element: "Mộc",      habitat: "Rừng Cổ Thụ",          population: 210, status: "alive", description: "Kỳ lân rừng với sừng xanh ngọc bích, có khả năng chữa lành vết thương.", dietType: "herbivore", strength: 65, agility: 78, intelligence: 80, vitality: 88,  sizeClass: "medium",   bloodline: "rare",      huntSuccesses: 12,  maxPopulation: 630,  mutationChance: 0.02 },
    { worldId: 1, name: "Cá Mập Băng",       rank: "Dã Thú",    rankLevel: 1, element: "Băng",     habitat: "Băng Nguyên Vĩnh Hằng", population: 890, status: "alive", description: "Cá mập khổng lồ bơi trong băng như trong nước. Răng nanh có thể cắt đứt thép.", dietType: "carnivore", strength: 80, agility: 88, intelligence: 30, vitality: 85,  sizeClass: "large",    bloodline: "common",    huntSuccesses: 67,  maxPopulation: 2670, mutationChance: 0.02 },
    { worldId: 1, name: "Phượng Hoàng Lửa",  rank: "Vương Thú", rankLevel: 3, element: "Hỏa",      habitat: "Vực Nham Thạch",        population: 65,  status: "alive", description: "Phượng hoàng bất tử tái sinh từ tro tàn. Mỗi lần chết đi sẽ mạnh hơn trước.", dietType: "omnivore",  strength: 82, agility: 92, intelligence: 88, vitality: 90,  sizeClass: "large",    bloodline: "legendary", huntSuccesses: 198, maxPopulation: 195,  mutationChance: 0.02 },
    { worldId: 1, name: "Rồng Băng Lửa",     rank: "Thần Thú",  rankLevel: 7, element: "Băng Hỏa", habitat: "Thiên Không Linh Sơn",  population: 12,  status: "alive", description: "Sinh vật lai hiếm gặp nhất thế giới. Nửa thân phủ băng, nửa thân bọc lửa.", dietType: "carnivore", strength: 98, agility: 75, intelligence: 90, vitality: 99,  sizeClass: "colossal", bloodline: "mythic",    huntSuccesses: 89,  maxPopulation: 36,   mutationChance: 0.02, isHybrid: true, parentA: "Gấu Băng", parentB: "Long Hỏa" },
  ]);

  // ── Kingdoms ──────────────────────────────────────────────────
  await db.insert(beastKingdomsTable).values([
    { worldId: 1, name: "Vương Quốc Lâm Thú", dominantSpecies: "Hổ Lục Lâm", foundedDay: 5,  capital: "Rừng Cổ Thụ",          militaryPower: 780, economy: 650, influence: 85, population: 1080, territoryCount: 2, status: "active" },
    { worldId: 1, name: "Đế Chế Hỏa Long",    dominantSpecies: "Long Hỏa",   foundedDay: 12, capital: "Vực Nham Thạch",        militaryPower: 950, economy: 420, influence: 70, population: 110,  territoryCount: 1, status: "active" },
    { worldId: 1, name: "Liên Minh Băng Giá", dominantSpecies: "Gấu Băng",   foundedDay: 8,  capital: "Băng Nguyên Vĩnh Hằng", militaryPower: 620, economy: 540, influence: 60, population: 1470, territoryCount: 1, status: "active" },
  ]);

  // ── Packs ─────────────────────────────────────────────────────
  await db.insert(packsTable).values([
    { worldId: 1, speciesName: "Hổ Lục Lâm",    territory: "Rừng Cổ Thụ",          population: 180, leaderName: "Lâm Vương Thái Hổ",  leaderLevel: 9,  leaderIntelligence: 72, leaderCharisma: 88, kingdomName: "Vương Quốc Lâm Thú", status: "active" },
    { worldId: 1, speciesName: "Hổ Lục Lâm",    territory: "Thảo Nguyên Sấm Sét",   population: 140, leaderName: "Hắc Nha Tướng",      leaderLevel: 7,  leaderIntelligence: 65, leaderCharisma: 75, kingdomName: "Vương Quốc Lâm Thú", status: "active" },
    { worldId: 1, speciesName: "Sư Tử Lôi",     territory: "Thảo Nguyên Sấm Sét",   population: 620, leaderName: "Lôi Đế Sư Hùng",    leaderLevel: 12, leaderIntelligence: 78, leaderCharisma: 95, kingdomName: "Vương Quốc Lâm Thú", status: "active" },
    { worldId: 1, speciesName: "Long Hỏa",       territory: "Vực Nham Thạch",        population: 45,  leaderName: "Hỏa Đế Cổ Long",    leaderLevel: 20, leaderIntelligence: 92, leaderCharisma: 90, kingdomName: "Đế Chế Hỏa Long",    status: "active" },
    { worldId: 1, speciesName: "Gấu Băng",       territory: "Băng Nguyên Vĩnh Hằng", population: 430, leaderName: "Băng Quân Đại Hùng", leaderLevel: 10, leaderIntelligence: 58, leaderCharisma: 80, kingdomName: "Liên Minh Băng Giá", status: "active" },
    { worldId: 1, speciesName: "Cá Mập Băng",    territory: "Băng Nguyên Vĩnh Hằng", population: 630, leaderName: "Hàn Băng Thủy Vương",leaderLevel: 6,  leaderIntelligence: 35, leaderCharisma: 55, kingdomName: "Liên Minh Băng Giá", status: "active" },
    { worldId: 1, speciesName: "Ảo Linh Nhện",   territory: "Hắc Ám Vực",            population: 120, leaderName: "Bóng Tối Mẫu Nhện", leaderLevel: 15, leaderIntelligence: 98, leaderCharisma: 40, kingdomName: null,                  status: "active" },
  ]);

  // ── Kingdom Relations ─────────────────────────────────────────
  await db.insert(kingdomRelationsTable).values([
    { worldId: 1, kingdomNameA: "Vương Quốc Lâm Thú", kingdomNameB: "Liên Minh Băng Giá", relation: "alliance", sinceDay: 15 },
    { worldId: 1, kingdomNameA: "Vương Quốc Lâm Thú", kingdomNameB: "Đế Chế Hỏa Long",    relation: "hostile",  sinceDay: 20 },
    { worldId: 1, kingdomNameA: "Đế Chế Hỏa Long",    kingdomNameB: "Liên Minh Băng Giá", relation: "hostile",  sinceDay: 22 },
  ]);

  // ── Evolution Paths ───────────────────────────────────────────
  await db.insert(evolutionPathsTable).values([
    { worldId: 1, fromSpecies: "Gấu Băng",         toSpecies: "Rồng Băng Lửa",    toRank: "Thần Thú",  toRankLevel: 7, toElement: "Băng Hỏa", toDescription: "Đột phá giới hạn.", minPopulation: 500, minHuntSuccesses: 80,  minAgeTicks: 20 },
    { worldId: 1, fromSpecies: "Hổ Lục Lâm",       toSpecies: "Kỳ Lân Lâm",       toRank: "Linh Thú", toRankLevel: 2, toElement: "Mộc",      toDescription: "Hổ rừng thức tỉnh linh tính.", minPopulation: 200, minHuntSuccesses: 100, minAgeTicks: 15 },
    { worldId: 1, fromSpecies: "Phượng Hoàng Lửa", toSpecies: "Long Hỏa",          toRank: "Hoàng Thú", toRankLevel: 4, toElement: "Hỏa",      toDescription: "Phượng Hoàng sau ngàn lần tái sinh.", minPopulation: 50,  minHuntSuccesses: 150, minAgeTicks: 30 },
    { worldId: 1, fromSpecies: "Cá Mập Băng",      toSpecies: "Gấu Băng",          toRank: "Linh Thú", toRankLevel: 2, toElement: "Băng",     toDescription: "Cá mập băng thích nghi đất liền.", minPopulation: 700, minHuntSuccesses: 50,  minAgeTicks: 10 },
  ]);

  // ── History ───────────────────────────────────────────────────
  await db.insert(historyTable).values([
    { worldId: 1, worldDay: 1,  eventType: "new_species", description: "Hổ Lục Lâm xuất hiện lần đầu tại Rừng Cổ Thụ." },
    { worldId: 1, worldDay: 3,  eventType: "new_species", description: "Long Hỏa thức tỉnh từ giấc ngủ ngàn năm trong Vực Nham Thạch." },
    { worldId: 1, worldDay: 5,  eventType: "diplomacy",   description: "Vương Quốc Lâm Thú chính thức thành lập, Lâm Vương Thái Hổ trở thành vị vua đầu tiên." },
    { worldId: 1, worldDay: 8,  eventType: "diplomacy",   description: "Liên Minh Băng Giá thành lập giữa Gấu Băng và Cá Mập Băng." },
    { worldId: 1, worldDay: 10, eventType: "battle",      description: "Cuộc chiến đầu tiên giữa Hổ Lục Lâm và Sư Tử Lôi tại biên giới Thảo Nguyên." },
    { worldId: 1, worldDay: 12, eventType: "diplomacy",   description: "Đế Chế Hỏa Long tuyên bố thành lập, Hỏa Đế Cổ Long xưng đế." },
    { worldId: 1, worldDay: 15, eventType: "diplomacy",   description: "Vương Quốc Lâm Thú và Liên Minh Băng Giá ký kết hiệp ước liên minh." },
    { worldId: 1, worldDay: 18, eventType: "evolution",   description: "Kỳ Lân Lâm đầu tiên xuất hiện tại Rừng Cổ Thụ." },
    { worldId: 1, worldDay: 20, eventType: "battle",      description: "Chiến tranh Lửa-Lâm bùng nổ! Long Hỏa tấn công biên giới Rừng Cổ Thụ." },
    { worldId: 1, worldDay: 30, eventType: "birth",       description: "Rồng Băng Lửa đầu tiên trong lịch sử xuất hiện!" },
    { worldId: 1, worldDay: 42, eventType: "info",        description: "Thần Điêu tại Thiên Không Linh Sơn được phát hiện, đánh dấu ngày 42." },
  ]);

  logger.info("Auto-seed hoàn tất — Thú Giới đã sẵn sàng.");
}
