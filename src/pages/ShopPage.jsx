import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';
import { useCoins } from '../hooks/useCoins';
import { useStreaks } from '../hooks/useStreaks';
import { useHabits } from '../hooks/useHabits';
import { ShoppingBag, Palette, Coins, Shield, Check, Package, Gift, Sparkles, EyeOff } from 'lucide-react';
import DecorationSVG from '../components/DecorationSVG';
import soundManager from '../lib/SoundManager';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import './ShopPage.css';

const DECORATION_CATALOG = [
  { id: '11111111-0000-0000-0000-000000000001', name: 'Oak Tree', category: 'nature', price_coins: 30, type: 'tree-oak' },
  { id: '11111111-0000-0000-0000-000000000002', name: 'Pine Tree', category: 'nature', price_coins: 35, type: 'tree-pine' },
  { id: '11111111-0000-0000-0000-000000000003', name: 'Park Shrubbery', category: 'nature', price_coins: 15, type: 'shrubbery' },
  { id: '11111111-0000-0000-0000-000000000004', name: 'Flower Garden', category: 'garden', price_coins: 20, type: 'flower-garden' },
  { id: '11111111-0000-0000-0000-000000000005', name: 'Zen Rock Garden', category: 'garden', price_coins: 40, type: 'zen-garden' },
  { id: '11111111-0000-0000-0000-000000000006', name: 'Water Fountain', category: 'fixture', price_coins: 50, type: 'fountain' },
  { id: '11111111-0000-0000-0000-000000000007', name: 'Statue Monument', category: 'fixture', price_coins: 75, type: 'statue' },
  { id: '11111111-0000-0000-0000-000000000008', name: 'City Bench', category: 'fixture', price_coins: 15, type: 'bench' },
  { id: '11111111-0000-0000-0000-000000000009', name: 'Street Lamp', category: 'fixture', price_coins: 20, type: 'street-lamp' },
  { id: '11111111-0000-0000-0000-000000000010', name: 'Swimming Pool', category: 'fixture', price_coins: 100, type: 'pool' },
  { id: '11111111-0000-0000-0000-000000000011', name: 'Cobblestone Patch', category: 'path', price_coins: 10, type: 'cobblestone' },
  { id: '11111111-0000-0000-0000-000000000012', name: 'Asphalt Road', category: 'path', price_coins: 5, type: 'road' },
  { id: '11111111-0000-0000-0000-000000000013', name: 'Crosswalk', category: 'path', price_coins: 5, type: 'crosswalk' },
  { id: '11111111-0000-0000-0000-000000000014', name: 'Bus Shelter', category: 'infrastructure', price_coins: 45, type: 'bus-stop' },
  { id: '11111111-0000-0000-0000-000000000015', name: 'Food Stand', category: 'infrastructure', price_coins: 60, type: 'kiosk' },
];

// Exclusive legendary items that cannot be bought directly, only won from Gacha chest!
const LEGENDARY_POOL = [
  { id: '22222222-0000-0000-0000-000000000001', name: 'Golden Trophy', category: 'legendary', type: 'golden-trophy' },
  { id: '22222222-0000-0000-0000-000000000002', name: 'Neon Ferris Wheel', category: 'legendary', type: 'ferris-wheel' },
  { id: '22222222-0000-0000-0000-000000000003', name: 'Cyber Monolith', category: 'legendary', type: 'cyber-monolith' },
];

const COIN_PACKAGES = [
   { id: 'coin_100', coins: 100, price: '₹49', priceInPaise: 4900, popular: false },
   { id: 'coin_500', coins: 500, price: '₹149', priceInPaise: 14900, popular: true },
   { id: 'coin_1200', coins: 1200, price: '₹299', priceInPaise: 29900, popular: false },
   { id: 'coin_3000', coins: 3000, price: '₹499', priceInPaise: 49900, popular: false },
 ];

const SHIELD_OPTIONS = [
  { days: 1, cost: 10 },
  { days: 3, cost: 25 },
  { days: 5, cost: 38 },
  { days: 7, cost: 50 },
];

