import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Profile as ProfileType } from "@shared/schema";
import { Navigation } from "@/components/navigation";
import { Profile } from "@/components/profile";
import { QuestGroups } from "@/components/quest-groups";
import { Archive } from "@/components/archive";
import { Notes } from "@/components/notes";
import { AdminPanel } from "@/components/admin-panel";

export default function Home() {
  const [currentTab, setCurrentTab] = useState("profile");

  const { data: profile } = useQuery<ProfileType>({
    queryKey: ["/api/profile"],
  });


  const renderTabContent = () => {
    switch (currentTab) {
      case "profile":
        return <Profile />;
      case "quests":
        return <QuestGroups />;
      case "archive":
        return <Archive />;
      case "notes":
        return <Notes />;
      case "admin":
        return <AdminPanel />;
      default:
        return <Profile />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        currentTab={currentTab} 
        onTabChange={setCurrentTab} 
        user={profile ? { level: profile.level || 1, xp: profile.xp || 0 } : undefined}
      />
      
      {/* Tab Content */}
      <main className="p-4 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            data-testid={`tab-content-${currentTab}`}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
