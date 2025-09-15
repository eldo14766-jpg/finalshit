var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  attributesSchema: () => attributesSchema,
  insertNoteSchema: () => insertNoteSchema,
  insertProfileSchema: () => insertProfileSchema,
  insertQuestGroupSchema: () => insertQuestGroupSchema,
  insertQuestSchema: () => insertQuestSchema,
  insertSystemSettingsSchema: () => insertSystemSettingsSchema,
  notes: () => notes,
  profile: () => profile,
  questGroups: () => questGroups,
  questProgress: () => questProgress,
  quests: () => quests,
  systemSettings: () => systemSettings
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var profile = pgTable("profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  availablePoints: integer("available_points").default(0),
  attributes: jsonb("attributes").$type().default({
    physique: 10,
    mental: 10,
    success: 10,
    social: 10,
    skills: 10
  }),
  createdAt: timestamp("created_at").defaultNow()
});
var questGroups = pgTable("quest_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("calendar"),
  createdAt: timestamp("created_at").defaultNow()
});
var quests = pgTable("quests", {
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
  createdAt: timestamp("created_at").defaultNow()
});
var questProgress = pgTable("quest_progress", {
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
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  uniqueQuestId: unique().on(table.questId)
}));
var notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maxXp: integer("max_xp").default(1e4),
  maxAttributePoints: integer("max_attribute_points").default(100),
  questResetInterval: integer("quest_reset_interval").default(24),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertProfileSchema = createInsertSchema(profile).omit({
  id: true,
  createdAt: true
});
var insertQuestGroupSchema = createInsertSchema(questGroups).omit({
  id: true,
  createdAt: true
});
var insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
  createdAt: true
});
var insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true
});
var attributesSchema = z.object({
  physique: z.number().min(0).max(100),
  mental: z.number().min(0).max(100),
  success: z.number().min(0).max(100),
  social: z.number().min(0).max(100),
  skills: z.number().min(0).max(100)
});

// server/db.ts
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var sql2 = postgres(process.env.DATABASE_URL, {
  ssl: false,
  // Disable SSL since DATABASE_URL includes sslmode=disable
  max: 10,
  // Maximum connections
  idle_timeout: 20,
  connect_timeout: 10
});
var db = drizzle(sql2, { schema: schema_exports });

