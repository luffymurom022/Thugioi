import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const worldAgesTable = pgTable("world_ages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDay: integer("start_day").notNull().default(1),
  endDay: integer("end_day"),
  description: text("description").notNull().default(""),
  trigger: text("trigger").notNull().default("genesis"),
  isCurrent: boolean("is_current").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const legendsTable = pgTable("legends", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("history"),
  sourceEventId: integer("source_event_id"),
  relatedEntity: text("related_entity").notNull().default(""),
  worldDay: integer("world_day").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const mythsTable = pgTable("myths", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  subject: text("subject").notNull().default("creature"),
  subjectName: text("subject_name").notNull().default(""),
  worldDay: integer("world_day").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const bloodlineHistoriesTable = pgTable("bloodline_histories", {
  id: serial("id").primaryKey(),
  bloodlineName: text("bloodline_name").notNull().unique(),
  ancestorName: text("ancestor_name").notNull().default(""),
  totalAgeTicks: integer("total_age_ticks").notNull().default(0),
  peakPopulation: integer("peak_population").notNull().default(0),
  content: text("content").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loreBooksTable = pgTable("lore_books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("history"),
  content: text("content").notNull(),
  worldDay: integer("world_day").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loreNewsTable = pgTable("lore_news", {
  id: serial("id").primaryKey(),
  headline: text("headline").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("general"),
  worldDay: integer("world_day").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLegendSchema = createInsertSchema(legendsTable).omit({ id: true, createdAt: true });
export const insertMythSchema = createInsertSchema(mythsTable).omit({ id: true, createdAt: true });
export const insertBloodlineHistorySchema = createInsertSchema(bloodlineHistoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWorldAgeSchema = createInsertSchema(worldAgesTable).omit({ id: true, createdAt: true });

export type WorldAge = typeof worldAgesTable.$inferSelect;
export type Legend = typeof legendsTable.$inferSelect;
export type Myth = typeof mythsTable.$inferSelect;
export type BloodlineHistory = typeof bloodlineHistoriesTable.$inferSelect;
export type LoreBook = typeof loreBooksTable.$inferSelect;
export type LoreNews = typeof loreNewsTable.$inferSelect;
