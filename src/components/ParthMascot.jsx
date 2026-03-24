import { useState, useEffect } from 'react';
import './ParthMascot.css';
import soundManager from '../lib/SoundManager';

export default function ParthMascot({ habits, todayLogs, bestStreak, hunger = 50, onPet }) {
  const [mood, setMood] = useState('neutral');
  const [animating, setAnimating] = useState(false);
  const [message, setMessage] = useState('');

  const completedToday = Object.values(todayLogs).filter(l => l.completed).length;
  const totalHabits = habits.length;
  const completionPercent = totalHabits > 0 ? completedToday / totalHabits : 0;
  
  // Determine Parth's State
  useEffect(() => {
    if (totalHabits === 0) {
      setMood('neutral');
      setMessage("Hey Mayor! Your city needs you — let's crush some habits! 🐯");
      return;
    }

    if (hunger <= 10) {
      setMood('sad');
      setMessage("*Stomach rumbles* I'm starving... please do a habit...");
      return;
    }

    if (completedToday === 0) {
      setMood('sleeping');
      setMessage("Zzz... Wake me up by completing a habit...");
    } else if (completionPercent === 1) {
      setMood('ecstatic');
      setMessage("PERFECT DAY! You're an absolute legend! 🤩");
    } else if (bestStreak >= 7 && completionPercent >= 0.5) {
      setMood('fire');
      setMessage(`UNSTOPPABLE! ${bestStreak} days strong! 🔥`);
    } else if (completionPercent > 0.5) {
      setMood('happy');
      setMessage(`Almost there! Just ${totalHabits - completedToday} more to go! 💪`);
    } else {
      setMood('neutral');
      setMessage(`Good start! ${completedToday} down, ${totalHabits - completedToday} to go! 🔥`);
    }
  }, [completedToday, totalHabits, bestStreak, hunger]);

  const MOOD_IMAGES = {
    sad: '/parth-sad.png',
    sleeping: '/parth-sleeping.png',
    neutral: '/parth.png',
    happy: '/parth-waving.png',
    ecstatic: '/parth-ecstatic.png',
    fire: '/parth-fire.png'
  };

  const handlePet = () => {
    if (animating) return;
    setAnimating(true);
    soundManager.playNav();
    if (onPet) onPet();
    setTimeout(() => setAnimating(false), 1000);
  };

  return (
    <div className={`parth-mascot-container glass-sm mood-${mood}`} onClick={handlePet}>
      <div className="parth-mood-scene">
        <img 
          src={MOOD_IMAGES[mood] || MOOD_IMAGES.neutral} 
          alt={`Parth is ${mood}`} 
          className={`parth-mascot-img ${animating ? 'pet-bounce' : ''}`}
        />
        {mood === 'sleeping' && <div className="floating-zzz">Zzz...</div>}
        {mood === 'ecstatic' && <div className="confetti-burst" />}
        {mood === 'sad' && <div className="tear-drop" />}
      </div>
      
      <div className="parth-status">
        <div className="parth-speech-bubble">
          {message}
        </div>
        <div className="parth-name">— Parth 🐯</div>
        
        <div className="hunger-bar-container">
          <div className="hunger-label">Hunger <span className="hunger-val">{hunger}/100</span></div>
          <div className="hunger-track">
            <div 
              className={`hunger-fill ${hunger <= 20 ? 'critical' : hunger >= 80 ? 'full' : ''}`} 
              style={{ width: `${Math.min(100, Math.max(0, hunger))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
