import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getHabitTheme } from '../components/CityBuildingSVG';

const BOUNTY_DB = [
  { id: 'any_3', title: 'Consistent Citizen', desc: 'Complete any 3 habits today', target: 3, reward: 10, type: 'complete_any' },
  { id: 'any_5', title: 'Super Citizen', desc: 'Complete any 5 habits today', target: 5, reward: 20, type: 'complete_any' },
  { id: 'early_bird', title: 'Early Bird', desc: 'Complete 2 habits before 10 AM', target: 2, reward: 15, type: 'early_bird' },
  { id: 'visit_city', title: 'Social Butterfly', desc: 'Visit a friend\'s city', target: 1, reward: 10, type: 'visit_friend' },
  { id: 'fitness_1', title: 'Get Moving', desc: 'Complete 1 Fitness habit', target: 1, reward: 10, type: 'complete_theme', theme: 'fitness' },
  { id: 'study_1', title: 'Bookworm', desc: 'Complete 1 Study habit', target: 1, reward: 10, type: 'complete_theme', theme: 'study' },
  { id: 'water_1', title: 'Stay Hydrated', desc: 'Complete 1 Water habit', target: 1, reward: 10, type: 'complete_theme', theme: 'water' },
  { id: 'earn_xp', title: 'Rising Star', desc: 'Complete a habit for XP', target: 1, reward: 5, type: 'earn_xp' }
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
  const [loading, setLoading] = useState(true);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const fetchBounties = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('daily_bounties, last_bounty_date, tiger_tokens, profile_views')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const today = getTodayString();
      setTigerTokens(data.tiger_tokens || 0);

      // Check if we need to generate new bounties for today
      if (data.last_bounty_date !== today || !data.daily_bounties || data.daily_bounties.length === 0) {
        // Generate 3 random unique bounties
        const shuffled = [...BOUNTY_DB].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3).map(b => ({
          ...b,
          is_claimed: false,
        }));

        const { data: updateData, error: updateErr } = await supabase
          .from('profiles')
          .update({
            daily_bounties: selected,
            last_bounty_date: today,
            // Reset daily tracking counters we might use
            daily_visits_made: 0
          })
          .eq('user_id', user.id)
          .select('daily_bounties, tiger_tokens')
          .single();

        if (updateErr) throw updateErr;
        setBounties(updateData.daily_bounties || []);
      } else {
        setBounties(data.daily_bounties || []);
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

  // Compute live progress for a bounty based on today's logs and data
  const calculateProgress = (bounty) => {
    let current = 0;
    
    if (bounty.type === 'complete_any') {
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
      // Simplistic check: if logs were created before 10 AM. We don't have exact log timestamps for completion in V1 easily available without querying created_at of logs, but let's just count total completed if the current time is < 10 AM, otherwise we just use the ones already done.
      // Better way: Check the actual habit_logs created_at timestamp.
      // For now, if current time < 10 AM, we just count completions.
      const hour = new Date().getHours();
      if (hour < 10) {
        current = Object.values(todayLogs).filter(l => l.completed).length;
      } else {
        // Fallback: assume any completed today was early if they have claimed it, but if they haven't claimed it by 10 AM we can't be sure in this simple implementation without fetching `created_at`. Let's just grant it if they completed it before 10. Once hour >= 10, they can't progress further.
        current = 0; // This means they must claim it before 10 AM!
      }
    }
    else if (bounty.type === 'earn_xp') {
      current = Object.values(todayLogs).filter(l => l.completed).length; // Same as completing a habit in basic terms
    }
    else if (bounty.type === 'visit_friend') {
      // For this, we'd need to track visits. This is slightly hard to compute from just todayLogs.
      // Let's assume progress is stored manually in another hook if we want. For now returning 0.
      const localVisits = parseInt(localStorage.getItem(`daily_visits_${getTodayString()}_${user?.id}`) || '0');
      current = localVisits;
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
    if (progress < bounty.target) return; // Cannot claim yet

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
    loading,
    calculateProgress,
    claimBounty
  };
};