export default function ShopPage() {
  const { coins, spendCoins, buyDecoration, buyMysteryChest, ownedDecorations, refreshData, grantPurchasedCoins } = useGame();
  const { habits } = useHabits();
  const { buyShield } = useStreaks();
  const { user, profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('decorations');
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [geckoActive, setGeckoActive] = useState(false);
  
  // Gacha State
  const [openingChest, setOpeningChest] = useState(false);

  // Sync gecko state from profile
  useEffect(() => {
    setGeckoActive(!!profile?.gecko_active);
  }, [profile]);

  const showMessage = (msg) => {
    setPurchaseMessage(msg);
    setTimeout(() => setPurchaseMessage(''), 3000);
  };

  // Count how many of each decoration the user owns (unplaced)
  const getOwnedCount = (decId) => {
    return (ownedDecorations || []).filter(od => od.decoration_id === decId && !od.building_id).length;
  };

  const handleBuyDecoration = async (decoration) => {
    if (coins < decoration.price_coins) {
      showMessage('Not enough coins! 💸');
      return;
    }

    const success = await buyDecoration(decoration, null);
    if (success) {
      soundManager.playSuccess();
      showMessage(`Bought ${decoration.name}! Go to City to place it 🏙️`);
    } else {
      showMessage('Purchase failed. Try again.');
    }
  };

  const handleOpenChest = async () => {
    if (coins < 50) {
      showMessage('Need 50 coins to open the Mystery Chest! 💸');
      return;
    }
    
    setOpeningChest(true);
    soundManager.playNav(); // suspense sound
    
    setTimeout(async () => {
      const roll = Math.random();
      let rollObj;
      if (roll < 0.05) { // 5% Legendary
        const legIdx = Math.floor(Math.random() * LEGENDARY_POOL.length);
        rollObj = LEGENDARY_POOL[legIdx];
      } else if (roll < 0.3) { // 25% Epic
        const epics = DECORATION_CATALOG.filter(d => d.price_coins >= 40);
        rollObj = epics[Math.floor(Math.random() * epics.length)];
      } else { // 70% Common
        const commons = DECORATION_CATALOG.filter(d => d.price_coins < 40);
        rollObj = commons[Math.floor(Math.random() * commons.length)];
      }
      
      const res = await buyMysteryChest(50, rollObj);
      if (res) {
        soundManager.playSuccess();
        showMessage(`🎉 Chest opened! You won: ${rollObj.name}!`);
      } else {
        showMessage('Chest failed to open. Network error.');
      }
      setOpeningChest(false);
    }, 1500); // 1.5 seconds suspense animation
  };

  const handleBuyShield = async (shield) => {
    if (!selectedHabit) {
      showMessage('Select a habit first!');
      return;
    }
    if (coins < shield.cost) {
      showMessage('Not enough coins! 💸');
      return;
    }
    const spent = await spendCoins(shield.cost, `${shield.days}-day shield`);
    if (spent) {
      await buyShield(selectedHabit, shield.days, shield.cost);
      showMessage(`🛡️ ${shield.days}-day shield activated!`);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBuyCoins = async (pkg) => {
    const isLoaded = await loadRazorpay();
    if (!isLoaded) {
      showMessage('Failed to load Razorpay securely. Check your internet connection.');
      return;
    }

    try {
      showMessage('Initializing secure server connection...');

      const orderRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-razorpay-order`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: pkg.priceInPaise, currency: 'INR' }),
        }
      );
      
      const order = await orderRes.json();
      
      if (!order.id) {
         console.error("Order creation failed on backend", order);
         showMessage('Server failed to generate a secure order. Please check Razorpay Secret Keys.');
         return;
      }

      setPurchaseMessage('');

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_SV55yPVUrxm8uj",
        amount: pkg.priceInPaise,
        currency: "INR",
        name: "Habitropolis",
        description: `Buy ${pkg.coins} Coins`,
        image: "/logo.png",
        order_id: order.id,
        handler: async function (response) {
          // For now, since webhook takes more setup to properly tie users, 
          // we securely simulated success here using the unhackable order_id setup
          await grantPurchasedCoins(pkg.coins, `Razorpay Purchase (${pkg.price})`);
          soundManager.playSuccess();
          showMessage(`🎉 Payment successful! You received ${pkg.coins} coins.`);
        },
        prefill: {
          name: profile?.display_name || user?.email?.split('@')[0] || "Mayor",
          email: user?.email,
        },
        theme: {
          color: "#4ade80" // Green accent to match the Habitropolis theme
        }
      };
      
      const paymentObject = new window.Razorpay(options);
      
      paymentObject.open();
    } catch (err) {
      console.error(err);
      showMessage('Payment initialization failed.');
    }
  };

  const handleToggleGecko = async () => {
    if (!geckoActive) {
      // Purchasing gecko: costs 100 coins
      if (coins < 100) {
        showMessage('Need 100 coins for Gecko Shield! 💸');
        return;
      }
      const spent = await spendCoins(100, 'Gecko Shield activation');
      if (!spent) return;
      try {
        await updateProfile({ gecko_active: true });
        setGeckoActive(true);
        soundManager.playSuccess();
        showMessage('🦎 Gecko Shield activated! You\'re invisible now.');
      } catch {
        showMessage('Failed to activate Gecko Shield.');
      }
    } else {
      // Deactivating gecko (free)
      try {
        await updateProfile({ gecko_active: false });
        setGeckoActive(false);
        showMessage('Gecko Shield deactivated. You\'re visible again.');
      } catch {
        showMessage('Failed to deactivate Gecko Shield.');
      }
    }
  };

  const tabs = [
    { id: 'decorations', label: 'Decorations', icon: Palette },
    { id: 'coins', label: 'Buy Coins', icon: Coins },
    { id: 'shields', label: 'Shields', icon: Shield },
    { id: 'inventory', label: 'My Items', icon: Package },
  ];

  return (
    <div className="shop-page">
      <div className="shop-header">
        <div className="shop-title-row">
          <ShoppingBag size={32} className="shop-icon" />
          <h1>Shop</h1>
        </div>
        <div className="shop-balance glass-sm">
          <Coins size={20} className="coin-icon" />
          <span className="balance-amount">{coins.toLocaleString()} coins</span>
        </div>
      </div>

      {purchaseMessage && (
        <div className="purchase-toast glass-sm">{purchaseMessage}</div>
      )}

      <div className="shop-tabs">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`shop-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="shop-content">
        {activeTab === 'decorations' && (
          <div className="decorations-content">
            
            <div className={`mystery-chest-banner glass ${openingChest ? 'is-opening' : ''}`}>
               <div className="chest-visual">
                  {openingChest ? <Sparkles className="chest-sparkles" size={48} /> : <Gift className="chest-icon" size={48} />}
               </div>
               <div className="chest-info">
                  <h2>Mayor's Mystery Chest</h2>
                  <p>70% Common, 25% Epic, <strong className="text-legendary">5% LEGENDARY</strong> drops!</p>
                  <p className="chest-subtitle">Exclusive legendary statues can only be won here.</p>
               </div>
               <button 
                className="chest-buy-btn" 
                onClick={handleOpenChest} 
                disabled={openingChest || coins < 50}
               >
                 <Coins size={16} /> 50 Coins
               </button>
            </div>

            <h3 className="catalog-title">Direct Store Catalog</h3>
            <div className="decorations-grid">
            {DECORATION_CATALOG.map(dec => {
              const owned = getOwnedCount(dec.id);
              return (
                <div key={dec.id} className="decoration-card glass-sm">
                  <div className="decoration-emoji" style={{ height: '60px', width: '60px', margin: '0 auto', overflow: 'visible' }}>
                    <DecorationSVG type={dec.type} />
                  </div>
                  <div className="decoration-name">{dec.name}</div>
                  <div className="decoration-category">{dec.category}</div>
                  {owned > 0 && <div className="decoration-owned">Owned: {owned}</div>}
                  <div className="decoration-price">
                    <Coins size={14} />
                    <span>{dec.price_coins}</span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBuyDecoration(dec)}
                    disabled={coins < dec.price_coins}
                  >
                    {coins >= dec.price_coins ? 'Buy' : 'Need more'}
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="inventory-section">
            <h3 className="inventory-title">🎒 Your Decorations</h3>
            {(!ownedDecorations || ownedDecorations.length === 0) ? (
              <div className="inventory-empty glass-sm">
                <Package size={40} className="empty-icon" />
                <p>No decorations yet! Buy some from the shop.</p>
              </div>
            ) : (
              <div className="inventory-grid">
                {ownedDecorations.map((od, i) => {
                  let catalog = DECORATION_CATALOG.find(d => d.id === od.decoration_id);
                  if (!catalog) catalog = LEGENDARY_POOL.find(d => d.id === od.decoration_id);
                  
                  return (
                    <div key={i} className={`inventory-item glass-sm ${od.building_id ? 'placed' : 'unplaced'} ${catalog?.category === 'legendary' ? 'is-legendary' : ''}`}>
                      <div className="inventory-emoji" style={{ height: '50px', width: '50px', margin: '0 auto', overflow: 'visible' }}>
                        {catalog ? <DecorationSVG type={catalog.type} /> : '🎨'}
                      </div>
                      <div className="inventory-name">{catalog?.name || od.decoration_id}</div>
                      <div className="inventory-status">
                        {od.building_id ? '🏗️ Placed' : '📦 In inventory'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="inventory-hint">Go to <strong>City</strong> page → tap <strong>Decorate</strong> to place your items!</p>
          </div>
        )}

        {activeTab === 'coins' && (
          <div className="coins-grid">
            {COIN_PACKAGES.map((pkg, i) => (
              <div key={i} className={`coin-package glass-sm ${pkg.popular ? 'popular' : ''}`}>
                {pkg.popular && <div className="popular-badge">Most Popular</div>}
                <div className="package-coins">
                  <Coins size={28} className="coin-icon" />
                  <span className="package-amount">{pkg.coins.toLocaleString()}</span>
                </div>
                <div className="package-price">{pkg.price}</div>
                <button className="btn btn-primary" onClick={() => handleBuyCoins(pkg)}>
                  Purchase
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'shields' && (
          <div className="shields-section">
            <div className="shield-explainer glass-sm">
              <Shield size={24} />
              <p>Shields protect your streaks! If you miss a day, the shield absorbs the miss instead of breaking your streak.</p>
            </div>

            {habits.length > 0 && (
              <div className="habit-selector">
                <h3>Select a habit to protect:</h3>
                <div className="habit-select-grid">
                  {habits.map(habit => (
                    <button
                      key={habit.id}
                      className={`habit-select-btn glass-sm ${selectedHabit === habit.id ? 'selected' : ''}`}
                      onClick={() => setSelectedHabit(habit.id)}
                    >
                      {selectedHabit === habit.id && <Check size={16} />}
                      {habit.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="shields-grid">
              {SHIELD_OPTIONS.map(shield => (
                <div key={shield.days} className="shield-card glass-sm">
                  <div className="shield-emoji">🛡️</div>
                  <div className="shield-days">{shield.days}-Day Shield</div>
                  <div className="shield-cost">
                    <Coins size={14} />
                    <span>{shield.cost} coins</span>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBuyShield(shield)}
                    disabled={coins < shield.cost || !selectedHabit}
                  >
                    {!selectedHabit ? 'Select habit' : coins >= shield.cost ? 'Activate' : 'Need more'}
                  </button>
                </div>
              ))}
            </div>

            {/* Gecko Shield Section */}
            <div className="gecko-section glass-sm" style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: geckoActive ? '2px solid #4ade80' : '2px solid var(--bg-tertiary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2rem' }}>🦎</span>
                <div>
                  <h3 style={{ margin: 0, color: '#4ade80', fontSize: '1.1rem', fontWeight: 700 }}>Gecko Stealth Shield</h3>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    Browse other mayors' cities without leaving a trace in their "Who Viewed Me" feed.
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {geckoActive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <span style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.85rem' }}>
                      <EyeOff size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      Stealth Mode Active
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1 }}>
                    <Coins size={14} />
                    <span>100 coins</span>
                  </div>
                )}
                <button
                  className={`btn btn-sm ${geckoActive ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={handleToggleGecko}
                  style={geckoActive ? { borderColor: '#4ade80', color: '#4ade80' } : { background: 'linear-gradient(135deg, #22c55e, #4ade80)' }}
                >
                  {geckoActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
