import { type Profile, type InsertProfile, type QuestGroup, type InsertQuestGroup, type Quest, type InsertQuest, type QuestProgress, type Note, type InsertNote, type SystemSettings, type InsertSystemSettings } from "@shared/schema";
import { db } from "./db";
import { profile, questGroups, quests, questProgress, notes, systemSettings } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // Single User Profile
  getProfile(): Promise<Profile>;
  updateProfile(profileData: Partial<Profile>): Promise<Profile>;

  // Quest Groups
  getAllQuestGroups(): Promise<QuestGroup[]>;
  getQuestGroup(id: string): Promise<QuestGroup | undefined>;
  createQuestGroup(group: InsertQuestGroup): Promise<QuestGroup>;
  updateQuestGroup(id: string, group: Partial<QuestGroup>): Promise<QuestGroup | undefined>;
  deleteQuestGroup(id: string): Promise<boolean>;

  // Quests
  getQuestsByGroupId(groupId: string): Promise<Quest[]>;
  getAllQuests(): Promise<Quest[]>;
  getQuest(id: string): Promise<Quest | undefined>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  updateQuest(id: string, quest: Partial<Quest>): Promise<Quest | undefined>;
  deleteQuest(id: string): Promise<boolean>;

  // Quest Progress
  getAllQuestProgress(): Promise<QuestProgress[]>;
  getQuestProgress(questId: string): Promise<QuestProgress | undefined>;
  completeQuest(questId: string): Promise<QuestProgress>;
  cancelQuestCompletion(questId: string): Promise<QuestProgress>;
  archiveQuest(questId: string, reason: string): Promise<QuestProgress>;
  restoreQuestFromArchive(questId: string): Promise<QuestProgress>;
  deleteArchivedQuest(questId: string): Promise<boolean>;

  // Notes
  getAllNotes(): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, note: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;

  // System Settings
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings>;
}

export class DatabaseStorage implements IStorage {
  
