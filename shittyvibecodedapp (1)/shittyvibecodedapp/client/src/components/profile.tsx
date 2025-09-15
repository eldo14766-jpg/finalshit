import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Profile as ProfileType, SystemSettings } from "@shared/schema";
import { RadarChart } from "./radar-chart";
import { Brain, Zap, Shield, Heart, Star, Plus, Minus, Award, TrendingUp, Settings, Crown } from "lucide-react";

const ATTRIBUTE_ICONS = {
  physique: Shield,
  mental: Brain,
  success: Star,
  social: Heart,
  skills: Zap,
};

const ATTRIBUTE_COLORS = {
  physique: "text-green-400",
  mental: "text-blue-400",
  success: "text-yellow-400",
  social: "text-red-400",
  skills: "text-purple-400",
};

export function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<ProfileType>({
    queryKey: ["/api/profile"],
  });

  const { data: systemSettings } = useQuery<SystemSettings>({
    queryKey: ["/api/system-settings"],
  });

  const [localAttributes, setLocalAttributes] = useState(profile?.attributes || {
    physique: 10,
    mental: 10,
    success: 10,
    social: 10,
    skills: 10,
  });

  const [localAvailablePoints, setLocalAvailablePoints] = useState(profile?.availablePoints || 0);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPointsInput, setAdminPointsInput] = useState('');
  const [adminMaxXpInput, setAdminMaxXpInput] = useState('');

  // Update local state when profile data changes
  useEffect(() => {
    if (profile && profile.attributes && profile.availablePoints !== null) {
      setLocalAttributes(profile.attributes);
      setLocalAvailablePoints(profile.availablePoints);
    }
  }, [profile]);

  const updateAttributesMutation = useMutation({
    mutationFn: async (data: { attributes: typeof localAttributes; availablePoints: number }) => {
      const response = await apiRequest("PATCH", "/api/profile/attributes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Attributes updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update attributes",
        variant: "destructive",
      });
    },
  });

  const adminUpdatePointsMutation = useMutation({
    mutationFn: async (points: number) => {
      const response = await apiRequest("PATCH", "/api/profile/admin-points", { availablePoints: points });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Success",
        description: "Available points updated successfully",
      });
      setAdminPointsInput('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update available points",
        variant: "destructive",
      });
    },
  });

  const adminUpdateMaxXpMutation = useMutation({
    mutationFn: async (maxXp: number) => {
      const response = await apiRequest("PATCH", "/api/system-settings/max-xp", { maxXp });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({
        title: "Success",
        description: "Maximum XP updated successfully",
      });
      setAdminMaxXpInput('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update maximum XP",
        variant: "destructive",
      });
    },
  });

  const handleAdminPointsUpdate = () => {
    const points = parseInt(adminPointsInput);
    if (isNaN(points) || points < 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of points (0 or greater)",
        variant: "destructive",
      });
      return;
    }
    adminUpdatePointsMutation.mutate(points);
  };

  const handleAdminMaxXpUpdate = () => {
    const maxXp = parseInt(adminMaxXpInput);
    if (isNaN(maxXp) || maxXp < 1000) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid maximum XP (1000 or greater)",
        variant: "destructive",
      });
      return;
    }
    adminUpdateMaxXpMutation.mutate(maxXp);
  };

  const handleAttributeChange = (attribute: string, delta: number) => {
    const newValue = localAttributes[attribute as keyof typeof localAttributes] + delta;
    
    if (delta > 0 && localAvailablePoints <= 0) {
      toast({
        title: "No points available",
        description: "You need available points to increase attributes",
        variant: "destructive",
      });
      return;
    }

    if (newValue < 0 || newValue > 100) {
      return;
    }

    setLocalAttributes(prev => ({
      ...prev,
      [attribute]: newValue,
    }));

    setLocalAvailablePoints(prev => prev - delta);

    // Auto-save after a short delay
    setTimeout(() => {
      updateAttributesMutation.mutate({
        attributes: { ...localAttributes, [attribute]: newValue },
        availablePoints: localAvailablePoints - delta,
      });
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-muted/30 rounded-xl animate-pulse" />
        <div className="h-40 bg-muted/30 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load profile data</p>
      </div>
    );
  }

  // Calculate XP requirements: level 1: 0-800, level 2: 800-1600, etc.
  const calculateXPForLevel = (level: number): number => {
    return level * 800;
  };

  const calculateLevelFromXP = (xp: number): number => {
    return Math.floor(xp / 800) + 1;
  };

  const getCurrentLevelXP = (xp: number): number => {
    const currentLevel = calculateLevelFromXP(xp);
    return xp - ((currentLevel - 1) * 800);
  };

  const getNextLevelXP = (): number => {
    return 800; // Each level requires 800 XP
  };

  const currentLevelXP = getCurrentLevelXP(profile.xp || 0);
  const nextLevelXP = getNextLevelXP();
  const xpPercentage = (currentLevelXP / nextLevelXP) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Profile Stats */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                P
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold" data-testid="text-user-name">
                My Profile
              </h2>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-lg">
                  Level {calculateLevelFromXP(profile.xp || 0)}
                </span>
                <span className="text-sm text-muted-foreground" data-testid="text-user-xp">
                  {(profile.xp || 0).toLocaleString()} XP
                </span>
              </div>
              
              {/* XP Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Level Progress</span>
                  <span>{currentLevelXP}/{nextLevelXP} XP</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(xpPercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* Cumulative XP Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Total XP Progress</span>
                  <span>{(profile.cumulativeXp || 0).toLocaleString()}/{(systemSettings?.maxXp || 80000).toLocaleString()} XP</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(((profile.cumulativeXp || 0) / (systemSettings?.maxXp || 80000)) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1 text-center">
                  {(((profile.cumulativeXp || 0) / (systemSettings?.maxXp || 80000)) * 100).toFixed(1)}% Complete
                </div>
              </div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Skill Attributes</h3>
            <RadarChart attributes={localAttributes} />
            
            {/* Attribute Allocator */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-3">
                  <span>Available Points:</span>
                  <div className="flex items-center space-x-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <Label htmlFor="admin-mode" className="text-xs font-medium">Admin Mode</Label>
                    <Switch
                      id="admin-mode"
                      checked={adminMode}
                      onCheckedChange={setAdminMode}
                      className="scale-75"
                    />
                  </div>
                </div>
                <span 
                  className="bg-primary/10 text-primary px-2 py-1 rounded-lg" 
                  data-testid="text-available-points"
                >
                  {localAvailablePoints}
                </span>
              </div>
              
              {/* Admin Mode Panel */}
              {adminMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <Settings className="w-4 h-4 text-yellow-500" />
                    <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Admin Controls</h4>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <Label htmlFor="admin-points" className="text-xs text-muted-foreground">Set Available Points</Label>
                      <Input
                        id="admin-points"
                        type="number"
                        min="0"
                        placeholder="Enter points"
                        value={adminPointsInput}
                        onChange={(e) => setAdminPointsInput(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAdminPointsUpdate}
                      disabled={adminUpdatePointsMutation.isPending || !adminPointsInput}
                      className="bg-yellow-600 hover:bg-yellow-700 mt-6"
                    >
                      {adminUpdatePointsMutation.isPending ? "Updating..." : "Update"}
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3 mt-4 pt-3 border-t border-yellow-500/20">
                    <div className="flex-1">
                      <Label htmlFor="admin-max-xp" className="text-xs text-muted-foreground">Set Maximum XP</Label>
                      <Input
                        id="admin-max-xp"
                        type="number"
                        min="1000"
                        placeholder="Enter max XP"
                        value={adminMaxXpInput}
                        onChange={(e) => setAdminMaxXpInput(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={handleAdminMaxXpUpdate}
                      disabled={adminUpdateMaxXpMutation.isPending || !adminMaxXpInput}
                      className="bg-orange-600 hover:bg-orange-700 mt-6"
                    >
                      {adminUpdateMaxXpMutation.isPending ? "Updating..." : "Update"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    🛠️ Admin mode allows you to modify attribute points and XP progress settings.
                  </p>
                </motion.div>
              )}
              
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(localAttributes).map(([attribute, value]) => {
                  const IconComponent = ATTRIBUTE_ICONS[attribute as keyof typeof ATTRIBUTE_ICONS];
                  const colorClass = ATTRIBUTE_COLORS[attribute as keyof typeof ATTRIBUTE_COLORS];
                  
                  return (
                    <div 
                      key={attribute}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      data-testid={`attribute-row-${attribute}`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className={`w-5 h-5 ${colorClass}`} />
                        <span className="capitalize">{attribute}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 bg-destructive/10 hover:bg-destructive/20 text-destructive border-destructive/20"
                          onClick={() => handleAttributeChange(attribute, -1)}
                          disabled={value <= 0}
                          data-testid={`button-decrease-${attribute}`}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span 
                          className="w-8 text-center font-medium" 
                          data-testid={`text-${attribute}-value`}
                        >
                          {value}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0 bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                          onClick={() => handleAttributeChange(attribute, 1)}
                          disabled={localAvailablePoints <= 0 || value >= 100}
                          data-testid={`button-increase-${attribute}`}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Quest Master</p>
                <p className="text-sm text-muted-foreground">Completed 50 quests</p>
              </div>
              <span className="text-xs text-muted-foreground">2h ago</span>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Level Up!</p>
                <p className="text-sm text-muted-foreground">Reached level {profile.level}</p>
              </div>
              <span className="text-xs text-muted-foreground">1d ago</span>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
