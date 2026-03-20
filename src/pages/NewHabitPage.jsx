import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { Activity, Droplet, Dumbbell, Book, Sun, Zap, Code, PenTool, Gamepad2, Ban } from 'lucide-react';
import './NewHabitPage.css';

const HABIT_THEMES = [
  { icon: 'activity', id: 'neutral', label: 'Custom Habit', theme: 'Neutral Base' },
  { icon: 'dumbbell', id: 'fitness', label: 'Exercise & Fitness', theme: 'Gym Base' },
  { icon: 'droplet', id: 'water', label: 'Drink Water', theme: 'Water Base' },
  { icon: 'book', id: 'study', label: 'Study or Read', theme: 'Library Base' },
  { icon: 'sun', id: 'morning', label: 'Wake Up Early', theme: 'Sunrise Base' },
  { icon: 'code', id: 'coding', label: 'Coding Practice', theme: 'Tech Base' },
  { icon: 'pen-tool', id: 'art', label: 'Art & Creativity', theme: 'Studio Base' },
  { icon: 'gamepad-2', id: 'gaming', label: 'Gaming Habit', theme: 'Arcade Base' },
  { icon: 'zap', id: 'focus', label: 'Deep Focus', theme: 'Tower Base' },
  { icon: 'ban', id: 'discipline', label: 'Quit a Habit', theme: 'Fortress Base' },
];

const ICON_COMPONENTS = {
  activity: Activity,
  droplet: Droplet,
  dumbbell: Dumbbell,
  book: Book,
  sun: Sun,
  zap: Zap,
  code: Code,
  'pen-tool': PenTool,
  'gamepad-2': Gamepad2,
  ban: Ban,
};
export default function NewHabitPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // For editing, we'll have an id param
  const { createHabit, updateHabit } = useHabits();
  const [isLoading, setIsLoading] = useState(true);
  const [habit, setHabit] = useState({
    name: '',
    type: 'goal', // goal, timer, counter, bad_habit_stopper
    frequency: 'daily', // daily, weekly, monthly
    difficulty: 'easy', // easy, medium, hard
    target_value: 1,
    icon: 'activity', // default icon from lucide-react
    color: '#3B82F6', // default blue
  });
  const [error, setError] = useState('');

  // If we have an id, we are editing a habit
  useEffect(() => {
    if (id && id !== 'new') {
      loadHabit(id);
    } else {
      setIsLoading(false);
    }
  }, [id]);

  const loadHabit = async (habitId) => {
    try {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', habitId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      if (data) {
        setHabit(data);
      }
    } catch (err) {
      setError('Failed to load habit');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHabit(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (id && id !== 'new') {
        // Update existing habit
        await updateHabit(id, habit);
      } else {
        // Create new habit via hook (creates building + streak too!)
        await createHabit(habit);
      }

      navigate('/habits');
    } catch (err) {
      setError(err.message || 'Failed to save habit');
      console.error(err);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="new-habit-page glass">
      <div className="new-habit-card">
        <h1>{id && id !== 'new' ? 'Edit Habit' : 'New Habit'}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="form-label">
              Habit Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={habit.name}
              onChange={handleChange}
              required
              className="input"
              placeholder="Enter habit name"
            />
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="type" className="form-label">
                Type
              </label>
              <select
                id="type"
                name="type"
                value={habit.type}
                onChange={handleChange}
                className="select"
              >
                <option value="goal">Goal</option>
                <option value="timer">Timer</option>
                <option value="counter">Counter</option>
                <option value="bad_habit_stopper">Bad Habit Stopper</option>
              </select>
            </div>

            <div>
              <label htmlFor="frequency" className="form-label">
                Frequency
              </label>
              <select
                id="frequency"
                name="frequency"
                value={habit.frequency}
                onChange={handleChange}
                className="select"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="difficulty" className="form-label">
                Difficulty
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={habit.difficulty}
                onChange={handleChange}
                className="select"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label htmlFor="target_value" className="form-label">
                Target Value
              </label>
              <input
                type="number"
                id="target_value"
                name="target_value"
                value={habit.target_value}
                onChange={handleChange}
                min="1"
                className="input"
                placeholder="Target (e.g., glasses of water, minutes)"
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label htmlFor="color" className="form-label">
                Color
              </label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.25rem' }}>
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={habit.color}
                  onChange={handleChange}
                  className="color-input"
                />
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Pick a building color</span>
              </div>
            </div>
          </div>

          <div className="icon-picker-container">
            <label className="form-label">Habit Architecture Theme</label>
            <div className="icon-grid">
              {HABIT_THEMES.map((opt) => {
                const IconComp = ICON_COMPONENTS[opt.icon];
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`icon-option ${habit.icon === opt.icon ? 'selected' : ''}`}
                    onClick={() => setHabit(prev => ({ ...prev, icon: opt.icon }))}
                    title={opt.theme}
                  >
                    <IconComp size={24} />
                    <span className="icon-label">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={!habit.name.trim()}
          >
            {id && id !== 'new' ? 'Update Habit' : 'Create Habit'}
          </button>
        </form>
      </div>
    </div>
  );
}