import { pgTable, text, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const historyTable = pgTable("world_history", {
  id: serial("id").primaryKey(),
  worldDay: integer("world_day").notNull().default(1),
  eventType: text("event_type").notNull().default("info"),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const worldStateTable = pgTable("world_state", {
  id: serial("id").primaryKey(),
  worldDay: integer("world_day").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const worldEventsTable = pgTable("world_events", {
  id: serial("id").primaryKey(),
  worldDay: integer("world_day").notNull().default(1),
  eventName: text("event_name").notNull(),
  targetZone: text("target_zone").notNull().default("all"),
  targetSpecies: text("target_species").notNull().default("all"),
  effectType: text("effect_type").notNull().default("population"),
  severity: real("severity").notNull().default(0.1),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const evolutionPathsTable = pgTable("evolution_paths", {
  id: serial("id").primaryKey(),
  fromSpecies: text("from_species").notNull(),
  toSpecies: text("to_species").notNull(),
  toRank: text("to_rank").notNull(),
  toRankLevel: integer("to_rank_level").notNull().default(1),
  toElement: text("to_element").notNull(),
  toDescription: text("to_description").notNull().default(""),
  minPopulation: integer("min_population").notNull().default(100),
  minHuntSuccesses: integer("min_hunt_successes").notNull().default(20),
  minAgeTicks: integer("min_age_ticks").notNull().default(15),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHistorySchema = createInsertSchema(historyTable).omit({ id: true, createdAt: true });
export type InsertHistory = z.infer<typeof insertHistorySchema>;
export type HistoryEntry = typeof historyTable.$inferSelect;
export type WorldEvent = typeof worldEventsTable.$inferSelect;
export type EvolutionPath = typeof evolutionPathsTable.$inferSelect;
