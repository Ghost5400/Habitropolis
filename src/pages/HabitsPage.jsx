import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useStreaks } from '../hooks/useStreaks';
import HabitCard from '../components/HabitCard';
import { useGame } from '../contexts/GameContext';
import { useCity } from '../hooks/useCity';
import { useCoins } from '../hooks/useCoins';
import soundManager from '../lib/SoundManager';
import { Plus, Target } from 'lucide-react';
import './HabitsPage.css';

export default function HabitsPage() {
  const navigate = useNavigate();
  const { habits, todayLogs, loading, completeHabit, deleteHabit } = useHabits();
  const { streaks, updateStreak } = useStreaks();
  const { addCoins, addWeeklyXP } = useGame();
  const { growBuilding } = useCity();
  const { getCoinReward } = useCoins();
  const [filter, setFilter] = useState('all');

  // Bonus XP for habit completion (on top of coins)
  const getHabitXP = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 10;
      case 'medium': return 20;
      case 'hard': return 35;
      default: return 10;
    }
  };

  const filtered = filter === 'all'
    ? habits
    : habits.filter(h => h.frequency === filter);

  const handleComplete = async (habit) => {
    const result = await completeHabit(habit.id);
    if (result.alreadyDone) return; // Already completed, no action
    if (result.completed) {
      soundManager.playSuccess();
      const reward = getCoinReward(habit.difficulty);
      await addCoins(reward, `Completed: ${habit.name}`);
      // Bonus XP for habit completion (coins already give XP via addCoins)
      await addWeeklyXP(getHabitXP(habit.difficulty));
      soundManager.playCoinEarn();
      await updateStreak(habit.id, true);
      await growBuilding(habit.id, habit.frequency);
    } else {
      await updateStreak(habit.id, false);
    }
  };

  const handleDelete = async (habitId) => {
    if (confirm('Delete this habit? This will also remove its building.')) {
      await deleteHabit(habitId);
    }
  };

  if (loading) {
    return <div className="dashboard-loading"><div className="loading-spinner" />Loading habits...</div>;
  }

  return (
    <div className="habits-page">
      <div className="habits-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Target size={28} />
          <h1>My Habits</h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="filter-tabs">
            {['all', 'daily', 'weekly', 'monthly'].map(f => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <button className="btn btn-primary" onClick={() => navigate('/habits/new')}>
            <Plus size={18} />
            New Habit
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state glass">
          <Target size={48} className="empty-icon" />
          <h3>{filter === 'all' ? 'No habits yet' : `No ${filter} habits`}</h3>
          <p>Create your first habit to start building your city!</p>
          <button className="btn btn-primary" onClick={() => navigate('/habits/new')}>
            <Plus size={18} /> Create Habit
          </button>
        </div>
      ) : (
        <div className="habits-list">
          {filtered.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              todayLog={todayLogs[habit.id]}
              streak={streaks[habit.id]}
              onComplete={() => handleComplete(habit)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}