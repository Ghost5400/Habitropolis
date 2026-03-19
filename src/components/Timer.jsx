import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import './Timer.css';

export default function Timer({ habitId, target = 25, completed, onComplete }) {
  const totalSeconds = target * 60;
  const timerKey = habitId ? `habitropolis_timer_${habitId}` : 'habitropolis_timer_default';

  // Initialize state directly from localStorage so it persists across page navigation
  const [remaining, setRemaining] = useState(() => {
    if (completed) return totalSeconds;
    const saved = localStorage.getItem(timerKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.isRunning) {
          const timeLeft = Math.floor((data.endTime - Date.now()) / 1000);
          return timeLeft > 0 ? timeLeft : 0;
        } else {
          return data.remaining ?? totalSeconds;
        }
      } catch (e) {
        return totalSeconds;
      }
    }
    return totalSeconds;
  });

  const [isRunning, setIsRunning] = useState(() => {
    if (completed) return false;
    const saved = localStorage.getItem(timerKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.isRunning && data.endTime > Date.now()) {
          return true;
        }
      } catch (e) {}
    }
    return false;
  });

  const intervalRef = useRef(null);

  // Auto-complete if finished while in background
  useEffect(() => {
    if (!completed && remaining <= 0 && isRunning) {
      setIsRunning(false);
      localStorage.removeItem(timerKey);
      onComplete();
    } else if (completed) {
      localStorage.removeItem(timerKey);
    }
  }, [completed, remaining, isRunning, onComplete, timerKey]);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            localStorage.removeItem(timerKey);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, remaining, onComplete, timerKey]);

  const handleToggle = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    if (nextRunning) {
      localStorage.setItem(timerKey, JSON.stringify({
        isRunning: true,
        endTime: Date.now() + remaining * 1000
      }));
    } else {
      localStorage.setItem(timerKey, JSON.stringify({
        isRunning: false,
        remaining: remaining
      }));
      // Clear interval right away to prevent extra tick
      clearInterval(intervalRef.current);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setRemaining(totalSeconds);
    localStorage.removeItem(timerKey);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = ((totalSeconds - remaining) / totalSeconds) * 100;

  if (completed) {
    return (
      <div className="timer-completed">
        <CheckCircle2 size={28} className="timer-check" />
        <span>Session Complete!</span>
      </div>
    );
  }

  return (
    <div className="timer-widget">
      <div className="timer-ring" style={{ '--timer-progress': `${progress >= 0 ? progress : 0}%` }}>
        <div className="timer-display">
          <span className="timer-time">
            {String(Math.max(0, minutes)).padStart(2, '0')}:{String(Math.max(0, seconds)).padStart(2, '0')}
          </span>
        </div>
      </div>
      <div className="timer-controls">
        <button
          className="timer-btn"
          onClick={handleToggle}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="timer-btn" onClick={handleReset}>
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}