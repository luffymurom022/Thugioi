import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

console.log("🌍 Seeding THÚ GIỚI AI world data...");

// ── World State ────────────────────────────────────────────────
await client.query(`DELETE FROM world_state`);
await client.query(`INSERT INTO world_state (world_day) VALUES (42)`);
console.log("✓ World state");

// ── Zones ─────────────────────────────────────────────────────
await client.query(`DELETE FROM zones`);
const zonesData = [
  { name: "Rừng Cổ Thụ", temperature: 24, capacity: 3000, resources: "food,water,spirit", description: "Khu rừng nguyên sinh bí ẩn, nơi cây đại thụ ngàn năm tỏa bóng che phủ mọi sinh linh. Linh khí tích tụ dày đặc." },
  { name: "Vực Nham Thạch", temperature: 78, capacity: 1500, resources: "mineral,fire", description: "Vùng đất núi lửa sôi sục, lửa dung nham phun trào không ngừng. Chỉ sinh vật Hỏa Hệ mới trụ được." },
  { name: "Băng Nguyên Vĩnh Hằng", temperature: -30, capacity: 1200, resources: "water,mineral", description: "Đồng bằng phủ băng tuyết trắng mênh mông. Gió bắc thổi liên tục, lạnh giá chết người nhưng tài nguyên nước dồi dào." },
  { name: "Thảo Nguyên Sấm Sét", temperature: 30, capacity: 4000, resources: "food,mineral", description: "Thảo nguyên rộng lớn nơi sấm sét không ngừng giáng xuống. Quần thể lớn nhất thế giới tập trung tại đây." },
  { name: "Hắc Ám Vực", temperature: 15, capacity: 800, resources: "spirit,dark", description: "Hang động tối tăm sâu thẳm dưới lòng đất. Ánh sáng không thể xuyên qua, chỉ linh khí tối tăm tồn tại." },
  { name: "Thiên Không Linh Sơn", temperature: 5, capacity: 1000, resources: "spirit,wind", description: "Đỉnh núi cao chót vót giữa mây mù, nơi sinh vật thần thánh ngự trị. Linh khí thuần khiết nhất thế giới." },
];
for (const z of zonesData) {
  await client.query(
    `INSERT INTO zones (name, temperature, capacity, resources, description) VALUES ($1,$2,$3,$4,$5)`,
    [z.name, z.temperature, z.capacity, z.resources, z.description]
  );
}
console.log("✓ Zones (6)");

