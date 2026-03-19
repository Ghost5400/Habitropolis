import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { useStreaks } from '../hooks/useStreaks';
import { useGame } from '../contexts/GameContext';
import { BarChart3, Flame, Target, TrendingUp, Calendar } from 'lucide-react';
import './StatsPage.css';

export default function StatsPage() {
  const { user } = useAuth();
  const { habits } = useHabits();
  const { streaks } = useStreaks();
  const { coins, buildings } = useGame();
  const [logs, setLogs] = useState([]);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    if (user) fetchLogs();
  }, [user, period]);

  const fetchLogs = async () => {
    const daysBack = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const startDate = new Date(Date.now() - daysBack * 86400000).toISOString().split('T')[0];

    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .order('date', { ascending: true });

    setLogs(data || []);
  };

  const completedLogs = logs.filter(l => l.completed);
  const completionRate = logs.length > 0
    ? Math.round((completedLogs.length / logs.length) * 100)
    : 0;

  const bestStreak = Object.values(streaks).reduce(
    (max, s) => Math.max(max, s.best_streak || 0), 0
  );

  const currentStreaks = Object.values(streaks)
    .filter(s => s.current_streak > 0)
    .sort((a, b) => b.current_streak - a.current_streak);

  const totalStars = buildings.reduce((sum, b) => sum + (b.golden_stars || 0), 0);

  // Heatmap data — last 90 days
  const heatmapData = {};
  for (let i = 0; i < 90; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    heatmapData[date] = 0;
  }
  logs.forEach(log => {
    if (log.completed && heatmapData.hasOwnProperty(log.date)) {
      heatmapData[log.date]++;
    }
  });

  // Daily completions for mini bar chart
  const dailyData = {};
  const daysBack = period === 'week' ? 7 : period === 'month' ? 30 : 12;
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    dailyData[date] = 0;
  }
  completedLogs.forEach(log => {
    if (dailyData.hasOwnProperty(log.date)) {
      dailyData[log.date]++;
    }
  });
  const maxDaily = Math.max(1, ...Object.values(dailyData));

  return (
    <div className="stats-page">
      <div className="stats-header">
        <div className="stats-title-row">
          <BarChart3 size={32} className="stats-icon" />
          <h1>Statistics</h1>
        </div>

        <div className="period-selector">
          {['week', 'month', 'year'].map(p => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-overview">
        <div className="stat-card glass-sm">
          <Target size={24} className="stat-icon" />
          <div className="stat-value">{completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
        <div className="stat-card glass-sm">
          <Flame size={24} className="stat-icon fire" />
          <div className="stat-value">{bestStreak}</div>
          <div className="stat-label">Best Streak</div>
        </div>
        <div className="stat-card glass-sm">
          <TrendingUp size={24} className="stat-icon" />
          <div className="stat-value">{completedLogs.length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card glass-sm">
          <Calendar size={24} className="stat-icon" />
          <div className="stat-value">{totalStars}⭐</div>
          <div className="stat-label">Golden Stars</div>
        </div>
      </div>

      {/* Mini Bar Chart */}
      <div className="chart-section glass">
        <h3>Daily Completions</h3>
        <div className="bar-chart">
          {Object.entries(dailyData).reverse().map(([date, count]) => (
            <div key={date} className="bar-col">
              <div
                className="bar-fill"
                style={{ height: `${(count / maxDaily) * 100}%` }}
              />
              <div className="bar-label">
                {new Date(date + 'T00:00:00').toLocaleDateString('en', {
                  weekday: 'short',
                }).slice(0, 2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="heatmap-section glass">
        <h3>Activity Heatmap (90 days)</h3>
        <div className="heatmap">
          {Object.entries(heatmapData).reverse().map(([date, count]) => {
            let intensity = 0;
            if (count >= 5) intensity = 4;
            else if (count >= 3) intensity = 3;
            else if (count >= 2) intensity = 2;
            else if (count >= 1) intensity = 1;

            return (
              <div
                key={date}
                className={`heatmap-cell level-${intensity}`}
                title={`${date}: ${count} completed`}
              />
            );
          })}
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          <div className="heatmap-cell level-0" />
          <div className="heatmap-cell level-1" />
          <div className="heatmap-cell level-2" />
          <div className="heatmap-cell level-3" />
          <div className="heatmap-cell level-4" />
          <span>More</span>
        </div>
      </div>

      {/* Streak Leaderboard */}
      <div className="streak-board glass">
        <h3>🔥 Active Streaks</h3>
        {currentStreaks.length === 0 ? (
          <p className="text-muted">No active streaks yet. Start completing habits!</p>
        ) : (
          <div className="streak-list">
            {currentStreaks.map((streak, i) => {
              const habit = habits.find(h => h.id === streak.habit_id);
              return (
                <div key={streak.habit_id} className="streak-item">
                  <span className="streak-rank">#{i + 1}</span>
                  <span className="streak-name">{habit?.name || 'Unknown'}</span>
                  <span className="streak-value">
                    {streak.current_streak} day{streak.current_streak !== 1 ? 's' : ''} 🔥
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
