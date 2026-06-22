import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Territories — resource layer on top of zones
export const territoriesTable = pgTable("territories", {
  id: serial("id").primaryKey(),
  zoneName: text("zone_name").notNull().unique(),
  food: integer("food").notNull().default(600),
  water: integer("water").notNull().default(600),
  mineral: integer("mineral").notNull().default(300),
  spirit: integer("spirit").notNull().default(100),
  foodMax: integer("food_max").notNull().default(1000),
  waterMax: integer("water_max").notNull().default(1000),
  mineralMax: integer("mineral_max").notNull().default(500),
  spiritMax: integer("spirit_max").notNull().default(200),
  climate: text("climate").notNull().default("temperate"),
  dominantSpecies: text("dominant_species"),
  controllingKingdom: text("controlling_kingdom"),
  contested: boolean("contested").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Beast Kingdoms
export const beastKingdomsTable = pgTable("beast_kingdoms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  dominantSpecies: text("dominant_species").notNull(),
  foundedDay: integer("founded_day").notNull().default(1),
  capital: text("capital").notNull(),
  militaryPower: integer("military_power").notNull().default(100),
  economy: integer("economy").notNull().default(100),
  influence: integer("influence").notNull().default(50),
  population: integer("population").notNull().default(0),
  territoryCount: integer("territory_count").notNull().default(1),
  status: text("status").notNull().default("active"),
  // V6 additions
  technologyLevel: integer("technology_level").notNull().default(1),
  morale: integer("morale").notNull().default(70),
  warCount: integer("war_count").notNull().default(0),
  warWins: integer("war_wins").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Packs — tribe groups per species per territory
export const packsTable = pgTable("packs", {
  id: serial("id").primaryKey(),
  speciesName: text("species_name").notNull(),
  territory: text("territory").notNull(),
  population: integer("population").notNull().default(0),
  leaderName: text("leader_name").notNull().default(""),
  leaderLevel: integer("leader_level").notNull().default(1),
  leaderIntelligence: integer("leader_intelligence").notNull().default(50),
  leaderCharisma: integer("leader_charisma").notNull().default(50),
  kingdomName: text("kingdom_name"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Kingdom Relations — diplomacy
export const kingdomRelationsTable = pgTable("kingdom_relations", {
  id: serial("id").primaryKey(),
  kingdomNameA: text("kingdom_name_a").notNull(),
  kingdomNameB: text("kingdom_name_b").notNull(),
  relation: text("relation").notNull().default("neutral"),
  sinceDay: integer("since_day").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Wars — V6 War & Conquest System
export const warsTable = pgTable("wars", {
  id: serial("id").primaryKey(),
  attackerKingdom: text("attacker_kingdom").notNull(),
  defenderKingdom: text("defender_kingdom").notNull(),
  status: text("status").notNull().default("ongoing"), // ongoing | attacker_won | defender_won | ceasefire
  startDay: integer("start_day").notNull(),
  endDay: integer("end_day"),
  territoryWon: text("territory_won"),
  attackerCasualties: integer("attacker_casualties").notNull().default(0),
  defenderCasualties: integer("defender_casualties").notNull().default(0),
  resultDescription: text("result_description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Heroes — V6 Hero System
export const heroesTable = pgTable("heroes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  kingdomName: text("kingdom_name").notNull(),
  level: integer("level").notNull().default(1),
  ability: text("ability").notNull().default(""),
  militaryBonus: integer("military_bonus").notNull().default(10),
  moraleBonus: integer("morale_bonus").notNull().default(5),
  status: text("status").notNull().default("active"), // active | fallen
  bornDay: integer("born_day").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTerritorySchema = createInsertSchema(territoriesTable).omit({ id: true, createdAt: true });
export const insertKingdomSchema = createInsertSchema(beastKingdomsTable).omit({ id: true, createdAt: true });
export const insertPackSchema = createInsertSchema(packsTable).omit({ id: true, createdAt: true });
export const insertRelationSchema = createInsertSchema(kingdomRelationsTable).omit({ id: true, createdAt: true });
export const insertWarSchema = createInsertSchema(warsTable).omit({ id: true, createdAt: true });
export const insertHeroSchema = createInsertSchema(heroesTable).omit({ id: true, createdAt: true });

export type Territory = typeof territoriesTable.$inferSelect;
export type BeastKingdom = typeof beastKingdomsTable.$inferSelect;
export type Pack = typeof packsTable.$inferSelect;
export type KingdomRelation = typeof kingdomRelationsTable.$inferSelect;
export type War = typeof warsTable.$inferSelect;
export type Hero = typeof heroesTable.$inferSelect;
