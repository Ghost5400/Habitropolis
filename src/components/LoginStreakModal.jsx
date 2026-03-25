import { useState, useEffect } from 'react';
import './LoginStreakModal.css';
import soundManager from '../lib/SoundManager';
import { Gift, Coins, Sparkles, Star } from 'lucide-react';
import DecorationSVG from './DecorationSVG'; // Make sure we have access to it or we can just use simple emojis
import { useGame } from '../contexts/GameContext'; // Required to add coins or chests if needed

export default function LoginStreakModal({ rewardInfo, onClose }) {
  const [stage, setStage] = useState('hidden'); // hidden -> entrance -> pop -> fadeout
  const { grantPurchasedCoins } = useGame(); // using grantPurchasedCoins to safely inject loose coins without streak issues

  useEffect(() => {
    if (rewardInfo) {
      setStage('entrance');
      soundManager.playSuccess(); // fanfare sound
            
      // For coins/chests additions since tokens are handled by useBounties DB already
      if (rewardInfo.coins > 0) {
        grantPurchasedCoins(rewardInfo.coins);
      }
      // Note: we'd also give the free chest here in a fully integrated state (for MVP, we'll just show it)
      
      setTimeout(() => setStage('pop'), 600);
    }
  }, [rewardInfo]);

  const handleClose = () => {
    setStage('fadeout');
    setTimeout(() => {
      setStage('hidden');
      if (onClose) onClose();
    }, 400); // Wait for fadeout css animation
  };

  if (stage === 'hidden' || !rewardInfo) return null;

  return (
    <div className={`login-modal-overlay stage-${stage}`}>
      <div className="login-modal-card glass">
        
        {stage === 'pop' && <div className="confetti-explosion" />}
        
        <h2 className="login-modal-title">Welcome Back, Mayor!</h2>
        
        <div className="streak-day-badge pulse-anim">
          Day {rewardInfo.day} Streak 🔥
        </div>
        
        <div className="parth-reward-scene">
          <img src="/parth-maxed.png" alt="Happy Parth" className="parth-modal-img float-anim" />
        </div>
        
        <p className="login-modal-subtitle">
          Parth gathered some supplies for you while you were away!
        </p>

        <div className="reward-boxes-row">
          <div className="reward-box glass-sm">
            <span className="reward-icon">🐯</span>
            <span className="reward-amt">+{rewardInfo.tokens}</span>
            <span className="reward-label">Tiger Tokens</span>
          </div>

          {rewardInfo.coins > 0 && (
            <div className="reward-box glass-sm rarity-epic">
              <Coins className="reward-icon text-gold" size={24} />
              <span className="reward-amt">+{rewardInfo.coins}</span>
              <span className="reward-label">Bonus Coins</span>
            </div>
          )}

          {rewardInfo.chest && (
            <div className="reward-box glass-sm rarity-legendary">
              <Gift className="reward-icon text-legendary" size={24} />
              <span className="reward-amt">1x</span>
              <span className="reward-label">Free Chest!</span>
            </div>
          )}
        </div>

        <button className="btn btn-primary login-claim-btn" onClick={handleClose}>
          Claim Rewards <Star size={18} fill="currentColor"/>
        </button>
      </div>
    </div>
  );
}
