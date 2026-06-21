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

  // Ecosystem v2 fields
  energy: integer("energy").notNull().default(100),
  hunger: integer("hunger").notNull().default(30),
  ageTicks: integer("age_ticks").notNull().default(0),
  maturityAge: integer("maturity_age").notNull().default(5),
  gender: text("gender").notNull().default("mixed"),
  preySpecies: text("prey_species").notNull().default("[]"),
  predatorSpecies: text("predator_species").notNull().default("[]"),
  generation: integer("generation").notNull().default(1),
  huntSuccesses: integer("hunt_successes").notNull().default(0),
  evolutionStage: integer("evolution_stage").notNull().default(0),
  evolutionChain: text("evolution_chain").notNull().default("[]"),
  maxPopulation: integer("max_population").notNull().default(2000),
  dietType: text("diet_type").notNull().default("herbivore"),
  mutationChance: real("mutation_chance").notNull().default(0.01),
  isMutant: boolean("is_mutant").notNull().default(false),

  // Genetics / DNA system
  strength: integer("strength").notNull().default(50),
  agility: integer("agility").notNull().default(50),
  intelligence: integer("intelligence").notNull().default(50),
  vitality: integer("vitality").notNull().default(50),
  sizeClass: text("size_class").notNull().default("medium"),
  bloodline: text("bloodline").notNull().default("common"),
});

export const insertCreatureSchema = createInsertSchema(creaturesTable).omit({ id: true, createdAt: true });
export type InsertCreature = z.infer<typeof insertCreatureSchema>;
export type Creature = typeof creaturesTable.$inferSelect;
