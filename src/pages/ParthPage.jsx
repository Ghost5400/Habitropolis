import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { useHabits } from '../hooks/useHabits';
import { useBounties } from '../hooks/useBounties';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Sparkles, Shirt, BatteryCharging } from 'lucide-react';
import soundManager from '../lib/SoundManager';
import ParthMascot from '../components/ParthMascot';
import './ParthPage.css';

const PARTH_AURAS = [
  { id: 'aura_sparkles', name: 'Fairy Sparkles', desc: 'Magical sparkles follow Parth', cost: 100, icon: '✨' },
  { id: 'aura_snow', name: 'Winter Snow', desc: 'Gentle falling snow', cost: 150, icon: '❄️' },
  { id: 'aura_shadow', name: 'Ninja Shadows', desc: 'Dark mysterious pulse', cost: 200, icon: '🦇' },
  { id: 'aura_gold', name: 'Royal Gold', desc: 'A kingly golden glow', cost: 350, icon: '👑' },
];

const PARTH_OUTFITS = [
  { id: 'outfit_shades', name: 'Cool Shades', desc: 'Aviator sunglasses', cost: 80, icon: '🕶️' },
  { id: 'outfit_cap', name: 'Baseball Cap', desc: 'Sports cap', cost: 100, icon: '🧢' },
  { id: 'outfit_headband', name: 'Gym Headband', desc: 'Sweatband for grinding', cost: 120, icon: '🏋️' },
  { id: 'outfit_tophat', name: 'Top Hat', desc: 'Fancy top hat', cost: 250, icon: '🎩' },
  { id: 'outfit_crown', name: 'Royal Crown', desc: 'Gold crown', cost: 400, icon: '👑' },
];

