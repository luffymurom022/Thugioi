import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const worldsTable = pgTable("worlds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull().default(""),
  template: text("template").notNull().default("{}"),
  status: text("status").notNull().default("active"),
  powerLevel: integer("power_level").notNull().default(100),
  totalCreatures: integer("total_creatures").notNull().default(0),
  totalKingdoms: integer("total_kingdoms").notNull().default(0),
  totalSpecies: integer("total_species").notNull().default(0),
  worldDay: integer("world_day").notNull().default(1),
  dangerLevel: integer("danger_level").notNull().default(1),
  spiritualEnergy: integer("spiritual_energy").notNull().default(100),
  colorHex: text("color_hex").notNull().default("#00ffcc"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const universePortalsTable = pgTable("universe_portals", {
  id: serial("id").primaryKey(),
  worldAId: integer("world_a_id").notNull(),
  worldBId: integer("world_b_id").notNull(),
  status: text("status").notNull().default("closed"),
  openedDay: integer("opened_day"),
  closedDay: integer("closed_day"),
  portalStrength: integer("portal_strength").notNull().default(50),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const universeEventsTable = pgTable("universe_events", {
  id: serial("id").primaryKey(),
  universeDay: integer("universe_day").notNull().default(1),
  eventType: text("event_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  affectedWorlds: text("affected_worlds").notNull().default("[]"),
  severity: text("severity").notNull().default("minor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const interworldWarsTable = pgTable("interworld_wars", {
  id: serial("id").primaryKey(),
  attackerWorldId: integer("attacker_world_id").notNull(),
  defenderWorldId: integer("defender_world_id").notNull(),
  attackerKingdom: text("attacker_kingdom").notNull(),
  defenderKingdom: text("defender_kingdom").notNull(),
  status: text("status").notNull().default("ongoing"),
  startDay: integer("start_day").notNull(),
  endDay: integer("end_day"),
  portalId: integer("portal_id"),
  description: text("description").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const interworldTradesTable = pgTable("interworld_trades", {
  id: serial("id").primaryKey(),
  worldAId: integer("world_a_id").notNull(),
  worldBId: integer("world_b_id").notNull(),
  resourceType: text("resource_type").notNull(),
  amount: integer("amount").notNull().default(0),
  completedDay: integer("completed_day"),
  status: text("status").notNull().default("proposed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWorldSchema = createInsertSchema(worldsTable).omit({ id: true, createdAt: true });
export type World = typeof worldsTable.$inferSelect;
export type InsertWorld = z.infer<typeof insertWorldSchema>;
export type UniversePortal = typeof universePortalsTable.$inferSelect;
export type UniverseEvent = typeof universeEventsTable.$inferSelect;
export type InterworldWar = typeof interworldWarsTable.$inferSelect;
