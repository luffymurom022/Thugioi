import { pgTable, text, serial, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const creaturesTable = pgTable("creatures", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rank: text("rank").notNull(),
  rankLevel: integer("rank_level").notNull().default(1),
  element: text("element").notNull(),
  habitat: text("habitat").notNull(),
  population: integer("population").notNull().default(0),
  lifespan: integer("lifespan").notNull().default(100),
  reproductionRate: real("reproduction_rate").notNull().default(0.1),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("alive"),
  isHybrid: boolean("is_hybrid").notNull().default(false),
  parentA: text("parent_a"),
  parentB: text("parent_b"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCreatureSchema = createInsertSchema(creaturesTable).omit({ id: true, createdAt: true });
export type InsertCreature = z.infer<typeof insertCreatureSchema>;
export type Creature = typeof creaturesTable.$inferSelect;
