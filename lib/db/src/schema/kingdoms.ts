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

export const insertTerritorySchema = createInsertSchema(territoriesTable).omit({ id: true, createdAt: true });
export const insertKingdomSchema = createInsertSchema(beastKingdomsTable).omit({ id: true, createdAt: true });
export const insertPackSchema = createInsertSchema(packsTable).omit({ id: true, createdAt: true });
export const insertRelationSchema = createInsertSchema(kingdomRelationsTable).omit({ id: true, createdAt: true });

export type Territory = typeof territoriesTable.$inferSelect;
export type BeastKingdom = typeof beastKingdomsTable.$inferSelect;
export type Pack = typeof packsTable.$inferSelect;
export type KingdomRelation = typeof kingdomRelationsTable.$inferSelect;
