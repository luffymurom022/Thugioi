// ============================================================
// THÚ GIỚI AI — Genetics Engine
// All DNA inheritance, bloodline, element fusion, name generation
// ============================================================

export const BLOODLINES = [
  "common", "rare", "epic", "legendary", "mythic", "ancient", "primordial",
] as const;
export type Bloodline = typeof BLOODLINES[number];

export const BLOODLINE_LABELS: Record<Bloodline, string> = {
  common: "Phổ Thông",
  rare: "Hiếm",
  epic: "Sử Thi",
  legendary: "Huyền Thoại",
  mythic: "Thần Thoại",
  ancient: "Thái Cổ",
  primordial: "Nguyên Thủy",
};

export const BLOODLINE_COLORS: Record<Bloodline, string> = {
  common:     "#9ca3af",
  rare:       "#3b82f6",
  epic:       "#8b5cf6",
  legendary:  "#f59e0b",
  mythic:     "#ec4899",
  ancient:    "#06b6d4",
  primordial: "#f97316",
};

export interface DNA {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  sizeClass: "tiny" | "small" | "medium" | "large" | "colossal";
  bloodline: Bloodline;
  mutationChance: number;
}

// ─── Element fusion table ──────────────────────────────────
const ELEMENT_FUSIONS: Record<string, string> = {
  "Hỏa+Lôi": "Lôi Diễm", "Lôi+Hỏa": "Lôi Diễm",
  "Hỏa+Băng": "Tiêu Diêu", "Băng+Hỏa": "Tiêu Diêu",
  "Hỏa+Phong": "Hỏa Phong", "Phong+Hỏa": "Hỏa Phong",
  "Hỏa+Ám": "Địa Ngục", "Ám+Hỏa": "Địa Ngục",
  "Hỏa+Quang": "Thần Hỏa", "Quang+Hỏa": "Thần Hỏa",
  "Hỏa+Thổ": "Nham Thạch", "Thổ+Hỏa": "Nham Thạch",
  "Hỏa+Kim": "Hồng Kim", "Kim+Hỏa": "Hồng Kim",
  "Hỏa+Thủy": "Nhiệt Khí", "Thủy+Hỏa": "Nhiệt Khí",
  "Lôi+Băng": "Hàn Lôi", "Băng+Lôi": "Hàn Lôi",
  "Lôi+Phong": "Phong Lôi", "Phong+Lôi": "Phong Lôi",
  "Lôi+Ám": "Ám Lôi", "Ám+Lôi": "Ám Lôi",
  "Lôi+Quang": "Thiên Lôi", "Quang+Lôi": "Thiên Lôi",
  "Lôi+Thổ": "Địa Chấn", "Thổ+Lôi": "Địa Chấn",
  "Lôi+Kim": "Thiết Lôi", "Kim+Lôi": "Thiết Lôi",
  "Băng+Phong": "Băng Phong", "Phong+Băng": "Băng Phong",
  "Băng+Ám": "Ám Băng", "Ám+Băng": "Ám Băng",
  "Băng+Quang": "Băng Tinh", "Quang+Băng": "Băng Tinh",
  "Băng+Thổ": "Băng Thổ", "Thổ+Băng": "Băng Thổ",
  "Băng+Kim": "Băng Kim", "Kim+Băng": "Băng Kim",
  "Phong+Ám": "Hư Phong", "Ám+Phong": "Hư Phong",
  "Phong+Quang": "Tiên Phong", "Quang+Phong": "Tiên Phong",
  "Phong+Thổ": "Trần Phong", "Thổ+Phong": "Trần Phong",
  "Phong+Kim": "Phi Kim", "Kim+Phong": "Phi Kim",
  "Ám+Quang": "Hỗn Mang", "Quang+Ám": "Hỗn Mang",
  "Ám+Thổ": "U Minh", "Thổ+Ám": "U Minh",
  "Ám+Kim": "Hắc Kim", "Kim+Ám": "Hắc Kim",
  "Quang+Thổ": "Thánh Thổ", "Thổ+Quang": "Thánh Thổ",
  "Quang+Kim": "Kim Quang", "Kim+Quang": "Kim Quang",
  "Thổ+Kim": "Cương Địa", "Kim+Thổ": "Cương Địa",
  // Combined elements as parents
  "Lôi Diễm+Băng": "Tam Tuyệt", "Băng+Lôi Diễm": "Tam Tuyệt",
  "Lôi Diễm+Ám": "Huyết Ngục", "Ám+Lôi Diễm": "Huyết Ngục",
  "Hỗn Mang+Hỏa": "Hư Diễm", "Hỏa+Hỗn Mang": "Hư Diễm",
  "Thần Hỏa+Lôi": "Thiên Lôi Hỏa", "Lôi+Thần Hỏa": "Thiên Lôi Hỏa",
};

