import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Smile, Droplets, Zap, Music } from 'lucide-react';
import soundManager from '../lib/SoundManager';
import './ParthPage.css';

export default function ParthPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const { coins, spendCoins } = useGame();
  
  // Friend State
  const [friendData, setFriendData] = useState(null);
  const [loadingFriend, setLoadingFriend] = useState(false);
  const isSocialView = Boolean(userId && userId !== user?.id);

  // Stats
  const [hunger, setHunger] = useState(50);
  const [happiness, setHappiness] = useState(50);
  const [hygiene, setHygiene] = useState(50);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [tigerTokens, setTigerTokens] = useState(0);

  // UI State
  const [message, setMessage] = useState('');
  const [activeAction, setActiveAction] = useState(null); // 'pet', 'wash', 'eat', 'dance', 'flyingkiss'
  const [isDancing, setIsDancing] = useState(false);
  const [danceFrame, setDanceFrame] = useState(1);
  const audioRef = useRef(null);

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

  // Helper to commit stat updates + XP progression
  const commitStats = async (updates, xpGain = 0) => {
    if (isSocialView) return;

    let newXp = xp + xpGain;
    let newLevel = level;
    let xpNeeded = newLevel * 50;

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

  // Audio cleanup and dance interval
  useEffect(() => {
    return () => stopDance();
  }, []);

  useEffect(() => {
    let interval;
    if (isDancing) {
       interval = setInterval(() => {
           setDanceFrame(f => f === 1 ? 2 : 1);
       }, 400);
    }
    return () => clearInterval(interval);
  }, [isDancing]);

  const stopDance = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsDancing(false);
    if (activeAction === 'dance') {
       setActiveAction(null);
    }
  };

  // -------------------------
  // ACTION BUTTONS 
  // -------------------------
  
  const handlePet = () => {
    if (isDancing) return;
    soundManager.playNav();
    
    if (happiness === 100 && hunger === 100 && hygiene === 100) {
       setActiveAction('flyingkiss');
       setTimeout(() => setActiveAction(null), 2000);
    } else {
       setActiveAction('pet');
       setTimeout(() => setActiveAction(null), 1500);
    }
    
    if (!isSocialView) {
      const newHappiness = Math.min(100, happiness + 5);
      commitStats({ parth_happiness: newHappiness }, 1);
    }
  };

  const handleWash = () => {
    if (isDancing) return;
    if (!isSocialView && tigerTokens < 2) {
      showMessage('Need 2 🐯 to wash Parth!');
      return;
    }
    soundManager.playSuccess();
    setActiveAction('wash');
    setTimeout(() => setActiveAction(null), 2000);
    
    if (!isSocialView) {
      const newHygiene = Math.min(100, hygiene + 30);
      commitStats({ parth_hygiene: newHygiene, tiger_tokens: tigerTokens - 2 }, 3);
    }
  };

  const handleFeed = () => {
    if (isDancing) return;
    if (!isSocialView && tigerTokens < 5) {
      showMessage('Need 5 🐯 to feed Parth!');
      return;
    }
    soundManager.playSuccess();
    setActiveAction('eat');
    setTimeout(() => setActiveAction(null), 2000);
    
    if (!isSocialView) {
      const newHunger = Math.min(100, hunger + 30);
      commitStats({ parth_hunger: newHunger, tiger_tokens: tigerTokens - 5 }, 5);
    }
  };

  const handleDance = () => {
    if (isDancing) {
      stopDance();
      return;
    }
    
    // Cancel other actions
    setActiveAction(null);
    
    soundManager.playNav();
    setActiveAction('dance');
    setIsDancing(true);
    showMessage('Now Playing 🎵');
    
    const songNum = Math.floor(Math.random() * 10) + 1;
    const audio = new Audio(`/songs/song-${songNum}.mp3`);
    audioRef.current = audio;
    
    audio.play().catch(e => {
        console.warn('Audio play failed, playing silently.', e);
    });
    
    audio.onended = () => {
      stopDance();
    };

    if (!isSocialView) {
      const newHappiness = Math.min(100, happiness + 15);
      commitStats({ parth_happiness: newHappiness }, 3);
    }
  };

  // Determine Room BG
  let roomClass = 'room-bg-1';
  if (level >= 3) roomClass = 'room-bg-2';
  if (level >= 5) roomClass = 'room-bg-3';
  if (level >= 8) roomClass = 'room-bg-4';
  if (level >= 12) roomClass = 'room-bg-5';

  // Sprite Swapper
  let baseSprite = '/parth.png';
  if (happiness === 100 && hunger === 100 && hygiene === 100) baseSprite = '/parth-maxed.png';
  else if (hunger <= 20) baseSprite = '/parth-starving.png';
  else if (hygiene <= 20) baseSprite = '/parth-dirty.png';
  else if (happiness <= 20) baseSprite = '/parth-depressed.png';

  let currentSprite = baseSprite;
  let actionClass = '';

  if (activeAction === 'pet') {
     currentSprite = '/parth-pet.png';
     actionClass = 'anim-pop-in';
  } else if (activeAction === 'wash') {
     currentSprite = '/parth-bath.png';
     actionClass = 'anim-pop-in';
  } else if (activeAction === 'eat') {
     currentSprite = '/parth-eating.png';
     actionClass = 'anim-pop-in';
  } else if (activeAction === 'dance') {
     currentSprite = danceFrame === 1 ? '/parth-dance1.png' : '/parth-dance2.png';
     actionClass = 'anim-pulse';
  } else if (activeAction === 'flyingkiss') {
     currentSprite = '/parth-flyingkiss.png';
     actionClass = 'anim-pop-in pt-heart-burst';
  }

  // State-specific classes
  if (!activeAction) {
     if (baseSprite === '/parth-maxed.png') actionClass = 'pt-shimmer';
     else if (baseSprite === '/parth-starving.png') actionClass = 'anim-tremble';
     else if (baseSprite === '/parth-dirty.png') actionClass = 'anim-wiggle-small';
     else if (baseSprite === '/parth-depressed.png') actionClass = 'anim-sad-breath';
  }

  if (isSocialView && loadingFriend) return <div className="parth-page-container">Loading Pet...</div>;

  return (
    <div className={`parth-page-container ${roomClass}`}>
      
      {/* 1. TOP HEADER */}
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

      {isDancing && (
        <div className="pt-now-playing-bar glass-sm">
          🎤 Now Playing...
        </div>
      )}

      {message && <div className="pt-toast">{message}</div>}

      {/* 2. MAIN STAGE / CHARACTER */}
      <div className="pt-stage" onClick={handlePet}>
        <div className="pt-character-container">
          <img 
            src={currentSprite} 
            alt="Parth" 
            className={`pt-character-img pt-image-crossfade ${actionClass}`}
          />
          {activeAction === 'flyingkiss' && (
             <div className="heart-particles">
               <span>💖</span><span>💕</span><span>💖</span>
             </div>
          )}
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
        
        {/* XP Progress Bar */}
        <div className="pt-xp-row">
          <div className="pt-xp-label">XP: {xp}/{level*50}</div>
          <div className="pt-xp-bar-wrapper">
             <div className="pt-xp-bar" style={{width: `${Math.min(100, (xp/(level*50))*100)}%`}}></div>
          </div>
        </div>
      </div>

      {/* 4. ACTION BAR */}
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
        <button className={`pt-action-btn ${isDancing ? 'active-dance' : ''}`} onClick={handleDance}>
          <div className="pt-action-icon"><Music size={24} /></div>
          <span>{isDancing ? 'Stop' : 'Dance'}</span>
        </button>
      </div>

    </div>
  );
}
