import { useState, useEffect } from 'react';
import './ParthMascot.css';
import soundManager from '../lib/SoundManager';

export default function ParthMascot({ habits, todayLogs, bestStreak, hunger = 50, equippedAura, onPet }) {
  const [mood, setMood] = useState('neutral');
  const [animating, setAnimating] = useState(false);
  const [message, setMessage] = useState('');
  const [baseMessage, setBaseMessage] = useState(''); // Stores the default message before interruption
  const [reaction, setReaction] = useState(null); // { emoji, id } for particles

  const completedToday = Object.values(todayLogs).filter(l => l.completed).length;
  const totalHabits = habits.length;
  const completionPercent = totalHabits > 0 ? completedToday / totalHabits : 0;
  
  // Determine Parth's State
  useEffect(() => {
    let newMsg = '';
    if (totalHabits === 0) {
      setMood('neutral');
      newMsg = "Hey Mayor! Your city needs you — let's crush some habits! 🐯";
    } else if (hunger <= 10) {
      setMood('sad');
      newMsg = "*Stomach rumbles* I'm starving... please do a habit...";
    } else if (completedToday === 0) {
      setMood('sleeping');
      newMsg = "Zzz... Wake me up by completing a habit...";
    } else if (completionPercent === 1) {
      setMood('ecstatic');
      newMsg = "PERFECT DAY! You're an absolute legend! 🤩";
    } else if (bestStreak >= 7 && completionPercent >= 0.5) {
      setMood('fire');
      newMsg = `UNSTOPPABLE! ${bestStreak} days strong! 🔥`;
    } else if (completionPercent > 0.5) {
      setMood('happy');
      newMsg = `Almost there! Just ${totalHabits - completedToday} more to go! 💪`;
    } else {
      setMood('neutral');
      newMsg = `Good start! ${completedToday} down, ${totalHabits - completedToday} to go! 🔥`;
    }
    
    setBaseMessage(newMsg);
    if (!reaction) setMessage(newMsg); // Only update visible if not currently reacting
  }, [completedToday, totalHabits, bestStreak, hunger, reaction]);

  const MOOD_IMAGES = {
    sad: '/parth-sad.png',
    sleeping: '/parth-sleeping.png',
    neutral: '/parth.png',
    happy: '/parth-waving.png',
    ecstatic: '/parth-ecstatic.png',
    fire: '/parth-fire.png'
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
        {mood === 'sleeping' && <div className="floating-zzz">Zzz...</div>}
        {mood === 'ecstatic' && <div className="confetti-burst" />}
        {mood === 'sad' && <div className="tear-drop" />}
        
        {/* Equipped Wardrobe Auras & Outfits */}
        {equippedAura?.includes('aura_sparkles') && (
          <div className="aura-layer aura-sparkles">
            <span>✨</span><span>✨</span><span>✨</span>
          </div>
        )}
        {equippedAura?.includes('aura_snow') && (
          <div className="aura-layer aura-snow">
            <span>❄️</span><span>❄️</span><span>❄️</span>
          </div>
        )}
        {equippedAura?.includes('aura_gold') && <div className="aura-layer aura-gold-ring"></div>}
        {equippedAura?.includes('aura_shadow') && <div className="aura-layer aura-shadow-pulse"></div>}

        {/* Outfits (Positioned Emojis on Mascot) */}
        {equippedAura?.includes('outfit_shades') && <div className="outfit-layer outfit-shades">🕶️</div>}
        {equippedAura?.includes('outfit_cap') && <div className="outfit-layer outfit-cap">🧢</div>}
        {equippedAura?.includes('outfit_headband') && <div className="outfit-layer outfit-headband">🏋️</div>}
        {equippedAura?.includes('outfit_tophat') && <div className="outfit-layer outfit-tophat">🎩</div>}
        {equippedAura?.includes('outfit_crown') && <div className="outfit-layer outfit-crown">👑</div>}
        
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