// ─── Name generation ───────────────────────────────────────
// Creature type keywords extracted from species names
const TYPE_WORDS = [
  "Lang", "Ưng", "Hổ", "Xà", "Hồ", "Thỏ", "Dương", "Thử",
  "Bằng", "Hùm", "Phượng", "Mãng", "Khuyển", "Báo", "Hùng",
];

const ELEMENT_PREFIXES: Record<string, string[]> = {
  "Hỏa":        ["Hỏa", "Viêm", "Diễm", "Xích"],
  "Lôi":        ["Lôi", "Thiên", "Điện"],
  "Băng":       ["Băng", "Tuyết", "Hàn"],
  "Phong":      ["Phong", "Cuồng", "Vũ"],
  "Ám":         ["Hắc", "Huyền", "U", "Ám"],
  "Quang":      ["Quang", "Thánh", "Tiên"],
  "Thổ":        ["Thổ", "Địa", "Cổ"],
  "Kim":        ["Kim", "Thiết", "Bạch"],
  "Thủy":       ["Thủy", "Hải", "Thương"],
  "Lôi Diễm":  ["Lôi Diễm", "Diễm Lôi"],
  "Hàn Lôi":   ["Hàn Lôi", "Băng Lôi"],
  "Phong Lôi":  ["Phong Lôi", "Lôi Phong"],
  "Nham Thạch": ["Nham", "Thạch Hỏa"],
  "Hỗn Mang":  ["Hỗn Mang", "Hư Vô"],
  "Địa Ngục":  ["Địa Ngục", "Hỏa Ngục"],
  "Thần Hỏa":  ["Thần Hỏa", "Hỏa Thần"],
  "Địa Chấn":  ["Địa Chấn", "Hắc Lôi"],
  "Hư Phong":  ["Hư Phong", "Ám Phong"],
  "Tiên Phong":["Tiên Phong", "Linh Phong"],
  "U Minh":    ["U Minh", "Minh Địa"],
  "Băng Phong":["Băng Phong", "Hàn Phong"],
  "Ám Băng":   ["Ám Băng", "Huyền Băng"],
  "Băng Tinh": ["Băng Tinh", "Tinh Băng"],
  "Thiên Lôi": ["Thiên Lôi", "Thánh Lôi"],
  "Tiêu Diêu": ["Tiêu Diêu", "Diêu Hỏa"],
  "Hồng Kim":  ["Hồng Kim", "Kim Diễm"],
  "Ám Lôi":    ["Ám Lôi", "Hắc Lôi"],
  "Phi Kim":   ["Phi Kim", "Kim Phong"],
  "Hắc Kim":   ["Hắc Kim", "Kim Huyền"],
  "Băng Kim":  ["Băng Kim", "Kim Băng"],
  "Kim Quang": ["Kim Quang", "Quang Kim"],
  "Thánh Thổ": ["Thánh Thổ", "Thổ Thánh"],
  "Cương Địa": ["Cương Địa", "Địa Kim"],
  "Thiết Lôi": ["Thiết Lôi", "Kim Lôi"],
  "Tam Tuyệt": ["Tam Tuyệt", "Hỗn Nguyên"],
};

function extractTypeWord(name: string): string {
  for (const t of TYPE_WORDS) {
    if (name.includes(t)) return t;
  }
  // Fallback: last word
  const parts = name.split(" ");
  return parts[parts.length - 1] ?? name;
}

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function fuseElements(elemA: string, elemB: string): string {
  if (elemA === elemB) return elemA;
  return ELEMENT_FUSIONS[`${elemA}+${elemB}`] ?? ELEMENT_FUSIONS[`${elemB}+${elemA}`] ?? elemA;
}

export function generateChildName(
  nameA: string, nameB: string,
  element: string,
): string {
  const typeA = extractTypeWord(nameA);
  const typeB = extractTypeWord(nameB);

  const prefixes = ELEMENT_PREFIXES[element] ?? [element];
  const prefix = pickFrom(prefixes);

  // Avoid duplicate type words
  const body = typeA === typeB
    ? typeA
    : `${typeA} ${typeB}`;

  return `${prefix} ${body}`.trim();
}

// ─── Bloodline ─────────────────────────────────────────────
export function computeBloodline(dna: {
  strength: number; agility: number; intelligence: number; vitality: number;
}): Bloodline {
  const avg = (dna.strength + dna.agility + dna.intelligence + dna.vitality) / 4;
  if (avg >= 97) return "primordial";
  if (avg >= 90) return "ancient";
  if (avg >= 80) return "mythic";
  if (avg >= 68) return "legendary";
  if (avg >= 55) return "epic";
  if (avg >= 40) return "rare";
  return "common";
}

