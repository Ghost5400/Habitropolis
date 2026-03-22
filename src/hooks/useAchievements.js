import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const ACHIEVEMENT_DEFINITIONS = [
  { name: 'First Step', description: 'Complete your first habit', icon: '👣', condition_type: 'habits_completed', condition_value: 1, reward_coins: 10 },
  { name: 'Getting Started', description: 'Complete 10 habits', icon: '🌱', condition_type: 'habits_completed', condition_value: 10, reward_coins: 25 },
  { name: 'Week Warrior', description: 'Reach a 7-day streak', icon: '🔥', condition_type: 'streak', condition_value: 7, reward_coins: 50 },
  { name: 'Month Master', description: 'Reach a 30-day streak', icon: '👑', condition_type: 'streak', condition_value: 30, reward_coins: 200 },
  { name: 'City Planner', description: 'Own 5 buildings', icon: '🏗️', condition_type: 'buildings', condition_value: 5, reward_coins: 100 },
  { name: 'Decorator', description: 'Buy your first decoration', icon: '🎨', condition_type: 'decorations', condition_value: 1, reward_coins: 20 },
  { name: 'Hydration Hero', description: 'Complete a counter habit 30 times', icon: '💧', condition_type: 'counter_completions', condition_value: 30, reward_coins: 75 },
  { name: 'Bad Habit Breaker', description: 'Resist a bad habit for 30 days', icon: '💪', condition_type: 'bad_habit_streak', condition_value: 30, reward_coins: 150 },
  { name: 'Coin Collector', description: 'Earn 500 coins total', icon: '💰', condition_type: 'total_coins', condition_value: 500, reward_coins: 50 },
  { name: 'Shield Master', description: 'Use 3 shields', icon: '🛡️', condition_type: 'shields_used', condition_value: 3, reward_coins: 30 },
];

export const useAchievements = () => {
  const { user } = useAuth();
  const { achievements, unlockedAchievements, unlockAchievement, buildings, ownedDecorations, coins } = useGame();

  const isUnlocked = (achievementId) => {
    return unlockedAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getProgress = (achievement, stats) => {
    if (!stats) return 0;
    const current = stats[achievement.condition_type] || 0;
    return Math.min(100, Math.round((current / achievement.condition_value) * 100));
  };

  const evaluateAll = async () => {
    if (!user || (achievements || []).length === 0) return;
    
    // Construct local tracking stats based on universal game properties
    const stats = {
      buildings: (buildings || []).length,
      decorations: (ownedDecorations || []).length,
    };

    try {
      // Fetch dynamic database counts perfectly optimized
      const { count: habits_completed } = await supabase
        .from('habit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);
      
      stats.habits_completed = habits_completed || 0;
      
      // Calculate total coins earned from transactions directly
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('type', 'earn');
      
      let totalCoinsEarned = 0;
      if (transactions) {
         totalCoinsEarned = transactions.reduce((sum, tx) => sum + tx.amount, 0);
      }
      stats.total_coins = totalCoinsEarned;

      // Better query to get highest streak among all habits
      const { data: streaksList } = await supabase
        .from('streaks')
        .select('best_streak, current_streak')
        .eq('user_id', user.id);
        
      let best_streak = 0;
      if (streaksList) {
        streaksList.forEach(s => { 
          if (s.best_streak > best_streak) best_streak = s.best_streak;
          if (s.current_streak > best_streak) best_streak = s.current_streak;
        });
      }
      stats.streak = best_streak;

      // Calculate max bad habit streak
      const { data: badHabitsList } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'bad_habit_stopper');
      
      let best_bad_habit_streak = 0;
      if (badHabitsList && badHabitsList.length > 0) {
        const badHabitIds = badHabitsList.map(h => h.id);
        const { data: badStreaks } = await supabase
          .from('streaks')
          .select('best_streak, current_streak')
          .in('habit_id', badHabitIds);
          
        if (badStreaks) {
          badStreaks.forEach(s => {
            if (s.best_streak > best_bad_habit_streak) best_bad_habit_streak = s.best_streak;
            if (s.current_streak > best_bad_habit_streak) best_bad_habit_streak = s.current_streak;
          });
        }
      }
      stats.bad_habit_streak = best_bad_habit_streak;

      // Count counter completions
      const { data: counterHabits } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('type', 'counter');
        
      let counter_completions = 0;
      if (counterHabits && counterHabits.length > 0) {
        const counterIds = counterHabits.map(h => h.id);
        const { count: cCount } = await supabase
          .from('habit_logs')
          .select('*', { count: 'exact', head: true })
          .in('habit_id', counterIds)
          .eq('completed', true);
        counter_completions = cCount || 0;
      }
      stats.counter_completions = counter_completions;

      // Count total shields used
      const { count: shieldsCount } = await supabase
        .from('shields')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      stats.shields_used = shieldsCount || 0;

      // Iteratively unlock any newly met threshold
      for (const achievement of achievements) {
        if (isUnlocked(achievement.id)) continue;
        const current = stats[achievement.condition_type] || 0;
        if (current >= achievement.condition_value) {
           await unlockAchievement(achievement.id);
        }
      }
    } catch (err) {
      console.error('Achievement evaluation engine error:', err);
    }
  };

  return {
    achievements,
    unlockedAchievements,
    isUnlocked,
    getProgress,
    evaluateAll,
  };
};
