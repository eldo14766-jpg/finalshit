import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProfileSchema, insertQuestGroupSchema, insertQuestSchema, insertSystemSettingsSchema, insertNoteSchema, attributesSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Profile
  app.get("/api/profile", async (req, res) => {
    try {
      const profile = await storage.getProfile();
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.patch("/api/profile/attributes", async (req, res) => {
    try {
      const { attributes, availablePoints } = req.body;
      const validatedAttributes = attributesSchema.parse(attributes);
      
      const updateData: any = {
        attributes: validatedAttributes,
      };
      
      if (typeof availablePoints === 'number') {
        updateData.availablePoints = availablePoints;
      }
      
      const updatedProfile = await storage.updateProfile(updateData);
      res.json(updatedProfile);
    } catch (error) {
      res.status(400).json({ message: "Invalid attributes data" });
    }
  });

  app.patch("/api/profile/admin-points", async (req, res) => {
    try {
      const { availablePoints } = req.body;
      
      if (typeof availablePoints !== 'number' || availablePoints < 0) {
        return res.status(400).json({ message: "Invalid available points value" });
      }
      
      const updateData = { availablePoints };
      const updatedProfile = await storage.updateProfile(updateData);
      res.json(updatedProfile);
    } catch (error) {
      res.status(400).json({ message: "Failed to update available points" });
    }
  });


  // Quest Groups
  app.get("/api/quest-groups", async (req, res) => {
    try {
      const groups = await storage.getAllQuestGroups();
      res.json(groups);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quest groups" });
    }
  });

  app.post("/api/quest-groups", async (req, res) => {
    try {
      const validatedGroup = insertQuestGroupSchema.parse(req.body);
      const group = await storage.createQuestGroup(validatedGroup);
      res.json(group);
    } catch (error) {
      res.status(400).json({ message: "Invalid quest group data" });
    }
  });

  app.patch("/api/quest-groups/:id", async (req, res) => {
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

  app.delete("/api/quest-groups/:id", async (req, res) => {
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

  // Quests
  app.get("/api/quests", async (req, res) => {
    try {
      const { groupId } = req.query;
      
      let quests;
      if (groupId) {
        quests = await storage.getQuestsByGroupId(groupId as string);
      } else {
        quests = await storage.getAllQuests();
      }
      
      res.json(quests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quests" });
    }
  });

  // Quest Progress
  app.get("/api/quest-progress", async (req, res) => {
    try {
      const questProgress = await storage.getAllQuestProgress();
      res.json(questProgress);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quest progress" });
    }
  });

  app.post("/api/quests", async (req, res) => {
    try {
      const validatedQuest = insertQuestSchema.parse(req.body);
      const quest = await storage.createQuest(validatedQuest);
      res.json(quest);
    } catch (error) {
      res.status(400).json({ message: "Invalid quest data" });
    }
  });

  app.patch("/api/quests/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Create a partial schema for updates, excluding fields that shouldn't be updatable
      const updateQuestSchema = insertQuestSchema.partial().omit({ 
        id: true, 
        createdAt: true 
      }).extend({
        // Enforce constraints on numeric fields
        xpReward: z.number().min(0).optional(),
        coinReward: z.number().min(0).optional(),
        maxProgress: z.number().min(1).optional(),
      });
      
      // Validate the request body
      const validatedData = updateQuestSchema.parse(req.body);
      
      // Verify questGroupId exists if provided
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
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid quest data", 
          errors: error.errors 
        });
      }
      res.status(400).json({ message: "Failed to update quest" });
    }
  });

  app.delete("/api/quests/:id", async (req, res) => {
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

  app.post("/api/quests/:questId/complete", async (req, res) => {
    try {
      const { questId } = req.params;
      const completedQuest = await storage.completeQuest(questId);
      res.json(completedQuest);
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error && error.message === 'Quest not found') {
        return res.status(404).json({ message: "Quest not found" });
      }
      
      console.error('Error completing quest:', error);
      res.status(500).json({ message: "Failed to complete quest" });
    }
  });

  app.post("/api/quests/:questId/cancel", async (req, res) => {
    try {
      const { questId } = req.params;
      const cancelledQuest = await storage.cancelQuestCompletion(questId);
      res.json(cancelledQuest);
    } catch (error) {
      // Handle specific error cases
      if (error instanceof Error && error.message === 'Quest not found') {
        return res.status(404).json({ message: "Quest not found" });
      }
      if (error instanceof Error && error.message === 'Quest not completed') {
        return res.status(400).json({ message: "Quest is not completed yet" });
      }
      
      console.error('Error cancelling quest completion:', error);
      res.status(500).json({ message: "Failed to cancel quest completion" });
    }
  });

  // Archive completed quest
  app.post("/api/quests/:questId/archive", async (req, res) => {
    try {
      const { questId } = req.params;
      const { reason = "Archived by user" } = req.body;
      const archivedQuest = await storage.archiveQuest(questId, reason);
      res.json(archivedQuest);
    } catch (error) {
      if (error instanceof Error && error.message === 'Quest not found') {
        return res.status(404).json({ message: "Quest not found" });
      }
      if (error instanceof Error && error.message === 'Quest not completed') {
        return res.status(400).json({ message: "Quest is not completed yet" });
      }
      
      console.error('Error archiving quest:', error);
      res.status(500).json({ message: "Failed to archive quest" });
    }
  });

  // Delete archived quest permanently
  app.delete("/api/quests/:questId/archive", async (req, res) => {
    try {
      const { questId } = req.params;
      const deleted = await storage.deleteArchivedQuest(questId);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof Error && error.message === 'Quest not found') {
        return res.status(404).json({ message: "Quest not found" });
      }
      if (error instanceof Error && error.message === 'Quest not archived') {
        return res.status(400).json({ message: "Quest is not archived" });
      }
      
      console.error('Error deleting archived quest:', error);
      res.status(500).json({ message: "Failed to delete archived quest" });
    }
  });

  // Undo quest completion (works with both active and archived quests)
  app.post("/api/quests/:questId/undo", async (req, res) => {
    try {
      const { questId } = req.params;
      const undoneQuest = await storage.undoQuestCompletion(questId);
      res.json(undoneQuest);
    } catch (error) {
      if (error instanceof Error && error.message === 'Quest not found') {
        return res.status(404).json({ message: "Quest not found" });
      }
      if (error instanceof Error && error.message === 'Quest not completed') {
        return res.status(400).json({ message: "Quest is not completed yet" });
      }
      
      console.error('Error undoing quest completion:', error);
      res.status(500).json({ message: "Failed to undo quest completion" });
    }
  });

  // Notes
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getAllNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get notes" });
    }
  });

  app.get("/api/notes/:id", async (req, res) => {
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

  app.post("/api/notes", async (req, res) => {
    try {
      const validatedNote = insertNoteSchema.parse(req.body);
      const note = await storage.createNote(validatedNote);
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid note data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.patch("/api/notes/:id", async (req, res) => {
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

  app.delete("/api/notes/:id", async (req, res) => {
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

  // System Settings
  app.get("/api/system-settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get system settings" });
    }
  });

  app.patch("/api/system-settings", async (req, res) => {
    try {
      const updateData = req.body;
      const updatedSettings = await storage.updateSystemSettings(updateData);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "Failed to update system settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