export default function ParthPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  // Own State
  const { user, profile, updateProfile } = useAuth();
  const { coins, spendCoins } = useGame();
  const { habits, todayLogs } = useHabits();
  const { tigerTokens, parthHunger, feedParth, spendTokens, grantTigerTokens } = useBounties(habits, todayLogs);
  
  // Friend State
  const [friendData, setFriendData] = useState(null);
  const [loadingFriend, setLoadingFriend] = useState(false);
  
  // UI State
  const [activeTab, setActiveTab] = useState('outfits');
  const [message, setMessage] = useState('');

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    if (!userId || userId === user?.id) return;
    
    setLoadingFriend(true);
    const fetchFriend = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, parth_hunger, parth_equipped')
          .eq('user_id', userId)
          .single();
        if (error) throw error;
        setFriendData(data);
      } catch (err) {
        console.error('Error fetching friend data', err);
      } finally {
        setLoadingFriend(false);
      }
    };
    fetchFriend();
  }, [userId, user]);

  const isSocialView = Boolean(userId && userId !== user?.id);

  const handleBuyOrEquip = async (item) => {
    if (isSocialView) return;

    const typePrefix = item.id.split('_')[0]; // 'aura' or 'outfit'
    const currentEquipped = (profile?.parth_equipped || '').split(',').filter(Boolean);
    
    const newEquippedArr = currentEquipped.filter(id => !id.startsWith(typePrefix));
    newEquippedArr.push(item.id);
    const newEquippedString = newEquippedArr.join(',');

    const ownedItems = profile?.parth_outfits || [];
    
    // Equip owned item
    if (ownedItems.includes(item.id)) {
      await updateProfile({ parth_equipped: newEquippedString });
      soundManager.playSuccess();
      return;
    }

    // Buy new item
    if (tigerTokens < item.cost) {
      showMessage(`Need ${item.cost} Tiger Tokens!`);
      return;
    }

    const success = await spendTokens(item.cost);
    if (success) {
      await updateProfile({ 
        parth_outfits: [...ownedItems, item.id],
        parth_equipped: newEquippedString 
      });
      soundManager.playSuccess();
      showMessage(`Bought ${item.name}! 🎉`);
    }
  };

  const handleConvertCoinsToTokens = async () => {
    if (coins < 250) {
      showMessage('Need 250 Coins to buy 5 Tokens.');
      return;
    }
    const spent = await spendCoins(250, 'Converted to Tiger Tokens');
    if (spent) {
      await grantTigerTokens(5);
      soundManager.playSuccess();
      showMessage('Bought 5 🐯!');
    }
  };

  const handleFeed = async () => {
    if (tigerTokens < 5) {
      showMessage('Need 5 Tiger Tokens to feed Parth.');
      return;
    }
    const spent = await spendTokens(5);
    if (spent) {
      await feedParth();
      soundManager.playSuccess();
      showMessage('🍔 Parth is full!');
    }
  };

  // Determine props for Mascot
  let mascotProps = {};
  if (isSocialView) {
    const friendHunger = friendData?.parth_hunger ?? 50;
    
    // Estimate social mood based on hunger
    let socialMood = 'neutral';
    if (friendHunger <= 20) socialMood = 'sad';
    else if (friendHunger >= 80) socialMood = 'happy';

    mascotProps = {
      forceMood: socialMood,
      hunger: friendHunger,
      equippedAura: friendData?.parth_equipped || ''
    };
  } else {
    mascotProps = {
      habits: habits,
      todayLogs: todayLogs,
      bestStreak: profile?.best_streak || 0,
      hunger: parthHunger,
      equippedAura: profile?.parth_equipped || ''
    };
  }

  // Prevent loading flash
  if (isSocialView && loadingFriend) {
    return <div className="parth-page-container">Loading Tiger...</div>;
  }

  return (
    <div className="parth-page-container">
      {/* HEADER */}
      <div className="parth-header glass">
        <button className="btn btn-sm btn-secondary back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div className="parth-title">
          {isSocialView ? `${friendData?.display_name}'s Tiger` : "Parth's Room"}
        </div>
        
        {!isSocialView && (
          <div className="parth-balances">
            <span className="balance-pill glass-sm">💰 {coins.toLocaleString()}</span>
            <span className="balance-pill glass-sm">🐯 {tigerTokens}</span>
          </div>
        )}
      </div>

      {message && <div className="parth-toast glass-sm">{message}</div>}

      {/* STAGE AREA */}
      <div className="parth-stage">
        <div className="stage-spotlight">
          <ParthMascot 
            {...mascotProps} 
            onPet={() => {
              if (soundManager.bgmNode) soundManager.playSuccess(); 
            }}
          />
        </div>
      </div>

      {/* WARDROBE & CONTROLS (Only for Own View) */}
      {!isSocialView && (
        <div className="parth-wardrobe-section glass-sm">
          <div className="wardrobe-tabs">
            <button className={`w-tab ${activeTab === 'outfits' ? 'active' : ''}`} onClick={() => setActiveTab('outfits')}>
              <Shirt size={16} /> Outfits
            </button>
            <button className={`w-tab ${activeTab === 'auras' ? 'active' : ''}`} onClick={() => setActiveTab('auras')}>
              <Sparkles size={16} /> Auras
            </button>
            <button className={`w-tab ${activeTab === 'converter' ? 'active' : ''}`} onClick={() => setActiveTab('converter')}>
              <BatteryCharging size={16} /> Converter
            </button>
          </div>

          <div className="wardrobe-content">
            {activeTab === 'outfits' && (
              <div className="wardrobe-grid">
                {PARTH_OUTFITS.map(item => {
                  const isOwned = (profile?.parth_outfits || []).includes(item.id);
                  const isEquipped = (profile?.parth_equipped || '').includes(item.id);
                  return (
                    <div key={item.id} className={`w-card glass-sm ${isEquipped ? 'equipped' : ''}`}>
                      <div className="w-emoji">{item.icon}</div>
                      <div className="w-name">{item.name}</div>
                      {isEquipped ? (
                        <button className="btn btn-secondary w-btn" disabled>Equipped</button>
                      ) : isOwned ? (
                        <button className="btn btn-primary w-btn" onClick={() => handleBuyOrEquip(item)}>Equip</button>
                      ) : (
                        <button className="btn btn-primary w-btn" onClick={() => handleBuyOrEquip(item)}>
                          {item.cost} 🐯
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'auras' && (
              <div className="wardrobe-grid">
                {PARTH_AURAS.map(item => {
                  const isOwned = (profile?.parth_outfits || []).includes(item.id);
                  const isEquipped = (profile?.parth_equipped || '').includes(item.id);
                  return (
                    <div key={item.id} className={`w-card glass-sm ${isEquipped ? 'equipped' : ''}`}>
                      <div className="w-emoji">{item.icon}</div>
                      <div className="w-name">{item.name}</div>
                      {isEquipped ? (
                        <button className="btn btn-secondary w-btn" disabled>Equipped</button>
                      ) : isOwned ? (
                        <button className="btn btn-primary w-btn" onClick={() => handleBuyOrEquip(item)}>Equip</button>
                      ) : (
                        <button className="btn btn-primary w-btn" onClick={() => handleBuyOrEquip(item)}>
                          {item.cost} 🐯
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'converter' && (
              <div className="converter-panel">
                <div className="converter-card glass-sm">
                  <h3 style={{marginTop: 0}}>Buy Tiger Tokens</h3>
                  <p style={{color: 'var(--text-secondary)'}}>Exchange your standard Coins for the premium Tiger Tokens used to buy cosmetics.</p>
                  <div className="exchange-rate">250 Coins ➡️ 5 🐯</div>
                  <button className="btn btn-primary" onClick={handleConvertCoinsToTokens}>
                    Convert 250 Coins
                  </button>
                </div>
                
                <div className="converter-card glass-sm">
                  <h3 style={{marginTop: 0}}>Feed Parth</h3>
                  <p style={{color: 'var(--text-secondary)'}}>Parth starving? Restore his hunger by buying him a massive burger.</p>
                  <div className="exchange-rate">+30 Hunger ➡️ 5 🐯</div>
                  <button className="btn btn-primary" onClick={handleFeed}>
                    Feed (5 🐯)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
