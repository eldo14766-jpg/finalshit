import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SystemSettings } from "@shared/schema";
import { Settings } from "lucide-react";

export function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [maxXp, setMaxXp] = useState(10000);
  const [maxAttributes, setMaxAttributes] = useState(100);
  const [questReset, setQuestReset] = useState(24);

  const { data: settings } = useQuery<SystemSettings>({
    queryKey: ["/api/system-settings"],
  });

  // Update local state when settings data changes
  useEffect(() => {
    if (settings) {
      setMaxXp(settings.maxXp || 10000);
      setMaxAttributes(settings.maxAttributePoints || 100);
      setQuestReset(settings.questResetInterval || 24);
    }
  }, [settings]);


  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<SystemSettings>) => {
      const response = await apiRequest("PATCH", "/api/system-settings", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      toast({
        title: "Success",
        description: "System settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update system settings",
        variant: "destructive",
      });
    },
  });

  const handleUpdateMaxXp = () => {
    updateSettingsMutation.mutate({ maxXp });
  };

  const handleUpdateMaxAttributes = () => {
    updateSettingsMutation.mutate({ maxAttributePoints: maxAttributes });
  };

  const handleUpdateQuestReset = () => {
    updateSettingsMutation.mutate({ questResetInterval: questReset });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>System Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <Label htmlFor="maxXp" className="font-medium">Maximum XP Limit</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="maxXp"
                type="number"
                value={maxXp}
                onChange={(e) => setMaxXp(Number(e.target.value))}
                className="w-24 text-right"
                data-testid="input-max-xp"
              />
              <Button
                onClick={handleUpdateMaxXp}
                size="sm"
                disabled={updateSettingsMutation.isPending}
                data-testid="button-update-max-xp"
              >
                Update
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <Label htmlFor="maxAttributes" className="font-medium">Max Attribute Points</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="maxAttributes"
                type="number"
                value={maxAttributes}
                onChange={(e) => setMaxAttributes(Number(e.target.value))}
                className="w-24 text-right"
                data-testid="input-max-attributes"
              />
              <Button
                onClick={handleUpdateMaxAttributes}
                size="sm"
                disabled={updateSettingsMutation.isPending}
                data-testid="button-update-max-attributes"
              >
                Update
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <Label htmlFor="questReset" className="font-medium">Quest Reset Interval (hours)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="questReset"
                type="number"
                value={questReset}
                onChange={(e) => setQuestReset(Number(e.target.value))}
                className="w-24 text-right"
                data-testid="input-quest-reset"
              />
              <Button
                onClick={handleUpdateQuestReset}
                size="sm"
                disabled={updateSettingsMutation.isPending}
                data-testid="button-update-quest-reset"
              >
                Update
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </motion.div>
  );
}
