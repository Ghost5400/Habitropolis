import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useHabits = () => {
  const { user } = useAuth();
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const fetchHabits = async () => {
    if (!user) {
      setHabits([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('date', today),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (logsRes.error) throw logsRes.error;

      setHabits(habitsRes.data || []);

      const logsMap = {};
      (logsRes.data || []).forEach(log => {
        logsMap[log.habit_id] = log;
      });
      setTodayLogs(logsMap);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching habits:', err);
    } finally {
      setLoading(false);
    }
  };

  const createHabit = async (habitData) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('habits')
      .insert({ ...habitData, user_id: user.id })
      .select()
      .single();

    if (error) throw error;

    // Create the building for this habit
    await supabase.from('city_buildings').insert({
      habit_id: data.id,
      user_id: user.id,
      decorations: [],
    });

    // Create initial streak
    await supabase.from('streaks').insert({
      habit_id: data.id,
      user_id: user.id,
      current_streak: 0,
      best_streak: 0,
    });

    await fetchHabits();
    return data;
  };

  const updateHabit = async (id, updates) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    await fetchHabits();
    return data;
  };

  const deleteHabit = async (id) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    await fetchHabits();
  };

  const getHabitById = async (id) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  };

  const completeHabit = async (habitId, value = 1) => {
    if (!user) throw new Error('User not authenticated');

    const existingLog = todayLogs[habitId];
    const habit = habits.find(h => h.id === habitId);
    if (!habit) throw new Error('Habit not found');

    let newValue = value;
    let newCompleted = false;

    if (habit.type === 'counter') {
      newValue = (existingLog?.value || 0) + 1;
      newCompleted = newValue >= (habit.target_value || 1);
    } else if (habit.type === 'timer') {
      newCompleted = true;
      newValue = habit.target_value || 1;
    } else {
      // goal or bad_habit_stopper — once completed, stay completed (prevent coin glitch)
      if (existingLog?.completed) {
        // Already completed today — do nothing, return current state
        return { completed: true, value: existingLog.value, alreadyDone: true };
      }
      newCompleted = true;
      newValue = 1;
    }

    if (existingLog) {
      await supabase
        .from('habit_logs')
        .update({ completed: newCompleted, value: newValue })
        .eq('id', existingLog.id);
    } else {
      await supabase.from('habit_logs').insert({
        habit_id: habitId,
        user_id: user.id,
        date: today,
        completed: newCompleted,
        value: newValue,
      });
    }

    await fetchHabits();
    return { completed: newCompleted, value: newValue };
  };

  const getHabitLogs = async (habitId, startDate, endDate) => {
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', user.id);

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query.order('date', { ascending: true });
    if (error) throw error;
    return data || [];
  };

  useEffect(() => {
    if (user) {
      fetchHabits();
    } else {
      setHabits([]);
      setTodayLogs({});
      setLoading(false);
    }
  }, [user]);

  return {
    habits,
    todayLogs,
    loading,
    error,
    fetchHabits,
    createHabit,
    updateHabit,
    deleteHabit,
    getHabitById,
    completeHabit,
    getHabitLogs,
  };
};