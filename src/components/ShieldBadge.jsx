import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useHabits } from '../hooks/useHabits';
import './ShieldBadge.css';

export default function ShieldBadge({ habitId }) {
  const { user } = useAuth();
  const [shield, setShield] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getHabitById } = useHabits();

  useEffect(() => {
    if (!user || !habitId) {
      setLoading(false);
      return;
    }

    const fetchShield = async () => {
      try {
        const { data, error } = await supabase
          .from('shields')
          .select('*')
          .eq('habit_id', habitId)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
          throw error;
        }
        setShield(data || null);
      } catch (err) {
        console.error('Error fetching shield:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchShield();
  }, [user, habitId]);

  if (loading) {
    return <div className="shield-loading">...</div>;
  }

  if (!shield || shield.remaining_days <= 0) {
    return <div className="shield-empty">No shield active</div>;
  }

  return (
    <div className="shield-badge glass">
      <div className="shield-icon">🛡️</div>
      <div className="shield-info">
        <div className="shield-text">Shield Active</div>
        <div className="shield-days">{shield.remaining_days} day{shield.remaining_days !== 1 ? 's' : ''} left</div>
      </div>
    </div>
  );
}