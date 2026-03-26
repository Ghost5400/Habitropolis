import { useState, useEffect } from 'react';
import './ParthMascot.css';
import soundManager from '../lib/SoundManager';

export default function ParthMascot({ habits, todayLogs, bestStreak, hunger = 50, forceMood, onPet }) {
  const [internalMood, setInternalMood] = useState('neutral');
  const [animating, setAnimating] = useState(false);
  const [message, setMessage] = useState('');
  const [baseMessage, setBaseMessage] = useState(''); // Stores the default message before interruption
  const [reaction, setReaction] = useState(null); // { emoji, id } for particles

  // If forceMood is provided (for Social viewing), use it. Otherwise, use calculated internalMood.
  const mood = forceMood || internalMood;

  const safeLogs = todayLogs || {};
  const safeHabits = habits || [];

  const completedToday = Object.values(safeLogs).filter(l => l.completed).length;
  const totalHabits = safeHabits.length;
  const completionPercent = totalHabits > 0 ? completedToday / totalHabits : 0;
  
  // Determine Parth's State
  useEffect(() => {
    // If we're forcing a mood, we don't need to calculate it locally
    if (forceMood) return;

    let newMsg = '';
    if (totalHabits === 0) {
      setInternalMood('neutral');
      newMsg = "Hey Mayor! Your city needs you — let's crush some habits! 🐯";
    } else if (hunger <= 10) {
      setInternalMood('starving');
      newMsg = "*Stomach rumbles* I'm starving... please do a habit...";
    } else if (completedToday === 0) {
      setInternalMood('sleeping');
      newMsg = "Zzz... Wake me up by completing a habit...";
    } else if (completionPercent === 1) {
      setInternalMood('ecstatic');
      newMsg = "PERFECT DAY! You're an absolute legend! 🤩";
    } else if (bestStreak >= 7 && completionPercent >= 0.5) {
      setInternalMood('fire');
      newMsg = `UNSTOPPABLE! ${bestStreak} days strong! 🔥`;
    } else if (completionPercent > 0.5) {
      setInternalMood('happy');
      newMsg = `Almost there! Just ${totalHabits - completedToday} more to go! 💪`;
    } else {
      setInternalMood('neutral');
      newMsg = `Good start! ${completedToday} down, ${totalHabits - completedToday} to go! 🔥`;
    }
    
    setBaseMessage(newMsg);
    if (!reaction) setMessage(newMsg); // Only update visible if not currently reacting
  }, [completedToday, totalHabits, bestStreak, hunger, reaction, forceMood]);

  const MOOD_IMAGES = {
    sad: '/parth-depressed.png',
    starving: '/parth-starving.png',
    sleeping: '/parth.png',
    neutral: '/parth.png',
    happy: '/parth.png',
    ecstatic: '/parth.png',
    fire: '/parth.png'
  };

  const REACTIONS = [
    { text: "I love this city! You're a great mayor!", emoji: '💕' },
    { text: "Hehe, that tickles!", emoji: '😂' },
    { text: "Let's crush those habits!", emoji: '💪' },
    { text: "Feed me more Tiger Tokens!", emoji: '🍕' },
    { text: "La la la~ Habit time!", emoji: '🎵' },
    { text: "You're doing amazing today!", emoji: '✨' },
    { text: "Roarrr! I'm fired up!", emoji: '🔥' }
  ];

  const handlePet = () => {
    if (animating) return;
    setAnimating(true);
    soundManager.playNav();
    
    // Pick random reaction
    const rand = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
    setReaction({ ...rand, id: Date.now() });
    setMessage(rand.text);

    if (onPet) onPet();
    
    setTimeout(() => {
      setAnimating(false);
      setReaction(null);
      setMessage(baseMessage); // Restore original message
    }, 2500);
  };

  return (
    <div className={`parth-mascot-container glass-sm mood-${mood}`} onClick={handlePet}>
      <div className="parth-mood-scene">
        <img 
          src={MOOD_IMAGES[mood] || MOOD_IMAGES.neutral} 
          alt={`Parth is ${mood}`} 
          className={`parth-mascot-img ${animating ? 'pet-bounce' : ''}`}
        />
        {mood === 'ecstatic' && <div className="confetti-burst" />}
        {mood === 'sad' && <div className="tear-drop" />}
        
        {reaction && (
          <div className="reaction-particles" key={reaction.id}>
            <span className="particle p1">{reaction.emoji}</span>
            <span className="particle p2">{reaction.emoji}</span>
            <span className="particle p3">{reaction.emoji}</span>
          </div>
        )}
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
