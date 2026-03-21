import { useEffect, useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useStreaks } from '../hooks/useStreaks';
import { useGame } from '../contexts/GameContext';
import { useCity } from '../hooks/useCity';
import { useCoins } from '../hooks/useCoins';
import QuoteBanner from '../components/QuoteBanner';
import HabitCard from '../components/HabitCard';
import { scheduleHabitReminders, registerServiceWorker, requestNotificationPermission } from '../lib/notifications';
import { Target, Flame, Coins, Building2 } from 'lucide-react';
import './DashboardPage.css';

export default function DashboardPage() {
  const { habits, todayLogs, loading, completeHabit, fetchHabits } = useHabits();
  const { streaks, updateStreak } = useStreaks();
  const { coins } = useGame();
  const { growBuilding } = useCity();
  const { getCoinReward } = useCoins();
  const { addCoins } = useGame();

  useEffect(() => {
    registerServiceWorker();
    setTimeout(() => {
      requestNotificationPermission();
    }, 3000);
    if (habits.length > 0) {
      scheduleHabitReminders(habits);
    }
  }, [habits]);

  const completedToday = Object.values(todayLogs).filter(l => l.completed).length;
  const bestStreak = Object.values(streaks).reduce(
    (max, s) => Math.max(max, s.current_streak || 0), 0
  );

  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  const weeklyHabits = habits.filter(h => h.frequency === 'weekly');
  const monthlyHabits = habits.filter(h => h.frequency === 'monthly');

  const handleComplete = async (habit) => {
    try {
      const result = await completeHabit(habit.id);

      if (result.completed) {
        // Award coins
        const reward = getCoinReward(habit.difficulty);
        await addCoins(reward, `Completed: ${habit.name}`);

        // Update streak
        await updateStreak(habit.id, true);

        // Grow building
        await growBuilding(habit.id, habit.frequency);
      } else {
        await updateStreak(habit.id, false);
      }
    } catch (err) {
      console.error('Error completing habit:', err);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <p>Loading your habitropolis...</p>
      </div>
    );
  }

  const renderHabitSection = (title, habitList) => {
    if (habitList.length === 0) return null;
    return (
      <div className="habits-section">
        <h2 className="section-title">{title}</h2>
        <div className="habits-grid">
          {habitList.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              todayLog={todayLogs[habit.id]}
              streak={streaks[habit.id]}
              onComplete={() => handleComplete(habit)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <QuoteBanner />

      <div className="dashboard-stats tour-dashboard-stats">
        <div className="stat-card glass-sm">
          <Target size={22} className="stat-icon" />
          <div>
            <div className="stat-value">{habits.length}</div>
            <div className="stat-label">Habits</div>
          </div>
        </div>
        <div className="stat-card glass-sm">
          <div className="stat-icon check-icon">✅</div>
          <div>
            <div className="stat-value">{completedToday}/{habits.length}</div>
            <div className="stat-label">Today</div>
          </div>
        </div>
        <div className="stat-card glass-sm">
          <Flame size={22} className="stat-icon fire" />
          <div>
            <div className="stat-value">{bestStreak}</div>
            <div className="stat-label">Best Streak</div>
          </div>
        </div>
        <div className="stat-card glass-sm">
          <Coins size={22} className="stat-icon coin" />
          <div>
            <div className="stat-value">{coins}</div>
            <div className="stat-label">Coins</div>
          </div>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="empty-state glass">
          <Building2 size={48} className="empty-icon" />
          <h3>Welcome to Habitropolis!</h3>
          <p>Click <strong>"NEW HABIT"</strong> in the quote above to start building your city of good habits.</p>
        </div>
      ) : (
        <>
          {renderHabitSection('📅 Daily Habits', dailyHabits)}
          {renderHabitSection('📆 Weekly Habits', weeklyHabits)}
          {renderHabitSection('🗓️ Monthly Habits', monthlyHabits)}
        </>
      )}
    </div>
  );
}