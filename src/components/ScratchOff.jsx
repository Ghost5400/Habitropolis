import { useState } from 'react';
import { useCoins } from '../hooks/useCoins';
import { Coins, Ticket, Sparkles } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './ScratchOff.css';

const TICKET_PRICE = 20;

// Emojis that can appear based on weight
const REWARDS = [
  { symbol: '🪙', type: 'coins', amount: 30, weight: 50 },
  { symbol: '💰', type: 'coins', amount: 100, weight: 20 },
  { symbol: '🐯', type: 'tokens', amount: 1, weight: 15 },
  { symbol: '👑', type: 'title', id: 'The Lucky', weight: 10 },
  { symbol: '🏰', type: 'theme', id: 'synthwave', weight: 5 },
];

function getRandomReward() {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const reward of REWARDS) {
    cumulative += reward.weight;
    if (roll <= cumulative) return reward;
  }
  return REWARDS[0];
}

export default function ScratchOff() {
  const { coins, spendCoins, addCoins } = useGame();
  const { user, profile } = useAuth();
  
  // 3x3 grid
  const [grid, setGrid] = useState(Array(9).fill(null));
  const [revealed, setRevealed] = useState(Array(9).fill(false));
  const [isPlaying, setIsPlaying] = useState(false);
  const [wonAmount, setWonAmount] = useState(null);
  const [winSymbol, setWinSymbol] = useState(null);

  const buyTicket = async () => {
    if (coins < TICKET_PRICE) return;
    const success = await spendCoins(TICKET_PRICE, 'Bought Scratch Ticket');
    if (!success) return;

    // Generate grid
    const targetReward = getRandomReward();
    // Pre-fill 3 of the target reward somewhere
    const newGrid = Array(9).fill(null);
    let placed = 0;
    while(placed < 3) {
      const idx = Math.floor(Math.random() * 9);
      if (!newGrid[idx]) {
        newGrid[idx] = targetReward.symbol;
        placed++;
      }
    }
    // Fill rest with random others (making sure we don't accidentally create 3 of another)
    for(let i=0; i<9; i++) {
      if(!newGrid[i]) {
         let fallback;
         do { fallback = REWARDS[Math.floor(Math.random() * REWARDS.length)].symbol; } 
         while (fallback === targetReward.symbol);
         newGrid[i] = fallback;
      }
    }

    setGrid(newGrid);
    setRevealed(Array(9).fill(false));
    setIsPlaying(true);
    setWonAmount(null);
    setWinSymbol(null);
  };

  const handleScratch = async (idx) => {
    if (!isPlaying || revealed[idx]) return;
    
    const newRevealed = [...revealed];
    newRevealed[idx] = true;
    setRevealed(newRevealed);

    // Check if 3 are revealed
    const revealedSymbols = newGrid => newGrid.filter((s, i) => newRevealed[i]);
    const counts = {};
    for (const s of revealedSymbols(grid)) {
      counts[s] = (counts[s] || 0) + 1;
      if (counts[s] === 3) {
         handleWin(s);
         break;
      }
    }
  };

  const handleWin = async (symbol) => {
    setIsPlaying(false);
    setWinSymbol(symbol);
    
    // Auto reveal the rest
    setTimeout(() => setRevealed(Array(9).fill(true)), 500);

    const rewardObj = REWARDS.find(r => r.symbol === symbol);
    if (!rewardObj) return;

    if (rewardObj.type === 'coins') {
      await addCoins(rewardObj.amount, 'Scratch Ticket Win!');
      setWonAmount(`+${rewardObj.amount} Coins`);
    } else if (rewardObj.type === 'tokens') {
      const currentTokens = profile?.tiger_tokens || 0;
      await supabase.from('profiles').update({ tiger_tokens: currentTokens + rewardObj.amount }).eq('user_id', user.id);
      setWonAmount(`+${rewardObj.amount} Tiger Token`);
    } else if (rewardObj.type === 'title') {
      await supabase.from('profiles').update({ active_title: rewardObj.id }).eq('user_id', user.id);
      setWonAmount(`Unlocked Title: ${rewardObj.id}`);
    } else if (rewardObj.type === 'theme') {
      await supabase.from('profiles').update({ city_theme: rewardObj.id }).eq('user_id', user.id);
      setWonAmount(`Unlocked Theme: ${rewardObj.id}`);
    }
  };

  return (
    <div className="scratch-card glass">
      <div className="scratch-header">
         <Ticket size={32} className="text-promote" />
         <div>
           <h3>Mayor's Lucky Scratch</h3>
           <p>Match 3 identical symbols to win huge prizes!</p>
         </div>
      </div>
      
      {!isPlaying && !wonAmount ? (
        <div className="scratch-buy-view">
           <button className="btn btn-primary btn-huge" onClick={buyTicket} disabled={coins < TICKET_PRICE}>
             Buy Ticket ({TICKET_PRICE} <Coins size={16}/>)
           </button>
        </div>
      ) : (
        <div className="scratch-play-area">
           <div className="scratch-grid">
             {grid.map((symbol, idx) => (
                <div 
                  key={idx} 
                  className={`scratch-cell ${revealed[idx] ? 'revealed' : ''} ${wonAmount && symbol === winSymbol ? 'winner-cell' : ''}`}
                  onClick={() => handleScratch(idx)}
                >
                  <div className="scratch-foil"></div>
                  <div className="scratch-symbol">{symbol}</div>
                </div>
             ))}
           </div>
           
           {wonAmount && (
             <div className="scratch-winner-announcement bounce-in">
                <Sparkles size={40} className="text-gold" />
                <h2>Winner!</h2>
                <p className="text-promote font-bold">{wonAmount}</p>
                <button className="btn btn-primary mt-2" onClick={() => { setIsPlaying(false); setWonAmount(null); }}>Play Again</button>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
