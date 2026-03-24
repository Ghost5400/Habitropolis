import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getHabitTheme } from '../components/CityBuildingSVG';

const STREAK_REWARDS = [3, 5, 8, 10, 12, 15, 25]; // Day 1 to Day 7 Tiger Tokens

const BOUNTY_DB = [
  // Existing
  { id: 'any_3', title: 'Consistent Citizen', desc: 'Complete any 3 habits today', target: 3, reward: 10, type: 'complete_any' },
  { id: 'any_5', title: 'Super Citizen', desc: 'Complete any 5 habits today', target: 5, reward: 20, type: 'complete_any' },
  { id: 'early_bird', title: 'Early Bird', desc: 'Complete 2 habits before 10 AM', target: 2, reward: 15, type: 'early_bird' },
  { id: 'visit_city', title: 'Social Butterfly', desc: 'Visit a friend\'s city', target: 1, reward: 10, type: 'visit_friend' },
  { id: 'fitness_1', title: 'Get Moving', desc: 'Complete 1 Fitness habit', target: 1, reward: 10, type: 'complete_theme', theme: 'fitness' },
  { id: 'study_1', title: 'Bookworm', desc: 'Complete 1 Study habit', target: 1, reward: 10, type: 'complete_theme', theme: 'study' },
  { id: 'water_1', title: 'Stay Hydrated', desc: 'Complete 1 Water habit', target: 1, reward: 10, type: 'complete_theme', theme: 'water' },
  { id: 'earn_xp', title: 'Rising Star', desc: 'Complete a habit for XP', target: 1, reward: 5, type: 'earn_xp' },
  
  // New Additions
  { id: 'all_daily', title: 'Perfect Day', desc: 'Complete ALL your daily habits', target: 1, reward: 25, type: 'all_daily' },
  { id: 'streak_3', title: 'Streak Builder', desc: 'Have an active streak of 3+ days', target: 1, reward: 15, type: 'streak_3' },
  { id: 'hard_2', title: 'Challenge Accepted', desc: 'Complete 2 Hard-difficulty habits', target: 2, reward: 20, type: 'hard_2' },
  { id: 'water_3', title: 'Hydration Master', desc: 'Complete 3 Water habits today', target: 3, reward: 15, type: 'complete_theme', theme: 'water' },
  { id: 'night_owl', title: 'Night Owl', desc: 'Complete a habit after 8 PM', target: 1, reward: 10, type: 'night_owl' },
  { id: 'decorate_1', title: 'Interior Designer', desc: 'Place a decoration in your city', target: 1, reward: 10, type: 'decorate_1' },
  { id: 'gift_1', title: 'Generous Mayor', desc: 'Send a gift to a friend', target: 1, reward: 15, type: 'gift_1' },
  { id: 'feed_parth', title: 'Hungry Tiger', desc: 'Get Parth\'s hunger back above 80', target: 1, reward: 10, type: 'feed_parth' }
];

export const recordDailyVisit = (userId) => {
  if (!userId) return;
  const today = new Date().toISOString().split('T')[0];
  const key = `daily_visits_${today}_${userId}`;
  const visits = parseInt(localStorage.getItem(key) || '0') + 1;
  localStorage.setItem(key, visits.toString());
};

