import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useStreaks = () => {
  const { user } = useAuth();
  const [streaks, setStreaks] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchStreaks = async () => {
    if (!user) {
      setStreaks({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const streaksMap = {};
      (data || []).forEach(s => {
        streaksMap[s.habit_id] = s;
      });
      setStreaks(streaksMap);
    } catch (err) {
      console.error('Error fetching streaks:', err);
      setStreaks({});
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async (habitId, completed) => {
    if (!user) return;

    try {
      const existing = streaks[habitId];
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let newStreak = 0;
      let bestStreak = existing?.best_streak || 0;

      if (completed) {
        if (existing?.last_completed_at === yesterday || existing?.last_completed_at === today) {
          newStreak = (existing?.current_streak || 0) + (existing?.last_completed_at === today ? 0 : 1);
        } else if (!existing?.last_completed_at) {
          newStreak = 1;
        } else {
          // Check for shield
          const { data: shieldData } = await supabase
            .from('shields')
            .select('*')
            .eq('habit_id', habitId)
            .eq('user_id', user.id)
            .gt('remaining_days', 0)
            .single();

          if (shieldData) {
            newStreak = (existing?.current_streak || 0) + 1;
            await supabase
              .from('shields')
              .update({ remaining_days: shieldData.remaining_days - 1 })
              .eq('id', shieldData.id);
          } else {
            newStreak = 1;
          }
        }
        bestStreak = Math.max(bestStreak, newStreak);
      } else {
        newStreak = existing?.current_streak || 0;
      }

      const { data, error } = await supabase
        .from('streaks')
        .upsert(
          {
            habit_id: habitId,
            user_id: user.id,
            current_streak: newStreak,
            best_streak: bestStreak,
            last_completed_at: completed ? today : existing?.last_completed_at,
          },
          { onConflict: 'habit_id,user_id' }
        )
        .select()
        .single();

      if (error) throw error;

      setStreaks(prev => ({ ...prev, [habitId]: data }));
      return data;
    } catch (err) {
      console.error('Error updating streak:', err);
    }
  };

  const buyShield = async (habitId, days, cost) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('shields').insert({
        habit_id: habitId,
        user_id: user.id,
        remaining_days: days,
        activated_at: new Date().toISOString(),
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error buying shield:', err);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchStreaks();
    } else {
      setStreaks({});
      setLoading(false);
    }
  }, [user]);

  return { streaks, loading, fetchStreaks, updateStreak, buyShield };
};