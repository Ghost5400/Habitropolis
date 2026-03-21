import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react';
import soundManager from '../lib/SoundManager';
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
      soundManager.playSuccess(); // play majestic success
      onComplete();
    } else if (completed) {
      localStorage.removeItem(timerKey);
    }
  }, [completed, remaining, isRunning, onComplete, timerKey]);

  useEffect(() => {
    if (isRunning && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            localStorage.removeItem(timerKey);
            soundManager.playSuccess();
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

  const handleToggle = (e) => {
    e.stopPropagation(); // Stop habit card click if any
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    
    // Play tick sound
    soundManager.playNav();

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
      clearInterval(intervalRef.current);
    }
  };

  const handleReset = (e) => {
    e.stopPropagation();
    soundManager.playNav();
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setRemaining(totalSeconds);
    localStorage.removeItem(timerKey);
  };

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  
  // SVG Circular Math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  // Progress approaches 1 as time depletes. Dashoffset approaches circumference.
  const progressRatio = (totalSeconds - remaining) / totalSeconds;
  const strokeDashoffset = progressRatio * circumference;

  if (completed) {
    return (
      <div className="timer-completed glass-sm">
        <CheckCircle2 size={24} className="timer-check" />
        <div className="timer-completed-text">
          <span>{target}m Session</span>
          <strong>Completed!</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-timer-widget">
      <div className={`timer-ring-container ${isRunning ? 'is-running' : ''}`}>
        <svg className="timer-svg" viewBox="0 0 100 100">
          <defs>
             <linearGradient id={`timer-grad-${habitId}`} x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="var(--accent-primary)" />
               <stop offset="100%" stopColor="var(--accent-gold)" />
             </linearGradient>
             <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
               <feGaussianBlur stdDeviation="3" result="blur" />
               <feComposite in="SourceGraphic" in2="blur" operator="over" />
             </filter>
          </defs>
          <circle
            className="timer-track"
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="6"
          />
          <circle
            className="timer-progress-svg"
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth="6"
            stroke={`url(#timer-grad-${habitId})`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter={isRunning ? 'url(#glow)' : ''}
            style={{ 
               transition: isRunning ? 'stroke-dashoffset 1s linear' : 'none' 
            }}
          />
        </svg>
        
        <div className="timer-display-inner">
          <span className="timer-digits">
            {String(Math.max(0, minutes)).padStart(2, '0')}:{String(Math.max(0, seconds)).padStart(2, '0')}
          </span>
          <span className="timer-label">Min</span>
        </div>
      </div>

      <div className="timer-premium-controls">
        <button
          className={`timer-action-btn ${isRunning ? 'pause' : 'play'}`}
          onClick={handleToggle}
          title={isRunning ? "Pause Session" : "Start Session"}
        >
          {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="play-icon-offset" />}
        </button>
        <button 
          className="timer-action-btn reset" 
          onClick={handleReset}
          title="Reset Timer"
          disabled={remaining === totalSeconds && !isRunning}
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}