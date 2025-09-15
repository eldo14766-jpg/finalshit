import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Single user profile for personal use
export const profile = pgTable("profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  cumulativeXp: integer("cumulative_xp").default(0),
  availablePoints: integer("available_points").default(0),
  attributes: jsonb("attributes").$type<{
    physique: number;
    mental: number;
    success: number;
    social: number;
    skills: number;
  }>().default({
    physique: 10,
    mental: 10,
    success: 10,
    social: 10,
    skills: 10
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questGroups = pgTable("quest_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("calendar"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quests = pgTable("quests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => questGroups.id),
  title: text("title").notNull(),
  description: text("description"),
  xpReward: integer("xp_reward").default(100),
  attributePointReward: integer("attribute_point_reward").default(1),
  targetAttribute: text("target_attribute"),
  difficulty: text("difficulty").default("E"),
  maxProgress: integer("max_progress").default(1),
  // Toggle features
  enableRecurring: boolean("enable_recurring").default(false),
  repetitionFrequency: text("repetition_frequency").default("none"),
  enableDeadline: boolean("enable_deadline").default(false),
  deadline: timestamp("deadline"),
  enablePenalty: boolean("enable_penalty").default(false),
  penaltyXP: integer("penalty_xp").default(0),
  penaltyAttributePoints: integer("penalty_attribute_points").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Simplified quest completion tracking for single user
export const questProgress = pgTable("quest_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questId: varchar("quest_id").references(() => quests.id),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  // Archive system
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  archiveReason: text("archive_reason"),
  canUndo: boolean("can_undo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueQuestId: unique().on(table.questId),
}));

// Notes section for personal notes
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maxXp: integer("max_xp").default(80000),
  maxAttributePoints: integer("max_attribute_points").default(100),
  questResetInterval: integer("quest_reset_interval").default(24),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profile).omit({
  id: true,
  createdAt: true,
});

export const insertQuestGroupSchema = createInsertSchema(questGroups).omit({
  id: true,
  createdAt: true,
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profile.$inferSelect;
export type InsertQuestGroup = z.infer<typeof insertQuestGroupSchema>;
export type QuestGroup = typeof questGroups.$inferSelect;
export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof quests.$inferSelect;
export type QuestProgress = typeof questProgress.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

export const attributesSchema = z.object({
  physique: z.number().min(0).max(100),
  mental: z.number().min(0).max(100),
  success: z.number().min(0).max(100),
  social: z.number().min(0).max(100),
  skills: z.number().min(0).max(100),
});