  // Single User Profile
  async getProfile(): Promise<Profile> {
    try {
      const profiles = await db.select().from(profile).limit(1);
      
      if (profiles.length === 0) {
        // Create default profile if none exists
        const defaultProfile: InsertProfile = {
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
      console.error('Error getting profile:', error);
      throw error;
    }
  }

  async updateProfile(profileData: Partial<Profile>): Promise<Profile> {
    try {
      // Get current profile to ensure it exists
      const currentProfile = await this.getProfile();
      
      const [updatedProfile] = await db
        .update(profile)
        .set(profileData)
        .where(eq(profile.id, currentProfile.id))
        .returning();
        
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  // Quest Groups
  async getAllQuestGroups(): Promise<QuestGroup[]> {
    try {
      return await db.select().from(questGroups).orderBy(questGroups.createdAt);
    } catch (error) {
      console.error('Error getting all quest groups:', error);
      throw error;
    }
  }

  async getQuestGroup(id: string): Promise<QuestGroup | undefined> {
    try {
      const [questGroup] = await db.select().from(questGroups).where(eq(questGroups.id, id));
      return questGroup;
    } catch (error) {
      console.error('Error getting quest group:', error);
      throw error;
    }
  }

  async createQuestGroup(group: InsertQuestGroup): Promise<QuestGroup> {
    try {
      const [newGroup] = await db.insert(questGroups).values(group).returning();
      return newGroup;
    } catch (error) {
      console.error('Error creating quest group:', error);
      throw error;
    }
  }

  async updateQuestGroup(id: string, group: Partial<QuestGroup>): Promise<QuestGroup | undefined> {
    try {
      const [updatedGroup] = await db
        .update(questGroups)
        .set(group)
        .where(eq(questGroups.id, id))
        .returning();
      return updatedGroup;
    } catch (error) {
      console.error('Error updating quest group:', error);
      throw error;
    }
  }

  async deleteQuestGroup(id: string): Promise<boolean> {
    try {
      // First delete all quests in this group
      await db.delete(quests).where(eq(quests.groupId, id));
      
      const result = await db.delete(questGroups).where(eq(questGroups.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting quest group:', error);
      throw error;
    }
  }

  // Quests
  async getQuestsByGroupId(groupId: string): Promise<Quest[]> {
    try {
      return await db
        .select()
        .from(quests)
        .where(eq(quests.groupId, groupId))
        .orderBy(quests.createdAt);
    } catch (error) {
      console.error('Error getting quests by group ID:', error);
      throw error;
    }
  }

  async getAllQuests(): Promise<Quest[]> {
    try {
      return await db.select().from(quests).orderBy(quests.createdAt);
    } catch (error) {
      console.error('Error getting all quests:', error);
      throw error;
    }
  }

  async getQuest(id: string): Promise<Quest | undefined> {
    try {
      const [quest] = await db.select().from(quests).where(eq(quests.id, id));
      return quest;
    } catch (error) {
      console.error('Error getting quest:', error);
      throw error;
    }
  }

  async createQuest(quest: InsertQuest): Promise<Quest> {
    try {
      const [newQuest] = await db.insert(quests).values(quest).returning();
      return newQuest;
    } catch (error) {
      console.error('Error creating quest:', error);
      throw error;
    }
  }

  async updateQuest(id: string, quest: Partial<Quest>): Promise<Quest | undefined> {
    try {
      const [updatedQuest] = await db
        .update(quests)
        .set(quest)
        .where(eq(quests.id, id))
        .returning();
      return updatedQuest;
    } catch (error) {
      console.error('Error updating quest:', error);
      throw error;
    }
  }

  async deleteQuest(id: string): Promise<boolean> {
    try {
      // Delete quest progress for this quest first
      await db.delete(questProgress).where(eq(questProgress.questId, id));
      
      const result = await db.delete(quests).where(eq(quests.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting quest:', error);
      throw error;
    }
  }

  // Quest Progress
  async getAllQuestProgress(): Promise<QuestProgress[]> {
    try {
      return await db.select().from(questProgress).orderBy(questProgress.createdAt);
    } catch (error) {
      console.error('Error getting all quest progress:', error);
      throw error;
    }
  }

  async getQuestProgress(questId: string): Promise<QuestProgress | undefined> {
    try {
      const [progress] = await db
        .select()
        .from(questProgress)
        .where(eq(questProgress.questId, questId));
      return progress;
    } catch (error) {
      console.error('Error getting quest progress:', error);
      throw error;
    }
  }

  async completeQuest(questId: string): Promise<QuestProgress> {
    try {
      // Get quest details first to validate it exists and get rewards
      const quest = await this.getQuest(questId);
      if (!quest) {
        throw new Error('Quest not found');
      }

      // Use database transaction for atomic quest completion
      return await db.transaction(async (tx) => {
        // Single atomic upsert operation using INSERT...ON CONFLICT
        // This handles both first-time completion and idempotent repeat calls
        const completionTimestamp = new Date();
        const [progressResult] = await tx
          .insert(questProgress)
          .values({
            questId,
            progress: 1,
            completed: true,
            completedAt: completionTimestamp
          })
          .onConflictDoUpdate({
            target: questProgress.questId,
            set: {
              // Only update if not already completed (CASE WHEN logic)
              progress: sql`CASE WHEN ${questProgress.completed} = false THEN ${questProgress.progress} + 1 ELSE ${questProgress.progress} END`,
              completed: sql`CASE WHEN ${questProgress.completed} = false THEN true ELSE ${questProgress.completed} END`,
              completedAt: sql`CASE WHEN ${questProgress.completed} = false THEN EXCLUDED.completed_at ELSE ${questProgress.completedAt} END`
            }
          })
          .returning({
            id: questProgress.id,
            questId: questProgress.questId,
            progress: questProgress.progress,
            completed: questProgress.completed,
            completedAt: questProgress.completedAt,
            createdAt: questProgress.createdAt,
            // Use a clever technique to detect if this operation changed the completion status
            // If completedAt matches our timestamp, it means we just completed it
            wasJustCompleted: sql<boolean>`${questProgress.completedAt} = ${completionTimestamp.toISOString()}::timestamp`.as('was_just_completed')
          });

        // Award XP and attribute points only if quest completion status actually changed
        if (progressResult.completed && progressResult.wasJustCompleted) {
          // Calculate level from XP (800 XP per level)
          const currentProfile = await tx.select().from(profile).limit(1);
          if (currentProfile.length > 0) {
            const currentXP = currentProfile[0].xp || 0;
            const newXP = currentXP + (quest.xpReward || 0);
            const currentLevel = Math.floor(currentXP / 800) + 1;
            const newLevel = Math.floor(newXP / 800) + 1;
            const levelIncrease = newLevel - currentLevel;
            
            // Update profile with new XP, level, cumulative XP, and available points
            const currentCumulativeXP = currentProfile[0].cumulativeXp || 0;
            const newCumulativeXP = currentCumulativeXP + (quest.xpReward || 0);
            
            const updates: any = {
              xp: sql`${profile.xp} + ${quest.xpReward || 0}`,
              level: newLevel,
              cumulativeXp: newCumulativeXP  // Fix: Update cumulative XP on quest completion
            };
            
            // Award attribute points if specified
            if (quest.attributePointReward && quest.attributePointReward > 0) {
              if (quest.targetAttribute) {
                // Whitelist allowed attributes to prevent SQL injection
                const allowedAttributes = ['physique', 'mental', 'success', 'social', 'skills'];
                if (!allowedAttributes.includes(quest.targetAttribute)) {
                  throw new Error(`Invalid target attribute: ${quest.targetAttribute}`);
                }
                
                // Award to specific attribute safely
                const currentAttributes = currentProfile[0].attributes || {};
                const attributeValue = (currentAttributes as any)[quest.targetAttribute] || 0;
                const newAttributeValue = Math.min(100, attributeValue + quest.attributePointReward);
                
                // Update attributes object safely without raw SQL
                const updatedAttributes = {
                  ...currentAttributes,
                  [quest.targetAttribute]: newAttributeValue
                };
                updates.attributes = updatedAttributes;
              } else {
                // Award as available points
                updates.availablePoints = sql`${profile.availablePoints} + ${quest.attributePointReward}`;
              }
            }
            
            // Award additional available points for level ups (1 per level)
            if (levelIncrease > 0) {
              const additionalPoints = updates.availablePoints 
                ? sql`${updates.availablePoints} + ${levelIncrease}`
                : sql`${profile.availablePoints} + ${levelIncrease}`;
              updates.availablePoints = additionalPoints;
            }
            
            await tx.update(profile).set(updates);
          }
        }

        return progressResult;
      });
    } catch (error) {
      console.error('Error completing quest:', error);
      throw error;
    }
  }

  async cancelQuestCompletion(questId: string): Promise<QuestProgress> {
    try {
      // Get quest details first to validate it exists and get rewards to rollback
      const quest = await this.getQuest(questId);
      if (!quest) {
        throw new Error('Quest not found');
      }

      // Check if quest is actually completed
      const existingProgress = await this.getQuestProgress(questId);
      if (!existingProgress || !existingProgress.completed) {
        throw new Error('Quest not completed');
      }

      // Use database transaction for atomic quest cancellation rollback
      return await db.transaction(async (tx) => {
        // Reset quest progress to incomplete
        const [progressResult] = await tx
          .update(questProgress)
          .set({
            progress: 0,
            completed: false,
            completedAt: null
          })
          .where(eq(questProgress.questId, questId))
          .returning();

        // Rollback profile XP and attribute points
        const currentProfile = await tx.select().from(profile).limit(1);
        if (currentProfile.length > 0) {
          const currentXP = currentProfile[0].xp || 0;
          const newXP = Math.max(0, currentXP - (quest.xpReward || 0));
          const currentLevel = Math.floor(currentXP / 800) + 1;
          const newLevel = Math.floor(newXP / 800) + 1;
          const levelDecrease = currentLevel - newLevel;
          
          // Update profile with reduced XP and level
          const updates: any = {
            xp: Math.max(0, newXP),
            level: newLevel
          };
          
          // Rollback attribute points if they were awarded
          if (quest.attributePointReward && quest.attributePointReward > 0) {
            if (quest.targetAttribute) {
              // Rollback from specific attribute
              const currentAttributes = currentProfile[0].attributes || {};
              const attributeValue = (currentAttributes as any)[quest.targetAttribute] || 0;
              const newAttributeValue = Math.max(0, attributeValue - quest.attributePointReward);
              
              updates.attributes = sql`jsonb_set(${profile.attributes}, '{${quest.targetAttribute}}', '${newAttributeValue}'::jsonb)`;
            } else {
              // Rollback from available points
              updates.availablePoints = sql`${profile.availablePoints} - ${quest.attributePointReward}`;
            }
          }
          
          // Rollback additional available points that were awarded for level ups
          if (levelDecrease > 0) {
            const pointsToRemove = updates.availablePoints 
              ? sql`${updates.availablePoints} - ${levelDecrease}`
              : sql`${profile.availablePoints} - ${levelDecrease}`;
            updates.availablePoints = sql`GREATEST(0, ${pointsToRemove})`; // Ensure never goes below 0
          }
          
          await tx.update(profile).set(updates);
        }

        return progressResult;
      });
    } catch (error) {
      console.error('Error cancelling quest completion:', error);
      throw error;
    }
  }

  // Notes
  async getAllNotes(): Promise<Note[]> {
    try {
      return await db.select().from(notes).orderBy(notes.createdAt);
    } catch (error) {
      console.error('Error getting all notes:', error);
      throw error;
    }
  }

  async getNote(id: string): Promise<Note | undefined> {
    try {
      const [note] = await db.select().from(notes).where(eq(notes.id, id));
      return note;
    } catch (error) {
      console.error('Error getting note:', error);
      throw error;
    }
  }

  async createNote(note: InsertNote): Promise<Note> {
    try {
      const [newNote] = await db.insert(notes).values(note).returning();
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  async updateNote(id: string, note: Partial<Note>): Promise<Note | undefined> {
    try {
      const [updatedNote] = await db
        .update(notes)
        .set({
          ...note,
          updatedAt: new Date()
        })
        .where(eq(notes.id, id))
        .returning();
      return updatedNote;
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<boolean> {
    try {
      const result = await db.delete(notes).where(eq(notes.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // System Settings
  async getSystemSettings(): Promise<SystemSettings> {
    try {
      const settings = await db.select().from(systemSettings).limit(1);
      
      if (settings.length === 0) {
        // Create default system settings if none exist
        const defaultSettings: InsertSystemSettings = {
          maxXp: 10000,
          maxAttributePoints: 100,
          questResetInterval: 24
        };
        
        const [newSettings] = await db.insert(systemSettings).values(defaultSettings).returning();
        return newSettings;
      }
      
      return settings[0];
    } catch (error) {
      console.error('Error getting system settings:', error);
      throw error;
    }
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
      // Get current settings to ensure they exist
      const currentSettings = await this.getSystemSettings();
      
      const [updatedSettings] = await db
        .update(systemSettings)
        .set({
          ...settings,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.id, currentSettings.id))
        .returning();
        
      return updatedSettings;
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  async archiveQuest(questId: string, reason: string): Promise<QuestProgress> {
    try {
      const existingProgress = await this.getQuestProgress(questId);
      if (!existingProgress) {
        throw new Error('Quest progress not found');
      }

      const [archivedProgress] = await db
        .update(questProgress)
        .set({
          isArchived: true,
          archivedAt: new Date(),
          archiveReason: reason,
          canUndo: true
        })
        .where(eq(questProgress.questId, questId))
        .returning();

      return archivedProgress;
    } catch (error) {
      console.error('Error archiving quest:', error);
      throw error;
    }
  }

  async restoreQuestFromArchive(questId: string): Promise<QuestProgress> {
    try {
      const [restoredProgress] = await db
        .update(questProgress)
        .set({
          isArchived: false,
          archivedAt: null,
          archiveReason: null,
          canUndo: true
        })
        .where(eq(questProgress.questId, questId))
        .returning();

      if (!restoredProgress) {
        throw new Error('Quest progress not found');
      }

      return restoredProgress;
    } catch (error) {
      console.error('Error restoring quest from archive:', error);
      throw error;
    }
  }

  async deleteArchivedQuest(questId: string): Promise<boolean> {
    try {
      // Only allow deletion of archived quests
      const existingProgress = await this.getQuestProgress(questId);
      if (!existingProgress?.isArchived) {
        throw new Error('Quest not archived');
      }

      const result = await db
        .delete(questProgress)
        .where(eq(questProgress.questId, questId));
        
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error('Error deleting archived quest:', error);
      throw error;
    }
  }

  async undoQuestCompletion(questId: string): Promise<QuestProgress> {
    try {
      // Get quest details first to validate it exists and get rewards to rollback
      const quest = await this.getQuest(questId);
      if (!quest) {
        throw new Error('Quest not found');
      }

      // Check if quest is actually completed (works for both active and archived quests)
      const existingProgress = await this.getQuestProgress(questId);
      if (!existingProgress || !existingProgress.completed) {
        throw new Error('Quest not completed');
      }

      // Use database transaction for atomic quest completion rollback
      return await db.transaction(async (tx) => {
        // Reset quest progress to incomplete and remove from archive
        const [progressResult] = await tx
          .update(questProgress)
          .set({
            progress: 0,
            completed: false,
            completedAt: null,
            isArchived: false,
            archivedAt: null,
            archiveReason: null
          })
          .where(eq(questProgress.questId, questId))
          .returning();

        // Rollback profile XP from cumulative XP (not current XP)
        const currentProfile = await tx.select().from(profile).limit(1);
        if (currentProfile.length > 0) {
          const currentCumulativeXP = currentProfile[0].cumulativeXp || 0;
          const newCumulativeXP = Math.max(0, currentCumulativeXP - (quest.xpReward || 0));
          
          // Update profile with reduced cumulative XP
          const updates: any = {
            cumulativeXp: newCumulativeXP
          };
          
          // Rollback attribute points if they were awarded
          if (quest.attributePointReward && quest.attributePointReward > 0) {
            if (quest.targetAttribute) {
              // Whitelist allowed attributes to prevent SQL injection
              const allowedAttributes = ['physique', 'mental', 'success', 'social', 'skills'];
              if (!allowedAttributes.includes(quest.targetAttribute)) {
                throw new Error(`Invalid target attribute: ${quest.targetAttribute}`);
              }
              
              // Rollback from specific attribute safely
              const currentAttributes = currentProfile[0].attributes || {};
              const attributeValue = (currentAttributes as any)[quest.targetAttribute] || 0;
              const newAttributeValue = Math.max(0, attributeValue - quest.attributePointReward);
              
              // Update attributes object safely without raw SQL
              const updatedAttributes = {
                ...currentAttributes,
                [quest.targetAttribute]: newAttributeValue
              };
              updates.attributes = updatedAttributes;
            } else {
              // Rollback from available points
              const currentAvailable = currentProfile[0].availablePoints || 0;
              updates.availablePoints = Math.max(0, currentAvailable - quest.attributePointReward);
            }
          }
          
          await tx.update(profile).set(updates);
        }

        return progressResult;
      });
    } catch (error) {
      console.error('Error undoing quest completion:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();