// ─── DNA Inheritance ───────────────────────────────────────
function clamp(v: number, min = 1, max = 100) {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function inheritStat(a: number, b: number, mutationRate: number): number {
  const base = (a + b) / 2 + (Math.random() - 0.5) * 8;
  const mutation = Math.random() < mutationRate
    ? (Math.random() - 0.3) * 15   // slight positive bias
    : 0;
  return clamp(base + mutation);
}

const SIZE_ORDER = ["tiny", "small", "medium", "large", "colossal"] as const;
type SizeClass = typeof SIZE_ORDER[number];

function inheritSize(a: string, b: string): SizeClass {
  const ai = SIZE_ORDER.indexOf(a as SizeClass);
  const bi = SIZE_ORDER.indexOf(b as SizeClass);
  const avg = Math.round((Math.max(ai, 0) + Math.max(bi, 0)) / 2);
  return SIZE_ORDER[Math.min(avg, SIZE_ORDER.length - 1)];
}

export interface ChildDNAResult {
  strength: number;
  agility: number;
  intelligence: number;
  vitality: number;
  sizeClass: string;
  bloodline: Bloodline;
  mutationChance: number;
  element: string;
  name: string;
  rank: string;
  rankLevel: number;
  description: string;
  isMutant: boolean;
  mutationSummary: string;
}

const RANKS = [
  "Dã Thú",    // 1
  "Linh Thú",  // 2
  "Vương Thú", // 3
  "Hoàng Thú", // 4
  "Đế Thú",    // 5
  "Thánh Thú", // 6
  "Thần Thú",  // 7
  "Tiên Thú",  // 8
  "Tổ Thú",    // 9
];

function bloodlineToRankBonus(bl: Bloodline): number {
  const map: Record<Bloodline, number> = {
    common: 0, rare: 0, epic: 1, legendary: 1, mythic: 2, ancient: 2, primordial: 3,
  };
  return map[bl];
}

export function computeChildDNA(
  parentA: {
    name: string; element: string; strength: number; agility: number;
    intelligence: number; vitality: number; sizeClass: string;
    mutationChance: number; rankLevel: number;
  },
  parentB: {
    name: string; element: string; strength: number; agility: number;
    intelligence: number; vitality: number; sizeClass: string;
    mutationChance: number; rankLevel: number;
  }
): ChildDNAResult {
  const mutationRate = (parentA.mutationChance + parentB.mutationChance) / 2;
  const isMutant = Math.random() < mutationRate;

  const strength     = inheritStat(parentA.strength, parentB.strength, mutationRate);
  const agility      = inheritStat(parentA.agility, parentB.agility, mutationRate);
  const intelligence = inheritStat(parentA.intelligence, parentB.intelligence, mutationRate);
  const vitality     = inheritStat(parentA.vitality, parentB.vitality, mutationRate);
  const sizeClass    = inheritSize(parentA.sizeClass, parentB.sizeClass);
  const element      = fuseElements(parentA.element, parentB.element);
  const bloodline    = computeBloodline({ strength, agility, intelligence, vitality });
  const name         = generateChildName(parentA.name, parentB.name, element);

  // Rank: average of parents + bloodline bonus + optional mutant boost
  const avgRankLevel = Math.ceil((parentA.rankLevel + parentB.rankLevel) / 2);
  const rankBonus = bloodlineToRankBonus(bloodline) + (isMutant ? 1 : 0);
  const rankLevel = Math.min(avgRankLevel + rankBonus + 1, RANKS.length);
  const rank = RANKS[rankLevel - 1];

  const mutationSummary = isMutant
    ? `Đột biến gen! Chỉ số vượt trội, huyết mạch thăng cấp đột ngột.`
    : `Di truyền bình thường từ ${parentA.name} và ${parentB.name}.`;

  const description = `Loài lai tạo giữa ${parentA.name} (${parentA.element}) và ${parentB.name} (${parentB.element}). ` +
    `Mang nguyên tố ${element}, huyết mạch ${BLOODLINE_LABELS[bloodline]}. ` +
    `${isMutant ? "Đột biến gen cường hóa toàn diện." : "Di truyền cân bằng từ tổ tiên."}`;

  return {
    strength, agility, intelligence, vitality, sizeClass, bloodline,
    mutationChance: clamp(mutationRate * (isMutant ? 1.3 : 1.0), 1, 10) / 100,
    element, name, rank, rankLevel, description, isMutant, mutationSummary,
  };
}

export function getRankFromParents(rankLevelA: number, rankLevelB: number): { rank: string; rankLevel: number } {
  const avgLevel = Math.ceil((rankLevelA + rankLevelB) / 2);
  const boostedLevel = Math.min(avgLevel + 1, RANKS.length);
  return { rank: RANKS[boostedLevel - 1], rankLevel: boostedLevel };
}

export function combineElements(elemA: string, elemB: string): string {
  return fuseElements(elemA, elemB);
}

export function combineNames(nameA: string, nameB: string): string {
  const partsA = nameA.split(" ");
  const partsB = nameB.split(" ");
  const prefix = partsB[0] ?? "";
  const suffix = partsA[partsA.length - 1] ?? "";
  const mid = partsA[0] !== suffix ? partsA[0] : "";
  return [prefix, mid, suffix].filter(Boolean).join(" ");
}
