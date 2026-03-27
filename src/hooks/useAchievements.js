import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const ACHIEVEMENT_DEFINITIONS = [
  { name: 'First Step', description: 'Complete your first habit', icon: '👣', condition_type: 'habits_completed', condition_value: 1, reward_coins: 10 },
  { name: 'Getting Started', description: 'Complete 10 habits', icon: '🌱', condition_type: 'habits_completed', condition_value: 10, reward_coins: 25 },
  { name: 'Week Warrior', description: 'Reach a 7-day streak', icon: '🔥', condition_type: 'streak', condition_value: 7, reward_coins: 50 },
  { name: 'Month Master', description: 'Reach a 30-day streak', icon: '👑', condition_type: 'streak', condition_value: 30, reward_coins: 200 },
  { name: 'City Planner', description: 'Own 5 buildings', icon: '🏗️', condition_type: 'buildings', condition_value: 5, reward_coins: 100 },
  { name: 'Skyscraper', description: 'Max out the floors on any building', icon: '🏢', condition_type: 'max_floors', condition_value: 1, reward_coins: 100 },
  { name: 'Golden Collection', description: 'Earn 5 golden stars', icon: '⭐', condition_type: 'golden_stars', condition_value: 5, reward_coins: 300 },
  { name: 'Decorator', description: 'Buy your first decoration', icon: '🎨', condition_type: 'decorations', condition_value: 1, reward_coins: 20 },
  { name: 'Coin Collector', description: 'Earn 500 coins total', icon: '💰', condition_type: 'total_coins', condition_value: 500, reward_coins: 50 },
  { name: 'Habit Machine', description: 'Complete 50 habits', icon: '⚙️', condition_type: 'habits_completed', condition_value: 50, reward_coins: 75 },
  { name: 'Century Club', description: 'Complete 100 habits', icon: '💯', condition_type: 'habits_completed', condition_value: 100, reward_coins: 150 },
  { name: 'Pet Parent', description: 'Get Parth to Level 5', icon: '🐯', condition_type: 'parth_level', condition_value: 5, reward_coins: 100 },
  { name: 'Tiger Tamer', description: 'Get Parth to Level 10', icon: '🐅', condition_type: 'parth_level', condition_value: 10, reward_coins: 200 },
  { name: 'Happy Tiger', description: "Max out Parth's happiness, hunger, and hygiene", icon: '😻', condition_type: 'parth_maxed', condition_value: 1, reward_coins: 50 },
  { name: 'Social Butterfly', description: "Visit another mayor's city", icon: '🦋', condition_type: 'cities_visited', condition_value: 1, reward_coins: 20 },
  { name: 'Generous Mayor', description: 'Send a gift to a friend', icon: '🎁', condition_type: 'gifts_sent', condition_value: 1, reward_coins: 30 },
  { name: 'Lucky Draw', description: 'Open a Mystery Chest', icon: '🎰', condition_type: 'chests_opened', condition_value: 1, reward_coins: 20 },
  { name: 'Bounty Hunter', description: 'Claim 10 daily bounties', icon: '🎯', condition_type: 'bounties_claimed', condition_value: 10, reward_coins: 75 },
  { name: 'Loyal Citizen', description: 'Log in for 7 days straight', icon: '📅', condition_type: 'login_streak', condition_value: 7, reward_coins: 100 },
  { name: 'Rising Star', description: 'Reach 1000 lifetime XP', icon: '🌟', condition_type: 'lifetime_xp', condition_value: 1000, reward_coins: 100 },
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
      max_floors: 0,
      golden_stars: 0
    };

    try {
      // 1. Building stats (Golden Stars & Max Floors)
      (buildings || []).forEach(b => {
        stats.golden_stars += (b.golden_stars || 0);
      });
      if (stats.golden_stars > 0) {
        stats.max_floors = 1; // Earning a star means maxing out floors
      }

      // 2. Profile stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('parth_level, parth_happiness, parth_hunger, parth_hygiene, login_streak, lifetime_xp')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        stats.parth_level = profile.parth_level || 1;
        stats.login_streak = profile.login_streak || 0;
        stats.lifetime_xp = profile.lifetime_xp || 0;
        stats.parth_maxed = (profile.parth_happiness >= 100 && profile.parth_hunger >= 100 && profile.parth_hygiene >= 100) ? 1 : 0;
      }

      // 3. Transactions (Coins & Mystery Chests)
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type, description')
        .eq('user_id', user.id);
        
      let totalCoinsEarned = 0;
      let chestsOpened = 0;
      
      if (transactions) {
         transactions.forEach(tx => {
           if (tx.type === 'earn') totalCoinsEarned += tx.amount;
           if (tx.description && tx.description.includes('Mystery Chest')) chestsOpened++;
         });
      }
      stats.total_coins = totalCoinsEarned;
      stats.chests_opened = chestsOpened;

      // 4. Gifts sent
      let giftsSent = 0;
      try {
        const { count: giftsCount } = await supabase
          .from('user_gifts')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', user.id);
        giftsSent = giftsCount || 0;
      } catch (e) {
        console.warn('Gifts track error', e);
      }
      stats.gifts_sent = giftsSent;

      // 5. Habits completed
      const { count: habits_completed } = await supabase
        .from('habit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('completed', true);
      stats.habits_completed = habits_completed || 0;

      // 6. Streaks
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

      // 7. Local Storage Tracking (Visits & Bounties)
      let totalVisits = parseInt(localStorage.getItem(`total_visits_${user.id}`) || '0');
      if (totalVisits === 0) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('daily_visits_') && key.endsWith(user.id)) {
            totalVisits += parseInt(localStorage.getItem(key) || '0');
          }
        }
      }
      stats.cities_visited = totalVisits;

      let totalBounties = parseInt(localStorage.getItem(`total_bounties_${user.id}`) || '0');
      stats.bounties_claimed = totalBounties;

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