// ── Territories ────────────────────────────────────────────────
await client.query(`DELETE FROM territories`);
const territories = [
  { zoneName: "Rừng Cổ Thụ",       food: 850, water: 900, mineral: 300, spirit: 180, foodMax: 1000, waterMax: 1000, mineralMax: 500, spiritMax: 200, climate: "forest",    dominantSpecies: "Hổ Lục Lâm",   controllingKingdom: "Vương Quốc Lâm Thú" },
  { zoneName: "Vực Nham Thạch",     food: 200, water: 100, mineral: 480, spirit: 60,  foodMax: 500,  waterMax: 300,  mineralMax: 500, spiritMax: 150, climate: "volcanic",  dominantSpecies: "Long Hỏa",      controllingKingdom: "Đế Chế Hỏa Long" },
  { zoneName: "Băng Nguyên Vĩnh Hằng", food: 350, water: 950, mineral: 400, spirit: 40, foodMax: 600, waterMax: 1000, mineralMax: 500, spiritMax: 100, climate: "frozen",   dominantSpecies: "Gấu Băng",      controllingKingdom: "Liên Minh Băng Giá" },
  { zoneName: "Thảo Nguyên Sấm Sét", food: 920, water: 750, mineral: 450, spirit: 90, foodMax: 1000, waterMax: 1000, mineralMax: 500, spiritMax: 200, climate: "storm",    dominantSpecies: "Sư Tử Lôi",    controllingKingdom: "Vương Quốc Lâm Thú" },
  { zoneName: "Hắc Ám Vực",         food: 150, water: 200, mineral: 250, spirit: 190, foodMax: 400,  waterMax: 400,  mineralMax: 500, spiritMax: 200, climate: "dark",     dominantSpecies: "Ảo Linh Nhện", controllingKingdom: null },
  { zoneName: "Thiên Không Linh Sơn", food: 300, water: 400, mineral: 200, spirit: 195, foodMax: 600, waterMax: 600,  mineralMax: 300, spiritMax: 200, climate: "temperate", dominantSpecies: "Thần Điêu",    controllingKingdom: null },
];
for (const t of territories) {
  await client.query(
    `INSERT INTO territories (zone_name, food, water, mineral, spirit, food_max, water_max, mineral_max, spirit_max, climate, dominant_species, controlling_kingdom, contested)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [t.zoneName, t.food, t.water, t.mineral, t.spirit, t.foodMax, t.waterMax, t.mineralMax, t.spiritMax, t.climate, t.dominantSpecies, t.controllingKingdom, false]
  );
}
console.log("✓ Territories (6)");

// ── Creatures ──────────────────────────────────────────────────
await client.query(`DELETE FROM creatures`);
const creatures = [
  { name: "Hổ Lục Lâm", rank: "Vương", rankLevel: 3, element: "Mộc", habitat: "Rừng Cổ Thụ", population: 320, status: "alive", description: "Loài hổ khổng lồ với bộ lông xanh lá ngụy trang hoàn hảo giữa rừng già. Sử dụng linh khí rừng để tăng tốc độ.", dietType: "carnivore", strength: 85, agility: 90, intelligence: 65, vitality: 80, sizeClass: "large", bloodline: "rare", huntSuccesses: 156 },
  { name: "Long Hỏa", rank: "Hoàng", rankLevel: 2, element: "Hỏa", habitat: "Vực Nham Thạch", population: 45, status: "alive", description: "Rồng lửa cổ đại sống trong miệng núi lửa. Vảy đỏ rực như than hồng, có thể phun lửa đốt cháy mọi thứ.", dietType: "carnivore", strength: 95, agility: 70, intelligence: 85, vitality: 95, sizeClass: "colossal", bloodline: "legendary", huntSuccesses: 312 },
  { name: "Gấu Băng", rank: "Hầu", rankLevel: 1, element: "Băng", habitat: "Băng Nguyên Vĩnh Hằng", population: 580, status: "alive", description: "Gấu khổng lồ với lớp lông dày trắng tinh, chịu được nhiệt độ -60 độ. Hơi thở có thể đóng băng tức thì.", dietType: "omnivore", strength: 90, agility: 45, intelligence: 55, vitality: 95, sizeClass: "large", bloodline: "common", huntSuccesses: 89 },
  { name: "Sư Tử Lôi", rank: "Vương", rankLevel: 2, element: "Lôi", habitat: "Thảo Nguyên Sấm Sét", population: 760, status: "alive", description: "Sư tử mang trong mình sức mạnh sấm sét. Bờm điện phóng ra tia sét mỗi khi gầm rống, thanh thế kinh thiên.", dietType: "carnivore", strength: 88, agility: 82, intelligence: 70, vitality: 85, sizeClass: "large", bloodline: "rare", huntSuccesses: 234 },
  { name: "Ảo Linh Nhện", rank: "Đế", rankLevel: 1, element: "Ám", habitat: "Hắc Ám Vực", population: 120, status: "alive", description: "Nhện tám mắt khổng lồ sống trong bóng tối tuyệt đối. Tơ của nó có thể bắt giữ linh hồn, cực kỳ nguy hiểm.", dietType: "carnivore", strength: 75, agility: 95, intelligence: 92, vitality: 70, sizeClass: "medium", bloodline: "epic", huntSuccesses: 445 },
  { name: "Thần Điêu", rank: "Thánh", rankLevel: 1, element: "Quang", habitat: "Thiên Không Linh Sơn", population: 28, status: "alive", description: "Đại bàng thần thánh với sải cánh rộng 30 mét, lông vũ tỏa sáng rực rỡ. Được coi là sứ giả của bầu trời.", dietType: "carnivore", strength: 80, agility: 98, intelligence: 95, vitality: 75, sizeClass: "large", bloodline: "mythic", huntSuccesses: 567 },
  { name: "Kỳ Lân Lâm", rank: "Hầu", rankLevel: 2, element: "Mộc", habitat: "Rừng Cổ Thụ", population: 210, status: "alive", description: "Kỳ lân rừng với sừng xanh ngọc bích, có khả năng chữa lành vết thương. Hiền hòa nhưng mạnh mẽ khi bảo vệ lãnh thổ.", dietType: "herbivore", strength: 65, agility: 78, intelligence: 80, vitality: 88, sizeClass: "medium", bloodline: "rare", huntSuccesses: 12 },
  { name: "Cá Mập Băng", rank: "Tử", rankLevel: 1, element: "Băng", habitat: "Băng Nguyên Vĩnh Hằng", population: 890, status: "alive", description: "Cá mập khổng lồ bơi trong băng như trong nước. Răng nanh có thể cắt đứt thép, nhiệt độ cơ thể âm 20 độ.", dietType: "carnivore", strength: 80, agility: 88, intelligence: 30, vitality: 85, sizeClass: "large", bloodline: "common", huntSuccesses: 67 },
  { name: "Phượng Hoàng Lửa", rank: "Vương", rankLevel: 1, element: "Hỏa", habitat: "Vực Nham Thạch", population: 65, status: "alive", description: "Phượng hoàng bất tử tái sinh từ tro tàn. Mỗi lần chết đi sẽ mạnh hơn trước. Tuổi thọ không giới hạn.", dietType: "omnivore", strength: 82, agility: 92, intelligence: 88, vitality: 90, sizeClass: "large", bloodline: "legendary", huntSuccesses: 198 },
  { name: "Rồng Băng Lửa", rank: "Hoàng", rankLevel: 1, element: "Băng Hỏa", habitat: "Thiên Không Linh Sơn", population: 12, status: "alive", description: "Sinh vật lai hiếm gặp nhất thế giới. Nửa thân phủ băng, nửa thân bọc lửa. Sức mạnh vượt trội mọi loài.", isHybrid: true, parentA: "Gấu Băng", parentB: "Long Hỏa", dietType: "carnivore", strength: 98, agility: 75, intelligence: 90, vitality: 99, sizeClass: "colossal", bloodline: "mythic", huntSuccesses: 89 },
];
for (const c of creatures) {
  await client.query(
    `INSERT INTO creatures (name, rank, rank_level, element, habitat, population, status, description, diet_type, strength, agility, intelligence, vitality, size_class, bloodline, hunt_successes, is_hybrid, parent_a, parent_b, max_population, mutation_chance)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [c.name, c.rank, c.rankLevel ?? 1, c.element, c.habitat, c.population, c.status, c.description, c.dietType, c.strength, c.agility, c.intelligence, c.vitality, c.sizeClass, c.bloodline, c.huntSuccesses, c.isHybrid ?? false, c.parentA ?? null, c.parentB ?? null, Math.floor(c.population * 3), 0.02]
  );
}
console.log("✓ Creatures (10)");

