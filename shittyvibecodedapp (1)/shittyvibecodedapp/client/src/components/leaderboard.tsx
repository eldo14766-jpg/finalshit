import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile as ProfileType, QuestProgress } from "@shared/schema";
import { Trophy, Star, Target, Zap } from "lucide-react";

export function Leaderboard() {
  const { data: profile, isLoading: profileLoading } = useQuery<ProfileType>({
    queryKey: ["/api/profile"],
  });

  const { data: questProgress = [], isLoading: progressLoading } = useQuery<QuestProgress[]>({
    queryKey: ["/api/quest-progress"],
  });

  const isLoading = profileLoading || progressLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-muted/30 rounded-lg animate-pulse" />
        ))}
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

  const completedQuests = questProgress.filter(qp => qp.completed).length;
  const totalProgress = questProgress.reduce((sum, qp) => sum + (qp.progress || 0), 0);

  const achievements = [
    {
      icon: <Trophy className="w-6 h-6 text-yellow-500" />,
      title: "Level Achievement",
      description: `Reached Level ${profile.level}`,
      value: profile.level,
      color: "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20"
    },
    {
      icon: <Star className="w-6 h-6 text-blue-500" />,
      title: "Experience Points",
      description: `${(profile.xp || 0).toLocaleString()} total XP earned`,
      value: profile.xp || 0,
      color: "bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20"
    },
    {
      icon: <Target className="w-6 h-6 text-green-500" />,
      title: "Quests Completed",
      description: `${completedQuests} quests finished`,
      value: completedQuests,
      color: "bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20"
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-500" />,
      title: "Total Progress",
      description: `${totalProgress} progress points accumulated`,
      value: totalProgress,
      color: "bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20"
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Personal Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex items-center space-x-4 p-4 rounded-lg ${achievement.color}`}
                data-testid={`achievement-row-${index + 1}`}
              >
                <div className="flex items-center space-x-3">
                  {achievement.icon}
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {achievement.value}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1">
                  <p className="font-semibold" data-testid={`text-achievement-title-${index}`}>
                    {achievement.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}