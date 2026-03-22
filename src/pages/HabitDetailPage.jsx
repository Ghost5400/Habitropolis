import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHabits } from '../hooks/useHabits';
import { useStreaks } from '../hooks/useStreaks';
import { useCity } from '../hooks/useCity';
import { ArrowLeft, Flame, CalendarDays, Trash2, Edit3, Shield } from 'lucide-react';
import './HabitDetailPage.css';

export default function HabitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getHabitById, getHabitLogs, deleteHabit } = useHabits();
  const { streaks } = useStreaks();
  const { getBuildingForHabit } = useCity();
  const [habit, setHabit] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const habitData = await getHabitById(id);
      setHabit(habitData);

      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      const logsData = await getHabitLogs(id, ninetyDaysAgo, today);
      setLogs(logsData);
    } catch (err) {
      console.error('Error loading habit detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this habit and its building? This cannot be undone.')) {
      await deleteHabit(id);
      navigate('/habits');
    }
  };

  if (loading) {
    return <div className="dashboard-loading"><div className="loading-spinner" />Loading...</div>;
  }

  if (!habit) {
    return (
      <div className="empty-state glass">
        <h3>Habit not found</h3>
        <button className="btn btn-primary" onClick={() => navigate('/habits')}>Back to Habits</button>
      </div>
    );
  }

  const building = getBuildingForHabit(id);
  const completedLogs = logs.filter(l => l.completed);

  // Build heatmap
  const heatmap = {};
  for (let i = 0; i < 90; i++) {
    const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    heatmap[date] = false;
  }
  logs.forEach(log => {
    if (log.completed && heatmap.hasOwnProperty(log.date)) {
      heatmap[log.date] = true;
    }
  });

  return (
    <div className="habit-detail-page">
      <button className="back-btn" onClick={() => navigate('/habits')}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className="detail-header glass">
        <div className="detail-info">
          <h1 style={{ color: habit.color || 'var(--accent-primary)' }}>{habit.name}</h1>
          <div className="detail-tags">
            <span className="tag">{habit.type.replace('_', ' ')}</span>
            <span className="tag">{habit.frequency}</span>
            <span className="tag">{habit.difficulty}</span>
          </div>
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/habits/${id}/edit`)}>
            <Edit3 size={16} /> Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="detail-cards">
        <div className="detail-card glass-sm">
          <Flame size={24} className="fire" />
          <div className="detail-card-value">{streak?.current_streak || 0}</div>
          <div className="detail-card-label">Current Streak</div>
        </div>
        <div className="detail-card glass-sm">
          <Flame size={24} style={{ color: 'var(--accent-gold)' }} />
          <div className="detail-card-value">{streak?.best_streak || 0}</div>
          <div className="detail-card-label">Best Streak</div>
        </div>
        <div className="detail-card glass-sm">
          <CalendarDays size={24} />
          <div className="detail-card-value">{completedLogs.length}</div>
          <div className="detail-card-label">Completions</div>
        </div>
      </div>

      <div className="detail-heatmap glass">
        <h3>90-Day History</h3>
        <div className="heatmap">
          {Object.entries(heatmap).reverse().map(([date, done]) => (
            <div
              key={date}
              className={`heatmap-cell ${done ? 'level-4' : 'level-0'}`}
              title={`${date}: ${done ? 'Completed ✅' : 'Missed'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}