// server/storage.ts
import { eq, sql as sql3 } from "drizzle-orm";
var DatabaseStorage = class {
  // Single User Profile
  async getProfile() {
    try {
      const profiles = await db.select().from(profile).limit(1);
      if (profiles.length === 0) {
        const defaultProfile = {
          level: 1,
          xp: 0,
          availablePoints: 0,
          attributes: {
            physique: 10,
            mental: 10,
            success: 10,
            social: 10,
            skills: 10
          }
        };
        const [newProfile] = await db.insert(profile).values(defaultProfile).returning();
        return newProfile;
      }
      return profiles[0];
    } catch (error) {
      console.error("Error getting profile:", error);
      throw error;
    }
  }
  async updateProfile(profileData) {
    try {
      const currentProfile = await this.getProfile();
      const [updatedProfile] = await db.update(profile).set(profileData).where(eq(profile.id, currentProfile.id)).returning();
      return updatedProfile;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  }
  // Quest Groups
  async getAllQuestGroups() {
    try {
      return await db.select().from(questGroups).orderBy(questGroups.createdAt);
    } catch (error) {
      console.error("Error getting all quest groups:", error);
      throw error;
    }
  }
  async getQuestGroup(id) {
    try {
      const [questGroup] = await db.select().from(questGroups).where(eq(questGroups.id, id));
      return questGroup;
    } catch (error) {
      console.error("Error getting quest group:", error);
      throw error;
    }
  }
  async createQuestGroup(group) {
    try {
      const [newGroup] = await db.insert(questGroups).values(group).returning();
      return newGroup;
    } catch (error) {
      console.error("Error creating quest group:", error);
      throw error;
    }
  }
  async updateQuestGroup(id, group) {
    try {
      const [updatedGroup] = await db.update(questGroups).set(group).where(eq(questGroups.id, id)).returning();
      return updatedGroup;
    } catch (error) {
      console.error("Error updating quest group:", error);
      throw error;
    }
  }
  async deleteQuestGroup(id) {
    try {
      await db.delete(quests).where(eq(quests.groupId, id));
      const result = await db.delete(questGroups).where(eq(questGroups.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting quest group:", error);
      throw error;
    }
  }
  // Quests
  async getQuestsByGroupId(groupId) {
    try {
      return await db.select().from(quests).where(eq(quests.groupId, groupId)).orderBy(quests.createdAt);
    } catch (error) {
      console.error("Error getting quests by group ID:", error);
      throw error;
    }
  }
  async getAllQuests() {
    try {
      return await db.select().from(quests).orderBy(quests.createdAt);
    } catch (error) {
      console.error("Error getting all quests:", error);
      throw error;
    }
  }
  async getQuest(id) {
    try {
      const [quest] = await db.select().from(quests).where(eq(quests.id, id));
      return quest;
    } catch (error) {
      console.error("Error getting quest:", error);
      throw error;
    }
  }
  async createQuest(quest) {
    try {
      const [newQuest] = await db.insert(quests).values(quest).returning();
      return newQuest;
    } catch (error) {
      console.error("Error creating quest:", error);
      throw error;
    }
  }
  async updateQuest(id, quest) {
    try {
      const [updatedQuest] = await db.update(quests).set(quest).where(eq(quests.id, id)).returning();
      return updatedQuest;
    } catch (error) {
      console.error("Error updating quest:", error);
      throw error;
    }
  }
  async deleteQuest(id) {
    try {
      await db.delete(questProgress).where(eq(questProgress.questId, id));
      const result = await db.delete(quests).where(eq(quests.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting quest:", error);
      throw error;
    }
  }
  // Quest Progress
  async getAllQuestProgress() {
    try {
      return await db.select().from(questProgress).orderBy(questProgress.createdAt);
    } catch (error) {
      console.error("Error getting all quest progress:", error);
      throw error;
    }
  }
  async getQuestProgress(questId) {
    try {
      const [progress] = await db.select().from(questProgress).where(eq(questProgress.questId, questId));
      return progress;
    } catch (error) {
      console.error("Error getting quest progress:", error);
      throw error;
    }
  }
  async completeQuest(questId) {
    try {
      const quest = await this.getQuest(questId);
      if (!quest) {
        throw new Error("Quest not found");
      }
      return await db.transaction(async (tx) => {
        const completionTimestamp = /* @__PURE__ */ new Date();
        const [progressResult] = await tx.insert(questProgress).values({
          questId,
          progress: 1,
          completed: true,
          completedAt: completionTimestamp
        }).onConflictDoUpdate({
          target: questProgress.questId,
          set: {
            // Only update if not already completed (CASE WHEN logic)
            progress: sql3`CASE WHEN ${questProgress.completed} = false THEN ${questProgress.progress} + 1 ELSE ${questProgress.progress} END`,
            completed: sql3`CASE WHEN ${questProgress.completed} = false THEN true ELSE ${questProgress.completed} END`,
            completedAt: sql3`CASE WHEN ${questProgress.completed} = false THEN EXCLUDED.completed_at ELSE ${questProgress.completedAt} END`
          }
        }).returning({
          id: questProgress.id,
          questId: questProgress.questId,
          progress: questProgress.progress,
          completed: questProgress.completed,
          completedAt: questProgress.completedAt,
          createdAt: questProgress.createdAt,
          // Use a clever technique to detect if this operation changed the completion status
          // If completedAt matches our timestamp, it means we just completed it
          wasJustCompleted: sql3`${questProgress.completedAt} = ${completionTimestamp.toISOString()}::timestamp`.as("was_just_completed")
        });
        if (progressResult.completed && progressResult.wasJustCompleted) {
          const currentProfile = await tx.select().from(profile).limit(1);
          if (currentProfile.length > 0) {
            const currentXP = currentProfile[0].xp || 0;
            const newXP = currentXP + (quest.xpReward || 0);
            const currentLevel = Math.floor(currentXP / 800) + 1;
            const newLevel = Math.floor(newXP / 800) + 1;
            const levelIncrease = newLevel - currentLevel;
            const updates = {
              xp: sql3`${profile.xp} + ${quest.xpReward || 0}`,
              level: newLevel
            };
            if (quest.attributePointReward && quest.attributePointReward > 0) {
              if (quest.targetAttribute) {
                const currentAttributes = currentProfile[0].attributes || {};
                const attributeValue = currentAttributes[quest.targetAttribute] || 0;
                const newAttributeValue = Math.min(100, attributeValue + quest.attributePointReward);
                updates.attributes = sql3`jsonb_set(${profile.attributes}, '{${quest.targetAttribute}}', '${newAttributeValue}'::jsonb)`;
              } else {
                updates.availablePoints = sql3`${profile.availablePoints} + ${quest.attributePointReward}`;
              }
            }
            if (levelIncrease > 0) {
              const additionalPoints = updates.availablePoints ? sql3`${updates.availablePoints} + ${levelIncrease}` : sql3`${profile.availablePoints} + ${levelIncrease}`;
              updates.availablePoints = additionalPoints;
            }
            await tx.update(profile).set(updates);
          }
        }
        return progressResult;
      });
    } catch (error) {
      console.error("Error completing quest:", error);
      throw error;
    }
  }
  async cancelQuestCompletion(questId) {
    try {
      const quest = await this.getQuest(questId);
      if (!quest) {
        throw new Error("Quest not found");
      }
      const existingProgress = await this.getQuestProgress(questId);
      if (!existingProgress || !existingProgress.completed) {
        throw new Error("Quest not completed");
      }
      return await db.transaction(async (tx) => {
        const [progressResult] = await tx.update(questProgress).set({
          progress: 0,
          completed: false,
          completedAt: null
        }).where(eq(questProgress.questId, questId)).returning();
        const currentProfile = await tx.select().from(profile).limit(1);
        if (currentProfile.length > 0) {
          const currentXP = currentProfile[0].xp || 0;
          const newXP = Math.max(0, currentXP - (quest.xpReward || 0));
          const currentLevel = Math.floor(currentXP / 800) + 1;
          const newLevel = Math.floor(newXP / 800) + 1;
          const levelDecrease = currentLevel - newLevel;
          const updates = {
            xp: Math.max(0, newXP),
            level: newLevel
          };
          if (quest.attributePointReward && quest.attributePointReward > 0) {
            if (quest.targetAttribute) {
              const currentAttributes = currentProfile[0].attributes || {};
              const attributeValue = currentAttributes[quest.targetAttribute] || 0;
              const newAttributeValue = Math.max(0, attributeValue - quest.attributePointReward);
              updates.attributes = sql3`jsonb_set(${profile.attributes}, '{${quest.targetAttribute}}', '${newAttributeValue}'::jsonb)`;
            } else {
              updates.availablePoints = sql3`${profile.availablePoints} - ${quest.attributePointReward}`;
            }
          }
          if (levelDecrease > 0) {
            const pointsToRemove = updates.availablePoints ? sql3`${updates.availablePoints} - ${levelDecrease}` : sql3`${profile.availablePoints} - ${levelDecrease}`;
            updates.availablePoints = sql3`GREATEST(0, ${pointsToRemove})`;
          }
          await tx.update(profile).set(updates);
        }
        return progressResult;
      });
    } catch (error) {
      console.error("Error cancelling quest completion:", error);
      throw error;
    }
  }
  // Notes
  async getAllNotes() {
    try {
      return await db.select().from(notes).orderBy(notes.createdAt);
    } catch (error) {
      console.error("Error getting all notes:", error);
      throw error;
    }
  }
  async getNote(id) {
    try {
      const [note] = await db.select().from(notes).where(eq(notes.id, id));
      return note;
    } catch (error) {
      console.error("Error getting note:", error);
      throw error;
    }
  }
  async createNote(note) {
    try {
      const [newNote] = await db.insert(notes).values(note).returning();
      return newNote;
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  }
  async updateNote(id, note) {
    try {
      const [updatedNote] = await db.update(notes).set({
        ...note,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(notes.id, id)).returning();
      return updatedNote;
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  }
  async deleteNote(id) {
    try {
      const result = await db.delete(notes).where(eq(notes.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  }
  // System Settings
  async getSystemSettings() {
    try {
      const settings = await db.select().from(systemSettings).limit(1);
      if (settings.length === 0) {
        const defaultSettings = {
          maxXp: 1e4,
          maxAttributePoints: 100,
          questResetInterval: 24
        };
        const [newSettings] = await db.insert(systemSettings).values(defaultSettings).returning();
        return newSettings;
      }
      return settings[0];
    } catch (error) {
      console.error("Error getting system settings:", error);
      throw error;
    }
  }
  async updateSystemSettings(settings) {
    try {
      const currentSettings = await this.getSystemSettings();
      const [updatedSettings] = await db.update(systemSettings).set({
        ...settings,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(systemSettings.id, currentSettings.id)).returning();
      return updatedSettings;
    } catch (error) {
      console.error("Error updating system settings:", error);
      throw error;
    }
  }
  async archiveQuest(questId, reason) {
    try {
      const existingProgress = await this.getQuestProgress(questId);
      if (!existingProgress) {
        throw new Error("Quest progress not found");
      }
      const [archivedProgress] = await db.update(questProgress).set({
        isArchived: true,
        archivedAt: /* @__PURE__ */ new Date(),
        archiveReason: reason,
        canUndo: true
      }).where(eq(questProgress.questId, questId)).returning();
      return archivedProgress;
    } catch (error) {
      console.error("Error archiving quest:", error);
      throw error;
    }
  }
  async restoreQuestFromArchive(questId) {
    try {
      const [restoredProgress] = await db.update(questProgress).set({
        isArchived: false,
        archivedAt: null,
        archiveReason: null,
        canUndo: true
      }).where(eq(questProgress.questId, questId)).returning();
      if (!restoredProgress) {
        throw new Error("Quest progress not found");
      }
      return restoredProgress;
    } catch (error) {
      console.error("Error restoring quest from archive:", error);
      throw error;
    }
  }
  async deleteArchivedQuest(questId) {
    try {
      const existingProgress = await this.getQuestProgress(questId);
      if (!existingProgress?.isArchived) {
        throw new Error("Can only delete archived quests");
      }
      const result = await db.delete(questProgress).where(eq(questProgress.questId, questId));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting archived quest:", error);
      throw error;
    }
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";
async function registerRoutes(app2) {
  app2.get("/api/profile", async (req, res) => {
    try {
      const profile2 = await storage.getProfile();
      res.json(profile2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });
  app2.patch("/api/profile/attributes", async (req, res) => {
    try {
      const { attributes, availablePoints } = req.body;
      const validatedAttributes = attributesSchema.parse(attributes);
      const updateData = {
        attributes: validatedAttributes
      };
      if (typeof availablePoints === "number") {
        updateData.availablePoints = availablePoints;
      }
      const updatedProfile = await storage.updateProfile(updateData);
      res.json(updatedProfile);
    } catch (error) {
      res.status(400).json({ message: "Invalid attributes data" });
    }
  });
  app2.patch("/api/profile/admin-points", async (req, res) => {
    try {
      const { availablePoints } = req.body;
      if (typeof availablePoints !== "number" || availablePoints < 0) {
        return res.status(400).json({ message: "Invalid available points value" });
      }
      const updateData = { availablePoints };
      const updatedProfile = await storage.updateProfile(updateData);
      res.json(updatedProfile);
    } catch (error) {
      res.status(400).json({ message: "Failed to update available points" });
    }
  });
  app2.get("/api/quest-groups", async (req, res) => {
    try {
      const groups = await storage.getAllQuestGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quest groups" });
    }
  });
  app2.post("/api/quest-groups", async (req, res) => {
    try {
      const validatedGroup = insertQuestGroupSchema.parse(req.body);
      const group = await storage.createQuestGroup(validatedGroup);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid quest group data" });
    }
  });
  app2.patch("/api/quest-groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedGroup = await storage.updateQuestGroup(id, updateData);
      if (!updatedGroup) {
        return res.status(404).json({ message: "Quest group not found" });
      }
      res.json(updatedGroup);
    } catch (error) {
      res.status(400).json({ message: "Failed to update quest group" });
    }
  });
  app2.delete("/api/quest-groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteQuestGroup(id);
      if (!deleted) {
        return res.status(404).json({ message: "Quest group not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quest group" });
    }
  });
  app2.get("/api/quests", async (req, res) => {
    try {
      const { groupId } = req.query;
      let quests2;
      if (groupId) {
        quests2 = await storage.getQuestsByGroupId(groupId);
      } else {
        quests2 = await storage.getAllQuests();
      }
      res.json(quests2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quests" });
    }
  });
  app2.get("/api/quest-progress", async (req, res) => {
    try {
      const questProgress2 = await storage.getAllQuestProgress();
      res.json(questProgress2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quest progress" });
    }
  });
  app2.post("/api/quests", async (req, res) => {
    try {
      const validatedQuest = insertQuestSchema.parse(req.body);
      const quest = await storage.createQuest(validatedQuest);
      res.json(quest);
    } catch (error) {
      res.status(400).json({ message: "Invalid quest data" });
    }
  });
  app2.patch("/api/quests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateQuestSchema = insertQuestSchema.partial().omit({
        id: true,
        createdAt: true
      }).extend({
        // Enforce constraints on numeric fields
        xpReward: z2.number().min(0).optional(),
        coinReward: z2.number().min(0).optional(),
        maxProgress: z2.number().min(1).optional()
      });
      const validatedData = updateQuestSchema.parse(req.body);
      if (validatedData.groupId) {
        const groupExists = await storage.getQuestGroup(validatedData.groupId);
        if (!groupExists) {
          return res.status(400).json({ message: "Quest group not found" });
        }
      }
      const updatedQuest = await storage.updateQuest(id, validatedData);
      if (!updatedQuest) {
        return res.status(404).json({ message: "Quest not found" });
      }
      res.json(updatedQuest);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid quest data",
          errors: error.errors
        });
      }
      res.status(400).json({ message: "Failed to update quest" });
    }
  });
  app2.delete("/api/quests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteQuest(id);
      if (!deleted) {
        return res.status(404).json({ message: "Quest not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quest" });
    }
  });
  app2.post("/api/quests/:questId/complete", async (req, res) => {
    try {
      const { questId } = req.params;
      const completedQuest = await storage.completeQuest(questId);
      res.json(completedQuest);
    } catch (error) {
      if (error instanceof Error && error.message === "Quest not found") {
        return res.status(404).json({ message: "Quest not found" });
      }
      console.error("Error completing quest:", error);
      res.status(500).json({ message: "Failed to complete quest" });
    }
  });
  app2.post("/api/quests/:questId/cancel", async (req, res) => {
    try {
      const { questId } = req.params;
      const cancelledQuest = await storage.cancelQuestCompletion(questId);
      res.json(cancelledQuest);
    } catch (error) {
      if (error instanceof Error && error.message === "Quest not found") {
        return res.status(404).json({ message: "Quest not found" });
      }
      if (error instanceof Error && error.message === "Quest not completed") {
        return res.status(400).json({ message: "Quest is not completed yet" });
      }
      console.error("Error cancelling quest completion:", error);
      res.status(500).json({ message: "Failed to cancel quest completion" });
    }
  });
  app2.get("/api/notes", async (req, res) => {
    try {
      const notes2 = await storage.getAllNotes();
      res.json(notes2);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notes" });
    }
  });
  app2.get("/api/notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const note = await storage.getNote(id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(500).json({ message: "Failed to get note" });
    }
  });
  app2.post("/api/notes", async (req, res) => {
    try {
      const validatedNote = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedNote);
      res.json(note);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid note data",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });
  app2.patch("/api/notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedNote = await storage.updateNote(id, updateData);
      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json(updatedNote);
    } catch (error) {
      res.status(400).json({ message: "Failed to update note" });
    }
  });
  app2.delete("/api/notes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteNote(id);
      if (!deleted) {
        return res.status(404).json({ message: "Note not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete note" });
    }
  });
  app2.get("/api/system-settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get system settings" });
    }
  });
  app2.patch("/api/system-settings", async (req, res) => {
    try {
      const updateData = req.body;
      const updatedSettings = await storage.updateSystemSettings(updateData);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "Failed to update system settings" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig(async ({ mode }) => ({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...mode === "development" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
}));

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
