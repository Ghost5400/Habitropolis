import { useGame } from '../contexts/GameContext';

export const ACHIEVEMENT_DEFINITIONS = [
  { name: 'First Step', description: 'Complete your first habit', icon: '👣', condition_type: 'habits_completed', condition_value: 1, reward_coins: 10 },
  { name: 'Getting Started', description: 'Complete 10 habits', icon: '🌱', condition_type: 'habits_completed', condition_value: 10, reward_coins: 25 },
  { name: 'Week Warrior', description: 'Reach a 7-day streak', icon: '🔥', condition_type: 'streak', condition_value: 7, reward_coins: 50 },
  { name: 'Month Master', description: 'Reach a 30-day streak', icon: '👑', condition_type: 'streak', condition_value: 30, reward_coins: 200 },
  { name: 'City Planner', description: 'Own 5 buildings', icon: '🏗️', condition_type: 'buildings', condition_value: 5, reward_coins: 100 },
  { name: 'Skyscraper', description: 'Reach max floors on a building', icon: '🏢', condition_type: 'max_floors', condition_value: 1, reward_coins: 100 },
  { name: 'Golden Collection', description: 'Earn 5 golden stars', icon: '⭐', condition_type: 'golden_stars', condition_value: 5, reward_coins: 300 },
  { name: 'Decorator', description: 'Buy your first decoration', icon: '🎨', condition_type: 'decorations', condition_value: 1, reward_coins: 20 },
  { name: 'Hydration Hero', description: 'Complete a counter habit 30 times', icon: '💧', condition_type: 'counter_completions', condition_value: 30, reward_coins: 75 },
  { name: 'Bad Habit Breaker', description: 'Resist a bad habit for 30 days', icon: '💪', condition_type: 'bad_habit_streak', condition_value: 30, reward_coins: 150 },
  { name: 'Coin Collector', description: 'Earn 500 coins total', icon: '💰', condition_type: 'total_coins', condition_value: 500, reward_coins: 50 },
  { name: 'Shield Master', description: 'Use 3 shields', icon: '🛡️', condition_type: 'shields_used', condition_value: 3, reward_coins: 30 },
];

export const useAchievements = () => {
  const { achievements, unlockedAchievements, unlockAchievement } = useGame();

  const isUnlocked = (achievementId) => {
    return unlockedAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getProgress = (achievement, stats) => {
    if (!stats) return 0;
    const current = stats[achievement.condition_type] || 0;
    return Math.min(100, Math.round((current / achievement.condition_value) * 100));
  };

  const checkAndUnlock = async (stats) => {
    for (const achievement of achievements) {
      if (isUnlocked(achievement.id)) continue;
      const current = stats[achievement.condition_type] || 0;
      if (current >= achievement.condition_value) {
        await unlockAchievement(achievement.id);
      }
    }
  };

  return {
    achievements,
    unlockedAchievements,
    isUnlocked,
    getProgress,
    checkAndUnlock,
  };
};