// ── Kingdoms ───────────────────────────────────────────────────
await client.query(`DELETE FROM beast_kingdoms`);
const kingdoms = [
  { name: "Vương Quốc Lâm Thú", dominantSpecies: "Hổ Lục Lâm", foundedDay: 5, capital: "Rừng Cổ Thụ", militaryPower: 780, economy: 650, influence: 85, population: 1080, territoryCount: 2, status: "active" },
  { name: "Đế Chế Hỏa Long", dominantSpecies: "Long Hỏa", foundedDay: 12, capital: "Vực Nham Thạch", militaryPower: 950, economy: 420, influence: 70, population: 110, territoryCount: 1, status: "active" },
  { name: "Liên Minh Băng Giá", dominantSpecies: "Gấu Băng", foundedDay: 8, capital: "Băng Nguyên Vĩnh Hằng", militaryPower: 620, economy: 540, influence: 60, population: 1470, territoryCount: 1, status: "active" },
];
for (const k of kingdoms) {
  await client.query(
    `INSERT INTO beast_kingdoms (name, dominant_species, founded_day, capital, military_power, economy, influence, population, territory_count, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [k.name, k.dominantSpecies, k.foundedDay, k.capital, k.militaryPower, k.economy, k.influence, k.population, k.territoryCount, k.status]
  );
}
console.log("✓ Kingdoms (3)");

// ── Packs ──────────────────────────────────────────────────────
await client.query(`DELETE FROM packs`);
const packs = [
  { speciesName: "Hổ Lục Lâm", territory: "Rừng Cổ Thụ", population: 180, leaderName: "Lâm Vương Thái Hổ", leaderLevel: 9, leaderIntelligence: 72, leaderCharisma: 88, kingdomName: "Vương Quốc Lâm Thú" },
  { speciesName: "Hổ Lục Lâm", territory: "Thảo Nguyên Sấm Sét", population: 140, leaderName: "Hắc Nha Tướng", leaderLevel: 7, leaderIntelligence: 65, leaderCharisma: 75, kingdomName: "Vương Quốc Lâm Thú" },
  { speciesName: "Sư Tử Lôi", territory: "Thảo Nguyên Sấm Sét", population: 620, leaderName: "Lôi Đế Sư Hùng", leaderLevel: 12, leaderIntelligence: 78, leaderCharisma: 95, kingdomName: "Vương Quốc Lâm Thú" },
  { speciesName: "Long Hỏa", territory: "Vực Nham Thạch", population: 45, leaderName: "Hỏa Đế Cổ Long", leaderLevel: 20, leaderIntelligence: 92, leaderCharisma: 90, kingdomName: "Đế Chế Hỏa Long" },
  { speciesName: "Gấu Băng", territory: "Băng Nguyên Vĩnh Hằng", population: 430, leaderName: "Băng Quân Đại Hùng", leaderLevel: 10, leaderIntelligence: 58, leaderCharisma: 80, kingdomName: "Liên Minh Băng Giá" },
  { speciesName: "Cá Mập Băng", territory: "Băng Nguyên Vĩnh Hằng", population: 630, leaderName: "Hàn Băng Thủy Vương", leaderLevel: 6, leaderIntelligence: 35, leaderCharisma: 55, kingdomName: "Liên Minh Băng Giá" },
  { speciesName: "Ảo Linh Nhện", territory: "Hắc Ám Vực", population: 120, leaderName: "Bóng Tối Mẫu Nhện", leaderLevel: 15, leaderIntelligence: 98, leaderCharisma: 40, kingdomName: null },
];
for (const p of packs) {
  await client.query(
    `INSERT INTO packs (species_name, territory, population, leader_name, leader_level, leader_intelligence, leader_charisma, kingdom_name, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [p.speciesName, p.territory, p.population, p.leaderName, p.leaderLevel, p.leaderIntelligence, p.leaderCharisma, p.kingdomName, "active"]
  );
}
console.log("✓ Packs (7)");

// ── Kingdom Relations ──────────────────────────────────────────
await client.query(`DELETE FROM kingdom_relations`);
const relations = [
  { kingdomNameA: "Vương Quốc Lâm Thú", kingdomNameB: "Liên Minh Băng Giá", relation: "alliance", sinceDay: 15 },
  { kingdomNameA: "Vương Quốc Lâm Thú", kingdomNameB: "Đế Chế Hỏa Long", relation: "hostile",  sinceDay: 20 },
  { kingdomNameA: "Đế Chế Hỏa Long",    kingdomNameB: "Liên Minh Băng Giá", relation: "hostile",  sinceDay: 22 },
];
for (const r of relations) {
  await client.query(
    `INSERT INTO kingdom_relations (kingdom_name_a, kingdom_name_b, relation, since_day) VALUES ($1,$2,$3,$4)`,
    [r.kingdomNameA, r.kingdomNameB, r.relation, r.sinceDay]
  );
}
console.log("✓ Kingdom Relations (3)");

// ── Evolution Paths ────────────────────────────────────────────
await client.query(`DELETE FROM evolution_paths`);
const evoPaths = [
  { fromSpecies: "Gấu Băng",    toSpecies: "Rồng Băng Lửa", toRank: "Hoàng", toRankLevel: 1, toElement: "Băng Hỏa", toDescription: "Đột phá giới hạn, hợp nhất hai nguyên tố đối lập trong một cơ thể.", minPopulation: 500, minHuntSuccesses: 80, minAgeTicks: 20 },
  { fromSpecies: "Hổ Lục Lâm",  toSpecies: "Kỳ Lân Lâm",   toRank: "Hầu",   toRankLevel: 2, toElement: "Mộc",      toDescription: "Hổ rừng thức tỉnh linh tính, mọc sừng kỳ lân, chuyển hóa thành linh thú.", minPopulation: 200, minHuntSuccesses: 100, minAgeTicks: 15 },
  { fromSpecies: "Phượng Hoàng Lửa", toSpecies: "Long Hỏa", toRank: "Hoàng", toRankLevel: 2, toElement: "Hỏa",   toDescription: "Phượng Hoàng sau ngàn lần tái sinh đột phá thành Hỏa Long thực sự.", minPopulation: 50, minHuntSuccesses: 150, minAgeTicks: 30 },
  { fromSpecies: "Cá Mập Băng", toSpecies: "Gấu Băng",      toRank: "Hầu",   toRankLevel: 1, toElement: "Băng",  toDescription: "Cá mập băng leo lên bờ, thích nghi với đất liền và phát triển thành Gấu Băng.", minPopulation: 700, minHuntSuccesses: 50, minAgeTicks: 10 },
];
for (const e of evoPaths) {
  await client.query(
    `INSERT INTO evolution_paths (from_species, to_species, to_rank, to_rank_level, to_element, to_description, min_population, min_hunt_successes, min_age_ticks) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [e.fromSpecies, e.toSpecies, e.toRank, e.toRankLevel, e.toElement, e.toDescription, e.minPopulation, e.minHuntSuccesses, e.minAgeTicks]
  );
}
console.log("✓ Evolution Paths (4)");

// ── History ────────────────────────────────────────────────────
await client.query(`DELETE FROM world_history`);
const history = [
  { worldDay: 1,  eventType: "new_species", description: "Hổ Lục Lâm xuất hiện lần đầu tại Rừng Cổ Thụ. Loài sinh vật hùng mạnh này nhanh chóng trở thành loài thống trị khu vực." },
  { worldDay: 3,  eventType: "new_species", description: "Long Hỏa thức tỉnh từ giấc ngủ ngàn năm trong Vực Nham Thạch. Núi lửa phun trào mừng sự kiện này." },
  { worldDay: 5,  eventType: "diplomacy",   description: "Vương Quốc Lâm Thú chính thức thành lập, Lâm Vương Thái Hổ trở thành vị vua đầu tiên cai trị Rừng Cổ Thụ." },
  { worldDay: 8,  eventType: "diplomacy",   description: "Liên Minh Băng Giá thành lập giữa Gấu Băng và Cá Mập Băng. Băng Nguyên Vĩnh Hằng trở thành lãnh địa chung." },
  { worldDay: 10, eventType: "battle",      description: "Cuộc chiến đầu tiên giữa Hổ Lục Lâm và Sư Tử Lôi tại biên giới Thảo Nguyên. Kết thúc với thỏa thuận chia sẻ lãnh thổ." },
  { worldDay: 12, eventType: "diplomacy",   description: "Đế Chế Hỏa Long tuyên bố thành lập, Hỏa Đế Cổ Long xưng đế, thống trị Vực Nham Thạch bằng sức mạnh tuyệt đối." },
  { worldDay: 15, eventType: "diplomacy",   description: "Vương Quốc Lâm Thú và Liên Minh Băng Giá ký kết hiệp ước liên minh. Thế giới chia thành hai phe đối lập rõ rệt." },
  { worldDay: 18, eventType: "evolution",   description: "Kỳ Lân Lâm đầu tiên xuất hiện tại Rừng Cổ Thụ sau khi một con Hổ Lục Lâm đột phá giới hạn. Sự kiện chưa từng có." },
  { worldDay: 20, eventType: "battle",      description: "Chiến tranh Lửa-Lâm bùng nổ! Long Hỏa tấn công biên giới Rừng Cổ Thụ. Hổ Lục Lâm chống cự quyết liệt, thiệt hại nặng cả hai bên." },
  { worldDay: 22, eventType: "battle",      description: "Long Hỏa và Gấu Băng đụng độ tại vùng trung gian. Băng và Lửa đối chọi tạo ra sương mù dày đặc bao phủ cả khu vực." },
  { worldDay: 25, eventType: "disaster",    description: "Siêu bão sấm sét quét qua Thảo Nguyên, làm dân số Sư Tử Lôi giảm mạnh. Tuy nhiên, những cá thể sống sót trở nên mạnh hơn nhiều." },
  { worldDay: 30, eventType: "birth",       description: "Rồng Băng Lửa đầu tiên trong lịch sử xuất hiện! Sinh vật lai huyền thoại này được sinh ra từ sự hòa quyện của băng và lửa." },
  { worldDay: 35, eventType: "evolution",   description: "Phượng Hoàng Lửa tiến hóa thêm một bậc sau 1000 lần tái sinh. Sức mạnh của nó hiện tại gần ngang với Long Hỏa." },
  { worldDay: 40, eventType: "diplomacy",   description: "Bí ẩn tại Hắc Ám Vực: Ảo Linh Nhện từ chối mọi đề nghị liên minh. Bóng Tối Mẫu Nhện tuyên bố đứng ngoài mọi cuộc chiến." },
  { worldDay: 42, eventType: "info",        description: "Thần Điêu tại Thiên Không Linh Sơn được phát hiện, đánh dấu ngày 42. Thế giới đứng trước những thay đổi lớn lao." },
];
for (const h of history) {
  await client.query(
    `INSERT INTO world_history (world_day, event_type, description) VALUES ($1,$2,$3)`,
    [h.worldDay, h.eventType, h.description]
  );
}
console.log("✓ History (15 events)");

await client.end();
console.log("\n🎉 Seed hoàn tất! Thế giới THÚ GIỚI AI đã sẵn sàng.");
