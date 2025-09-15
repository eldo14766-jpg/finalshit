import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Quest, QuestGroup, insertQuestSchema, InsertQuest } from "@shared/schema";
import { z } from "zod";

interface QuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  quest?: Quest | null;
  defaultGroupId?: string;
}

// Define difficulty ranks
const difficultyRanks = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'] as const;
type DifficultyRank = typeof difficultyRanks[number];

// Define attribute options
const attributeOptions = [
  { value: 'physique', label: 'Physique' },
  { value: 'mental', label: 'Mental' },
  { value: 'success', label: 'Success' },
  { value: 'social', label: 'Social' },
  { value: 'skills', label: 'Skills' },
] as const;

// Repetition frequency options
const repetitionOptions = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

// Form schema with proper validation rules
const questFormSchema = insertQuestSchema.extend({
  title: z.string().min(1, "Quest title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  groupId: z.string().min(1, "Please select a quest group"),
  xpReward: z.number().min(0, "XP reward must be 0 or greater").max(10000, "XP reward must be less than 10,000"),
  attributePointReward: z.number().min(0, "Attribute point reward must be 0 or greater").max(100, "Attribute point reward must be less than 100"),
  targetAttribute: z.string().optional(),
  difficulty: z.enum(difficultyRanks),
  maxProgress: z.number().min(1, "Max progress must be at least 1").max(1000, "Max progress must be less than 1,000"),
  // Toggle features
  enableRecurring: z.boolean().optional(),
  repetitionFrequency: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  enableDeadline: z.boolean().optional(),
  deadline: z.string().optional(),
  enablePenalty: z.boolean().optional(),
  penaltyXP: z.number().min(0).optional(),
  penaltyAttributePoints: z.number().min(0).optional(),
});

type QuestFormData = z.infer<typeof questFormSchema>;

export function QuestModal({ isOpen, onClose, quest, defaultGroupId }: QuestModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: questGroups = [] } = useQuery<QuestGroup[]>({
    queryKey: ["/api/quest-groups"],
  });

  const form = useForm<QuestFormData>({
    resolver: zodResolver(questFormSchema),
    defaultValues: {
      title: "",
      description: "",
      groupId: "",
      xpReward: 100,
      attributePointReward: 1,
      targetAttribute: "none",
      difficulty: "E" as DifficultyRank,
      maxProgress: 1,
      enableRecurring: false,
      repetitionFrequency: "none",
      enableDeadline: false,
      deadline: "",
      enablePenalty: false,
      penaltyXP: 0,
      penaltyAttributePoints: 0,
    },
  });

  // Reset form when quest or defaultGroupId changes
  useEffect(() => {
    if (quest) {
      form.reset({
        title: quest.title,
        description: quest.description || "",
        groupId: quest.groupId || "",
        xpReward: quest.xpReward || 100,
        attributePointReward: quest.attributePointReward || 1,
        targetAttribute: quest.targetAttribute || "",
        difficulty: (quest.difficulty as DifficultyRank) || "E",
        maxProgress: quest.maxProgress || 1,
        enableRecurring: false,
        repetitionFrequency: "none",
        enableDeadline: false,
        deadline: "",
        enablePenalty: false,
        penaltyXP: 0,
        penaltyAttributePoints: 0,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        groupId: defaultGroupId || "",
        xpReward: 100,
        attributePointReward: 1,
        targetAttribute: "none",
        difficulty: "E" as DifficultyRank,
        maxProgress: 1,
        enableRecurring: false,
        repetitionFrequency: "none",
        enableDeadline: false,
        deadline: "",
        enablePenalty: false,
        penaltyXP: 0,
        penaltyAttributePoints: 0,
      });
    }
  }, [quest, defaultGroupId, form]);

  const createMutation = useMutation({
    mutationFn: async (data: QuestFormData) => {
      const response = await apiRequest("POST", "/api/quests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      toast({
        title: "Success",
        description: "Quest created successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create quest",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: QuestFormData) => {
      const response = await apiRequest("PATCH", `/api/quests/${quest!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quest-progress"] });
      toast({
        title: "Success",
        description: "Quest updated successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update quest",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuestFormData) => {
    if (quest) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedGroup = questGroups.find(g => g.id === form.watch("groupId"));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {quest ? "Edit Quest" : "Create Quest"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter quest title"
                      data-testid="input-quest-title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter quest description"
                      rows={3}
                      data-testid="input-quest-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quest Group</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-quest-group">
                        <SelectValue placeholder="Select a quest group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {questGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGroup && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedGroup.description}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="xpReward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>XP Reward</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="10000"
                        placeholder="100"
                        data-testid="input-xp-reward"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Rank</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-difficulty">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {difficultyRanks.map((rank) => (
                          <SelectItem key={rank} value={rank}>
                            Rank {rank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="attributePointReward"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attribute Points Reward</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="1"
                        data-testid="input-attribute-reward"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAttribute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Attribute</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-target-attribute">
                          <SelectValue placeholder="Select attribute" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific attribute</SelectItem>
                        {attributeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maxProgress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Progress</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      placeholder="1"
                      data-testid="input-max-progress"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Toggle Features Section */}
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-medium">Advanced Features</h3>
              
              {/* Recurring Quest Toggle */}
              <FormField
                control={form.control}
                name="enableRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Recurring Quest</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable recurring quest functionality
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="toggle-recurring"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Recurring Frequency (only show when recurring is enabled) */}
              {form.watch("enableRecurring") && (
                <FormField
                  control={form.control}
                  name="repetitionFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repetition Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-repetition-frequency">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {repetitionOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Deadline Toggle */}
              <FormField
                control={form.control}
                name="enableDeadline"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Quest Deadline</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Set a deadline for this quest
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="toggle-deadline"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Deadline Input (only show when deadline is enabled) */}
              {form.watch("enableDeadline") && (
                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          data-testid="input-deadline"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Penalty System Toggle */}
              <FormField
                control={form.control}
                name="enablePenalty"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Penalty System</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable penalties for missing deadlines
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="toggle-penalty"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Penalty Fields (only show when penalty is enabled) */}
              {form.watch("enablePenalty") && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="penaltyXP"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>XP Penalty</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="10000"
                            placeholder="0"
                            data-testid="input-penalty-xp"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="penaltyAttributePoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attribute Points Penalty</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0"
                            data-testid="input-penalty-attribute-points"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-quest"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Quest"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}