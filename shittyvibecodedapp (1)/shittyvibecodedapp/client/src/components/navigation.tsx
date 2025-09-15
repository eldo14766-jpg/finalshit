import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "@/hooks/use-admin";
import { ThemeToggle } from "@/components/theme-toggle";
import { User, Target, FileText, Shield, Settings, Zap, Archive } from "lucide-react";

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user?: {
    level: number;
    xp: number;
  };
}

export function Navigation({ currentTab, onTabChange, user }: NavigationProps) {
  const { isAdminMode, toggleAdminMode } = useAdmin();

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "quests", label: "Quests", icon: Target },
    { id: "archive", label: "Archive", icon: Archive },
    { id: "notes", label: "Notes", icon: FileText },
    ...(isAdminMode ? [{ id: "admin", label: "Admin", icon: Shield }] : []),
  ];

  const xpPercentage = user ? (user.xp / 3000) * 100 : 0; // TODO: Use dynamic max XP

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">CryptoAlerts</h1>
              {user && (
                <p className="text-xs text-muted-foreground" data-testid="text-user-level">
                  Level {user.level}
                </p>
              )}
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Admin</span>
              <Switch
                checked={isAdminMode}
                onCheckedChange={toggleAdminMode}
                data-testid="switch-admin-mode"
              />
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        {user && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">XP Progress</span>
              <span className="text-sm text-muted-foreground" data-testid="text-xp-progress">
                {user.xp.toLocaleString()} / 3,000
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div 
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Navigation */}
      <nav className="sticky top-[120px] z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-around p-3">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                onClick={() => onTabChange(tab.id)}
                data-testid={`nav-tab-${tab.id}`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
