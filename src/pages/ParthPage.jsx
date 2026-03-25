import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Shirt, BatteryCharging, Smile, Droplets, Zap, Moon, Music, ChevronUp, X, Check } from 'lucide-react';
import soundManager from '../lib/SoundManager';
import './ParthPage.css';

const MOOD_IMAGES = {
  sad: '/parth-sad.png',
  starving: '/parth-sad.png',
  dirty: '/parth-sad.png',
  sleeping: '/parth.png',
  neutral: '/parth.png',
  happy: '/parth-waving.png',
  ecstatic: '/parth-waving.png',
  fire: '/parth-waving.png'
};

export default function ParthPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const { coins, spendCoins } = useGame();
  
  // Friend State
  const [friendData, setFriendData] = useState(null);
  const [loadingFriend, setLoadingFriend] = useState(false);
  const isSocialView = Boolean(userId && userId !== user?.id);

  // Stats (Using DB columns or falling back to 50/1 if not yet created)
  const [hunger, setHunger] = useState(50);
  const [happiness, setHappiness] = useState(50);
  const [hygiene, setHygiene] = useState(50);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [tigerTokens, setTigerTokens] = useState(0);

  // UI State
  const [message, setMessage] = useState('');
  const [animatingAction, setAnimatingAction] = useState(null);
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  // Fetch true state
  useEffect(() => {
    const targetId = isSocialView ? userId : user?.id;
    if (!targetId) return;

    const fetchState = async () => {
      setLoadingFriend(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, parth_hunger, parth_happiness, parth_hygiene, parth_xp, parth_level, tiger_tokens')
          .eq('user_id', targetId)
          .single();
        if (error) throw error;
        
        if (isSocialView) setFriendData(data);
        
        setHunger(data.parth_hunger ?? 50);
        setHappiness(data.parth_happiness ?? 50);
        setHygiene(data.parth_hygiene ?? 50);
        setXp(data.parth_xp ?? 0);
        setLevel(data.parth_level ?? 1);
        if (!isSocialView) setTigerTokens(data.tiger_tokens ?? 0);
      } catch (err) {
        console.error('Error fetching Parth state:', err);
      } finally {
        setLoadingFriend(false);
      }
    };
    fetchState();
  }, [userId, user, isSocialView]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const spawnEmojis = (emojiType) => {
    const id = Date.now();
    setFloatingEmojis(prev => [...prev, { id, type: emojiType }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 1500);
  };

  // Helper to commit stat updates + XP progression
  const commitStats = async (updates, xpGain = 0) => {
    if (isSocialView) return; // Can't update friends

    let newXp = xp + xpGain;
    let newLevel = level;
    let xpNeeded = newLevel * 50;

    // Level up logic!
    if (newXp >= xpNeeded) {
      newLevel += 1;
      newXp = newXp - xpNeeded;
      showMessage(`🎉 LEVEL UP! Parth is now Level ${newLevel}!`);
      soundManager.playSuccess();
    }

    const payload = {
      ...updates,
      parth_xp: newXp,
      parth_level: newLevel
    };

    try {
      await updateProfile(payload);
      // Sync local state immediately
      if (updates.parth_happiness !== undefined) setHappiness(updates.parth_happiness);
      if (updates.parth_hygiene !== undefined) setHygiene(updates.parth_hygiene);
      if (updates.parth_hunger !== undefined) setHunger(updates.parth_hunger);
      setXp(newXp);
      setLevel(newLevel);
      if (updates.tiger_tokens !== undefined) setTigerTokens(updates.tiger_tokens);
    } catch (err) {
      console.error('Failed to commit stats', err);
    }
  };

  // -------------------------
  // ACTION BUTTONS (The loop)
  // -------------------------
  
  const handlePet = () => {
    soundManager.playNav();
    spawnEmojis('💕');
    setAnimatingAction('pet');
    setTimeout(() => setAnimatingAction(null), 500);
    if (!isSocialView) {
      const newHappiness = Math.min(100, happiness + 5);
      commitStats({ parth_happiness: newHappiness }, 1); // 1 XP for playing
    }
  };

  const handleWash = () => {
    if (!isSocialView && tigerTokens < 2) {
      showMessage('Need 2 🐯 to wash Parth!');
      return;
    }
    soundManager.playSuccess();
    spawnEmojis('🧼');
    setAnimatingAction('wash');
    setTimeout(() => setAnimatingAction(null), 1000);
    
    if (!isSocialView) {
      const newHygiene = Math.min(100, hygiene + 30);
      commitStats({ parth_hygiene: newHygiene, tiger_tokens: tigerTokens - 2 }, 3);
    }
  };

  const handleFeed = () => {
    if (!isSocialView && tigerTokens < 5) {
      showMessage('Need 5 🐯 to feed Parth!');
      return;
    }
    soundManager.playSuccess();
    spawnEmojis('🍔');
    setAnimatingAction('eat');
    setTimeout(() => setAnimatingAction(null), 600);
    
    if (!isSocialView) {
      const newHunger = Math.min(100, hunger + 30);
      commitStats({ parth_hunger: newHunger, tiger_tokens: tigerTokens - 5 }, 5);
    }
  };

  const handleSleep = () => {
    soundManager.playAmbient();
    spawnEmojis('💤');
    setAnimatingAction('sleep');
    // Screen visually dims in CSS
    setTimeout(() => setAnimatingAction(null), 2500);

    if (!isSocialView) {
      commitStats({ parth_happiness: 100, parth_hygiene: 100, parth_hunger: 100 }, 10);
      showMessage('Parth is fully rested!');
    }
  };

  const handleDance = () => {
    soundManager.playNav();
    spawnEmojis('🎵');
    setAnimatingAction('dance');
    setTimeout(() => setAnimatingAction(null), 2000);
    
    if (!isSocialView) {
      const newHappiness = Math.min(100, happiness + 15);
      commitStats({ parth_happiness: newHappiness }, 3);
    }
  };


  // Determine Room BG based on level
  let roomClass = 'room-bg-1';
  if (level >= 3) roomClass = 'room-bg-2';
  if (level >= 5) roomClass = 'room-bg-3';
  if (level >= 8) roomClass = 'room-bg-4';
  if (level >= 12) roomClass = 'room-bg-5';

  // Calculate composite mood (lowest stat drags him down)
  let mascotMood = 'neutral';
  if (hunger <= 10) mascotMood = 'starving';
  else if (hygiene <= 20) mascotMood = 'dirty';
  else if (happiness <= 30 || hunger <= 20) mascotMood = 'sad';
  else if (hygiene <= 25) mascotMood = 'sad';
  else if (happiness >= 80 && hunger >= 80 && hygiene >= 80) mascotMood = 'ecstatic';
  else if (happiness >= 80 && hunger >= 80) mascotMood = 'happy';

  // SPRITE SWAPPER: Which PNG to show right now?
  let currentSprite = MOOD_IMAGES[mascotMood] || MOOD_IMAGES.neutral;

  if (isSocialView && loadingFriend) return <div className="parth-page-container">Loading Pet...</div>;

  return (
    <div className={`parth-page-container ${roomClass} ${animatingAction === 'sleep' ? 'room-dimmed' : ''}`}>
      
      {/* 1. TOP HEADER - CURRENCY & LEVEL */}
      <div className="pt-header">
        <button className="pt-back-btn glass-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </button>
        
        {!isSocialView && (
          <div className="pt-currencies glass-sm">
            <span>💰 {coins.toLocaleString()}</span>
            <span style={{color: 'var(--accent-primary)'}}>🐯 {tigerTokens}</span>
          </div>
        )}

        <div className="pt-level-badge glass-sm">
          ⭐ Lv. {level}
        </div>
      </div>

      {message && <div className="pt-toast">{message}</div>}

      {/* 2. MAIN STAGE / CHARACTER */}
      <div className={`pt-stage ${animatingAction ? `anim-${animatingAction}` : ''}`} onClick={handlePet}>
        
        {floatingEmojis.map(e => (
          <div key={e.id} className="pt-floating-emoji">{e.type}</div>
        ))}
        
        <div className="pt-character-container">
          <img 
            src={currentSprite} 
            alt="Parth" 
            className={`pt-character-img ${hygiene <= 25 ? 'dirty-filter' : ''} ${animatingAction === 'sleep' ? 'dim-filter' : ''}`}
          />
          
          {/* Action-specific overlays */}
          {animatingAction === 'sleep' && <div className="pt-floating-zzz">Zzz...</div>}
          {animatingAction === 'wash'  && <div className="pt-rain">💧 💧 💧</div>}
        </div>
      </div>

      {/* 3. STATUS BARS */}
      <div className="pt-status-container glass">
        <div className="pt-stat-row">
          <span className="pt-stat-icon">😊</span>
          <div className="pt-stat-bar-wrapper">
             <div className="pt-stat-bar bg-green" style={{width: `${happiness}%`}}></div>
          </div>
        </div>
        <div className="pt-stat-row">
          <span className="pt-stat-icon">🍔</span>
          <div className="pt-stat-bar-wrapper">
             <div className="pt-stat-bar bg-orange" style={{width: `${hunger}%`}}></div>
          </div>
        </div>
        <div className="pt-stat-row">
          <span className="pt-stat-icon">🧼</span>
          <div className="pt-stat-bar-wrapper">
             <div className="pt-stat-bar bg-blue" style={{width: `${hygiene}%`}}></div>
          </div>
        </div>
        
        {/* XP Progress Bar below */}
        <div className="pt-xp-row">
          <div className="pt-xp-label">XP: {xp}/{level*50}</div>
          <div className="pt-xp-bar-wrapper">
             <div className="pt-xp-bar" style={{width: `${Math.min(100, (xp/(level*50))*100)}%`}}></div>
          </div>
        </div>
      </div>

      {/* 4. ACTION BAR (The 6 interaction buttons) */}
      <div className="pt-action-bar glass">
        <button className="pt-action-btn" onClick={handlePet}>
          <div className="pt-action-icon"><Smile size={24} /></div>
          <span>Pet</span>
        </button>
        <button className="pt-action-btn" onClick={handleWash}>
          <div className="pt-action-icon"><Droplets size={24} /></div>
          <span>Wash <small>(2🐯)</small></span>
        </button>
        <button className="pt-action-btn" onClick={handleFeed}>
          <div className="pt-action-icon"><Zap size={24} /></div>
          <span>Feed <small>(5🐯)</small></span>
        </button>
        <button className="pt-action-btn" onClick={handleSleep}>
          <div className="pt-action-icon"><Moon size={24} /></div>
          <span>Sleep</span>
        </button>
        
        <button className="pt-action-btn" onClick={handleDance}>
          <div className="pt-action-icon"><Music size={24} /></div>
          <span>Dance</span>
        </button>
      </div>

    </div>
  );
}