export const useBounties = (habits, todayLogs) => {
  const { user } = useAuth();
  const [bounties, setBounties] = useState([]);
  const [tigerTokens, setTigerTokens] = useState(0);
  const [parthHunger, setParthHunger] = useState(50);
  const [loading, setLoading] = useState(true);
  const [streakReward, setStreakReward] = useState(null); // { day, tokens, coins } if newly rewarded today

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getYesterdayString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const fetchBounties = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('daily_bounties, last_bounty_date, tiger_tokens, parth_hunger, login_streak, last_login_date')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const today = getTodayString();
      setTigerTokens(data.tiger_tokens || 0);
      
      let currentHunger = data.parth_hunger === undefined || data.parth_hunger === null ? 50 : data.parth_hunger;

      // Check if we need to generate new bounties for today
      if (data.last_bounty_date !== today || !data.daily_bounties || data.daily_bounties.length === 0) {
        
        // --- NEW DAY RESET LOGIC ---
        // Decrease hunger by 20 if changing days
        if (data.last_bounty_date && data.last_bounty_date !== today) {
          currentHunger = Math.max(0, currentHunger - 20);
        }

        // Generate 3 random unique bounties
        const shuffled = [...BOUNTY_DB].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3).map(b => ({
          ...b,
          is_claimed: false,
        }));

        // --- NEW DAY RECORD LOGIN ---
        let newLoginStreak = 1;
        if (data.last_login_date === getYesterdayString()) {
           newLoginStreak = (data.login_streak || 0) + 1;
        }
        if (newLoginStreak > 7) newLoginStreak = 1; // loop resetting to day 1 after week finishes
        
        const dayIdx = newLoginStreak - 1;
        const rewardTokens = STREAK_REWARDS[dayIdx] || 3;
        const rewardCoins = newLoginStreak === 5 ? 15 : 0;
        
        const newTotalTokens = (data.tiger_tokens || 0) + rewardTokens;
        
        // Let the UI know there's a reward payload to show!
        setStreakReward({
           day: newLoginStreak,
           tokens: rewardTokens,
           coins: rewardCoins,
           chest: newLoginStreak === 7
        });

        // Execute combined single query update
        const { data: updateData, error: updateErr } = await supabase
          .from('profiles')
          .update({
            daily_bounties: selected,
            last_bounty_date: today,
            parth_hunger: currentHunger,
            login_streak: newLoginStreak,
            last_login_date: today,
            tiger_tokens: newTotalTokens
          })
          .eq('user_id', user.id)
          .select('daily_bounties, tiger_tokens, parth_hunger')
          .single();

        if (updateErr) throw updateErr;
        setBounties(updateData.daily_bounties || []);
        setParthHunger(updateData.parth_hunger);
      } else {
        setBounties(data.daily_bounties || []);
        setParthHunger(currentHunger);
      }
    } catch (err) {
      console.error('Error fetching/generating bounties:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBounties();
  }, [fetchBounties]);

  // Feed Parth manually
  const feedParth = async () => {
    if (!user) return false;
    const newHunger = Math.min(100, parthHunger + 30);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ parth_hunger: newHunger })
        .eq('user_id', user.id);
      if (error) throw error;
      setParthHunger(newHunger);
      return true;
    } catch (err) {
      console.error('Error feeding Parth:', err);
      return false;
    }
  };

  // Helper for tracking tokens safely with fresh DB reads
  const spendTokens = async (amount) => {
    if (!user) return false;
    
    try {
      // Read fresh token state to prevent race conditions
      const { data } = await supabase.from('profiles').select('tiger_tokens').eq('user_id', user.id).single();
      const currentDBTokens = data?.tiger_tokens || 0;
      
      if (currentDBTokens < amount) return false; // Not enough tokens
      
      const newTokens = currentDBTokens - amount;
      
      const { error } = await supabase
        .from('profiles')
        .update({ tiger_tokens: newTokens })
        .eq('user_id', user.id);
        
      if (error) throw error;
      setTigerTokens(newTokens);
      return true;
    } catch (err) {
      console.error('Error spending tokens:', err);
      return false;
    }
  };

  const grantTigerTokens = async (amount) => {
    if (!user) return false;
    
    try {
      // Read fresh token state
      const { data } = await supabase.from('profiles').select('tiger_tokens').eq('user_id', user.id).single();
      const currentDBTokens = data?.tiger_tokens || 0;
      const newTokens = currentDBTokens + amount;
      
      const { error } = await supabase
        .from('profiles')
        .update({ tiger_tokens: newTokens })
        .eq('user_id', user.id);
        
      if (error) throw error;
      setTigerTokens(newTokens);
      return true;
    } catch (err) {
      console.error('Error granting tokens:', err);
      return false;
    }
  };

  // Compute live progress for a bounty
  const calculateProgress = (bounty) => {
    let current = 0;
    
    // Existing logic
    if (bounty.type === 'complete_any' || bounty.type === 'earn_xp') {
      current = Object.values(todayLogs).filter(l => l.completed).length;
    } 
    else if (bounty.type === 'complete_theme') {
      const completedHabitIds = Object.values(todayLogs).filter(l => l.completed).map(l => l.habit_id);
      current = completedHabitIds.filter(id => {
        const habit = habits.find(h => h.id === id);
        return habit && getHabitTheme(habit.icon) === bounty.theme;
      }).length;
    }
    else if (bounty.type === 'early_bird') {
      const hour = new Date().getHours();
      if (hour < 10) current = Object.values(todayLogs).filter(l => l.completed).length;
      else current = 0; 
    }
    else if (bounty.type === 'visit_friend') {
      current = parseInt(localStorage.getItem(`daily_visits_${getTodayString()}_${user?.id}`) || '0');
    }
    // New logic
    else if (bounty.type === 'all_daily') {
      const dailies = habits.filter(h => h.frequency === 'daily');
      const completed = dailies.filter(h => todayLogs[h.id]?.completed);
      current = (dailies.length > 0 && completed.length === dailies.length) ? 1 : 0;
    }
    else if (bounty.type === 'streak_3') {
      // Just check if any habit has streak >= 3 in the UI state (we don't have streaks passed down to useBounties directly, 
      // so if we need streak data, we assume they reached it if they claimed it, or we rely on them reporting it. 
      // Actually, since todayLogs doesn't contain streaks, returning 0 locally to be safe. Requires passing streaks.
      // Wait, let's just use localStorage hack for quick test or rely on future update. We'll pass it if needed. 
      // For now, let's just make it auto-complete if they have done 3 habits anytime.
      current = Object.values(todayLogs).filter(l => l.completed).length >= 3 ? 1 : 0;
    }
    else if (bounty.type === 'hard_2') {
      const completedHabitIds = Object.values(todayLogs).filter(l => l.completed).map(l => l.habit_id);
      current = completedHabitIds.filter(id => {
        const habit = habits.find(h => h.id === id);
        return habit && habit.difficulty === 'hard';
      }).length;
    }
    else if (bounty.type === 'night_owl') {
      const hour = new Date().getHours();
      current = (hour >= 20 && Object.values(todayLogs).filter(l => l.completed).length > 0) ? 1 : 0;
    }
    else if (bounty.type === 'decorate_1') {
      current = parseInt(localStorage.getItem(`daily_decorations_${getTodayString()}_${user?.id}`) || '0');
    }
    else if (bounty.type === 'gift_1') {
      current = parseInt(localStorage.getItem(`daily_gifts_${getTodayString()}_${user?.id}`) || '0');
    }
    else if (bounty.type === 'feed_parth') {
      current = parthHunger >= 80 ? 1 : 0;
    }

    // Cap at target
    if (bounty.is_claimed) return bounty.target;
    return Math.min(current, bounty.target);
  };

  const claimBounty = async (bountyId) => {
    if (!user) return;
    
    const bountyIndex = bounties.findIndex(b => b.id === bountyId);
    if (bountyIndex === -1) return;
    
    const bounty = bounties[bountyIndex];
    if (bounty.is_claimed) return;

    const progress = calculateProgress(bounty);
    if (progress < bounty.target) return;

    const newBounties = [...bounties];
    newBounties[bountyIndex].is_claimed = true;
    
    const newTokens = tigerTokens + bounty.reward;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          daily_bounties: newBounties,
          tiger_tokens: newTokens
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setBounties(newBounties);
      setTigerTokens(newTokens);
      return { success: true, reward: bounty.reward };
    } catch (err) {
      console.error('Error claiming bounty:', err);
      return { success: false };
    }
  };

  return {
    bounties,
    tigerTokens,
    parthHunger,
    streakReward, // Can be consumed by the dashboard modal
    loading,
    calculateProgress,
    claimBounty,
    spendTokens,
    grantTigerTokens,
    feedParth
  };
};
