import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QuestGroup, Quest, QuestProgress } from "@shared/schema";
import { QuestGroupModal } from "./quest-group-modal";
import { QuestModal } from "./quest-modal";
import { 
  Calendar, Target, Star, Trophy, Zap, Heart, Shield, Brain, 
  Rocket, Gem, Flame, Compass, Plus, Edit2, Trash2, Undo 
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

export function QuestGroups() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<QuestGroup | null>(null);
  const [isQuestModalOpen, setIsQuestModalOpen] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/quest-groups/${id}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related caches after group deletion
      queryClient.invalidateQueries({ queryKey: ["/api/quest-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      toast({
        title: "Success",
        description: "Quest group deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quest group",
        variant: "destructive",
      });
    },
  });

  const deleteQuestMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/quests/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      toast({
        title: "Success",
        description: "Quest deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quest",
        variant: "destructive",
      });
    },
  });

  const completeQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const response = await apiRequest("POST", `/api/quests/${questId}/complete`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate quest progress to show completion status
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      // Invalidate profile to show updated XP from quest rewards
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Quest Completed!",
        description: "You've earned XP and attribute points for completing this quest.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete quest",
        variant: "destructive",
      });
    },
  });

  const cancelQuestMutation = useMutation({
    mutationFn: async (questId: string) => {
      const response = await apiRequest("POST", `/api/quests/${questId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate quest progress to show cancellation status
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      // Invalidate profile to show rollback of XP and attribute points
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Quest Completion Cancelled",
        description: "XP and attribute points have been rolled back.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel quest completion",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleEditGroup = (group: QuestGroup) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleDeleteGroup = (group: QuestGroup) => {
    if (confirm(`Are you sure you want to delete "${group.name}"?`)) {
      deleteMutation.mutate(group.id);
    }
  };

  const handleCreateQuest = (groupId: string) => {
    setEditingQuest(null);
    setSelectedGroupId(groupId);
    setIsQuestModalOpen(true);
  };

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    setSelectedGroupId(undefined);
    setIsQuestModalOpen(true);
  };

  const handleDeleteQuest = (quest: Quest) => {
    if (confirm(`Are you sure you want to delete "${quest.title}"?`)) {
      deleteQuestMutation.mutate(quest.id);
    }
  };

  const getQuestsByGroup = (groupId: string) => {
    return quests.filter(quest => quest.groupId === groupId);
  };

  const getQuestProgress = (questId: string) => {
    return questProgress.find(qp => qp.questId === questId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Quest Groups</h2>
        <Button
          onClick={handleCreateGroup}
          className="flex items-center space-x-2"
          data-testid="button-create-group"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </Button>
      </div>

      {/* Quest Groups */}
      <div className="space-y-6">
        {questGroups.map((group) => {
          const IconComponent = ICON_MAP[group.icon as keyof typeof ICON_MAP] || Calendar;
          const groupQuests = getQuestsByGroup(group.id);

          return (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="quest-group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg" data-testid={`text-group-name-${group.id}`}>
                          {group.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {group.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGroup(group)}
                        data-testid={`button-edit-group-${group.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGroup(group)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-group-${group.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      {groupQuests.length} quest{groupQuests.length !== 1 ? 's' : ''}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCreateQuest(group.id)}
                      className="flex items-center space-x-1"
                      data-testid={`button-create-quest-${group.id}`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Quest</span>
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {groupQuests.map((quest) => {
                      const currentProgress = getQuestProgress(quest.id);
                      const progress = currentProgress?.progress || 0;
                      const isCompleted = currentProgress?.completed || false;

                      return (
                        <div
                          key={quest.id}
                          className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                          data-testid={`quest-item-${quest.id}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className={`w-2 h-2 rounded-full ${
                                isCompleted 
                                  ? "bg-green-500" 
                                  : progress > 0 
                                    ? "bg-primary animate-radar-pulse"
                                    : "bg-muted-foreground"
                              }`}
                            />
                            <div>
                              <p className="font-medium" data-testid={`text-quest-title-${quest.id}`}>
                                {quest.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {isCompleted 
                                  ? "Completed ✓" 
                                  : `Progress: ${progress}/${quest.maxProgress}`
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditQuest(quest)}
                                data-testid={`button-edit-quest-${quest.id}`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteQuest(quest)}
                                className="text-destructive hover:text-destructive"
                                data-testid={`button-delete-quest-${quest.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              <div className="text-right ml-2">
                                <p className={`font-medium ${isCompleted ? "text-green-500" : "text-primary"}`}>
                                  +{quest.xpReward} XP
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  +{quest.attributePointReward || 0} {quest.targetAttribute ? quest.targetAttribute : "attribute"} pts
                                </p>
                                {quest.difficulty && (
                                  <p className="text-xs text-muted-foreground">
                                    Rank {quest.difficulty}
                                  </p>
                                )}
                              </div>
                              {!isCompleted ? (
                                <Button
                                  size="sm"
                                  onClick={() => completeQuestMutation.mutate(quest.id)}
                                  disabled={completeQuestMutation.isPending}
                                  data-testid={`button-complete-quest-${quest.id}`}
                                >
                                  Complete
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to cancel completion of "${quest.title}"? This will rollback your XP and attribute points.`)) {
                                      cancelQuestMutation.mutate(quest.id);
                                    }
                                  }}
                                  disabled={cancelQuestMutation.isPending}
                                  data-testid={`button-cancel-quest-${quest.id}`}
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  <Undo className="w-3 h-3 mr-1" />
                                  Undo
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <QuestGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        group={editingGroup}
      />
      
      <QuestModal
        isOpen={isQuestModalOpen}
        onClose={() => setIsQuestModalOpen(false)}
        quest={editingQuest}
        defaultGroupId={selectedGroupId}
      />
    </motion.div>
  );
}
