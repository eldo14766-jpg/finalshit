import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QuestGroup } from "@shared/schema";
import { 
  Calendar, Target, Star, Trophy, Zap, Heart, Shield, Brain, 
  Rocket, Gem, Flame, Compass, X 
} from "lucide-react";

interface QuestGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group?: QuestGroup | null;
}

const ICONS = [
  { name: "calendar", icon: Calendar },
  { name: "target", icon: Target },
  { name: "star", icon: Star },
  { name: "trophy", icon: Trophy },
  { name: "zap", icon: Zap },
  { name: "heart", icon: Heart },
  { name: "shield", icon: Shield },
  { name: "brain", icon: Brain },
  { name: "rocket", icon: Rocket },
  { name: "gem", icon: Gem },
  { name: "flame", icon: Flame },
  { name: "compass", icon: Compass },
];

export function QuestGroupModal({ isOpen, onClose, group }: QuestGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("calendar");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || "");
      setSelectedIcon(group.icon || "calendar");
    } else {
      setName("");
      setDescription("");
      setSelectedIcon("calendar");
    }
  }, [group]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; icon: string }) => {
      const response = await apiRequest("POST", "/api/quest-groups", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quest-groups"] });
      toast({
        title: "Success",
        description: "Quest group created successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create quest group",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; icon: string }) => {
      const response = await apiRequest("PATCH", `/api/quest-groups/${group!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quest-groups"] });
      toast({
        title: "Success",
        description: "Quest group updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update quest group",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim(),
      icon: selectedIcon,
    };

    if (group) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const SelectedIconComponent = ICONS.find(icon => icon.name === selectedIcon)?.icon || Calendar;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">
            {group ? "Edit Quest Group" : "Create Quest Group"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              data-testid="input-group-name"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description"
              rows={3}
              data-testid="input-group-description"
            />
          </div>
          
          <div>
            <Label>Group Icon</Label>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Select an icon</span>
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <SelectedIconComponent className="w-5 h-5 text-primary" />
                </div>
              </div>
              
              <div className="icon-grid">
                {ICONS.map((iconInfo) => {
                  const IconComponent = iconInfo.icon;
                  return (
                    <button
                      key={iconInfo.name}
                      type="button"
                      className={`w-8 h-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors ${
                        selectedIcon === iconInfo.name ? "bg-primary/10 text-primary" : ""
                      }`}
                      onClick={() => setSelectedIcon(iconInfo.name)}
                      data-testid={`icon-${iconInfo.name}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-group"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Group"}
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
      </DialogContent>
    </Dialog>
  );
}
