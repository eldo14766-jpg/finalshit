import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QuestGroup, Quest, QuestProgress } from "@shared/schema";
import { 
  Calendar, Target, Star, Trophy, Zap, Heart, Shield, Brain, 
  Rocket, Gem, Flame, Compass, Trash2, Undo, CheckCircle 
} from "lucide-react";

const ICON_MAP = {
  calendar: Calendar,
  target: Target,
  star: Star,
  trophy: Trophy,
  zap: Zap,
  heart: Heart,
  shield: Shield,
  brain: Brain,
  rocket: Rocket,
  gem: Gem,
  flame: Flame,
  compass: Compass,
};

export function Archive() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questGroups = [] } = useQuery<QuestGroup[]>({
    queryKey: ["/api/quest-groups"],
  });

  const { data: quests = [] } = useQuery<Quest[]>({
    queryKey: ["/api/quests"],
  });

  const { data: questProgress = [] } = useQuery<QuestProgress[]>({
    queryKey: ["/api/quest-progress"],
  });

  // Archive completed quest mutation
  const archiveQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const response = await apiRequest("POST", `/api/quests/${questId}/archive`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      toast({
        title: "Quest Archived",
        description: "Quest has been moved to archive.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive quest",
        variant: "destructive",
      });
    },
  });

  // Delete archived quest permanently
  const deleteArchivedQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const response = await apiRequest("DELETE", `/api/quests/${questId}/archive`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      toast({
        title: "Quest Deleted",
        description: "Quest has been permanently deleted from archive.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete archived quest",
        variant: "destructive",
      });
    },
  });

  // Undo quest completion (return to active)
  const undoQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const response = await apiRequest("POST", `/api/quests/${questId}/undo`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Quest Completion Undone",
        description: "Quest returned to active status and XP deducted from cumulative total.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to undo quest completion",
        variant: "destructive",
      });
    },
  });

  const getQuestsByGroup = (groupId: string) => {
    return quests.filter(quest => quest.groupId === groupId);
  };

  const getQuestProgress = (questId: string) => {
    return questProgress.find(qp => qp.questId === questId);
  };

  const getCompletedQuests = () => {
    return questProgress.filter(qp => qp.completed && !qp.isArchived);
  };

  const getArchivedQuests = () => {
    return questProgress.filter(qp => qp.completed && qp.isArchived);
  };

  const handleArchiveQuest = (questId: string) => {
    archiveQuestMutation.mutate(questId);
  };

  const handleDeleteArchivedQuest = (questId: string, questTitle: string) => {
    if (confirm(`Are you sure you want to permanently delete "${questTitle}"? This action cannot be undone.`)) {
      deleteArchivedQuestMutation.mutate(questId);
    }
  };

  const handleUndoQuest = (questId: string, questTitle: string) => {
    if (confirm(`Are you sure you want to undo completion of "${questTitle}"? XP will be deducted from your cumulative total.`)) {
      undoQuestMutation.mutate(questId);
    }
  };

  const completedQuests = getCompletedQuests();
  const archivedQuests = getArchivedQuests();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Quest Archive</h2>
        <div className="text-sm text-muted-foreground">
          {completedQuests.length} completed • {archivedQuests.length} archived
        </div>
      </div>

      {/* Completed Quests (Ready to Archive) */}
      {completedQuests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>Completed Quests</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These quests are completed but not yet archived. You can archive them or undo their completion.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedQuests.map((progress) => {
                const quest = quests.find(q => q.id === progress.questId);
                const group = quest ? questGroups.find(g => g.id === quest.groupId) : null;
                const IconComponent = group ? ICON_MAP[group.icon as keyof typeof ICON_MAP] || Calendar : Calendar;

                if (!quest || !group) return null;

                return (
                  <div
                    key={progress.id}
                    className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">{quest.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.name} • Completed {progress.completedAt ? new Date(progress.completedAt).toLocaleDateString() : 'recently'}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          +{quest.xpReward} XP • +{quest.attributePointReward} attribute points
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleArchiveQuest(quest.id)}
                        disabled={archiveQuestMutation.isPending}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/20"
                      >
                        Archive
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUndoQuest(quest.id, quest.title)}
                        disabled={undoQuestMutation.isPending}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950/20"
                      >
                        <Undo className="w-3 h-3 mr-1" />
                        Undo
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Archived Quests */}
      {archivedQuests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <span>Archived Quests</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              These quests are archived. You can permanently delete them or undo their completion.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {archivedQuests.map((progress) => {
                const quest = quests.find(q => q.id === progress.questId);
                const group = quest ? questGroups.find(g => g.id === quest.groupId) : null;
                const IconComponent = group ? ICON_MAP[group.icon as keyof typeof ICON_MAP] || Calendar : Calendar;

                if (!quest || !group) return null;

                return (
                  <div
                    key={progress.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">{quest.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.name} • Archived {progress.archivedAt ? new Date(progress.archivedAt).toLocaleDateString() : 'recently'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          +{quest.xpReward} XP • +{quest.attributePointReward} attribute points
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUndoQuest(quest.id, quest.title)}
                        disabled={undoQuestMutation.isPending}
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950/20"
                      >
                        <Undo className="w-3 h-3 mr-1" />
                        Undo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteArchivedQuest(quest.id, quest.title)}
                        disabled={deleteArchivedQuestMutation.isPending}
                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {completedQuests.length === 0 && archivedQuests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No completed quests yet</h3>
            <p className="text-muted-foreground">
              Complete some quests to see them appear in your archive.
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}