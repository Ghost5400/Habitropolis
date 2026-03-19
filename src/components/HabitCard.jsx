import { useState } from 'react';
import Timer from './Timer';
import Counter from './Counter';
import { Flame, Shield, CheckCircle2, Circle, Ban, Trash2 } from 'lucide-react';
import './HabitCard.css';

const TYPE_LABELS = {
  goal: { label: 'Goal', emoji: '🎯' },
  timer: { label: 'Timer', emoji: '⏱️' },
  counter: { label: 'Counter', emoji: '💧' },
  bad_habit_stopper: { label: 'Break It', emoji: '🚫' },
};

const DIFFICULTY_COLORS = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};

export default function HabitCard({ habit, todayLog, streak, onComplete, onDelete }) {
  const [animating, setAnimating] = useState(false);
  const completed = todayLog?.completed || false;
  const currentValue = todayLog?.value || 0;
  const currentStreak = streak?.current_streak || 0;
  const typeInfo = TYPE_LABELS[habit.type] || TYPE_LABELS.goal;

  const handleComplete = () => {
    if (completed && (habit.type === 'goal' || habit.type === 'bad_habit_stopper')) {
      return; // Already done today — prevent coin glitch
    }
    setAnimating(true);
    onComplete();
    setTimeout(() => setAnimating(false), 600);
  };

  return (
    <div
      className={`habit-card glass-sm ${completed ? 'completed' : ''} ${animating ? 'animating' : ''}`}
      style={{ '--habit-color': habit.color || 'var(--accent-primary)' }}
    >
      <div className="habit-card-header">
        <div className="habit-type-badge" style={{ background: DIFFICULTY_COLORS[habit.difficulty] }}>
          {typeInfo.emoji} {habit.difficulty}
        </div>
        <div className="habit-card-header-right">
          <div className="habit-streak">
            {currentStreak > 0 && (
              <>
                <Flame size={16} className="streak-fire" />
                <span>{currentStreak}</span>
              </>
            )}
          </div>
          {onDelete && (
            <button
              className="habit-delete-btn"
              onClick={(e) => { e.stopPropagation(); onDelete(habit.id); }}
              title="Delete habit"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      <h3 className="habit-name">{habit.name}</h3>
      <span className="habit-frequency">{habit.frequency}</span>

      <div className="habit-action">
        {habit.type === 'goal' && (
          <button
            className={`complete-btn ${completed ? 'done' : ''}`}
            onClick={handleComplete}
            disabled={completed}
          >
            {completed ? <CheckCircle2 size={32} /> : <Circle size={32} />}
            <span>{completed ? 'Done! ✅' : 'Mark Complete'}</span>
          </button>
        )}

        {habit.type === 'bad_habit_stopper' && (
          <button
            className={`complete-btn resist-btn ${completed ? 'done' : ''}`}
            onClick={handleComplete}
            disabled={completed}
          >
            {completed ? <CheckCircle2 size={32} /> : <Ban size={32} />}
            <span>{completed ? 'Resisted! 💪' : 'I Resisted Today'}</span>
          </button>
        )}

        {habit.type === 'timer' && (
          <Timer
            habitId={habit.id}
            target={habit.target_value || 25}
            completed={completed}
            onComplete={handleComplete}
          />
        )}

        {habit.type === 'counter' && (
          <Counter
            target={habit.target_value || 8}
            value={currentValue}
            completed={completed}
            onIncrement={handleComplete}
          />
        )}
      </div>

      {/* Progress bar */}
      {habit.type === 'counter' && (
        <div className="habit-progress">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, (currentValue / (habit.target_value || 1)) * 100)}%` }}
          />
        </div>
      )}

      {completed && <div className="completion-glow" />}
    </div>
  );
}