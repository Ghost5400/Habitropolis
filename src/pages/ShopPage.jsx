import { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useCoins } from '../hooks/useCoins';
import { useStreaks } from '../hooks/useStreaks';
import { useHabits } from '../hooks/useHabits';
import { ShoppingBag, Palette, Coins, Shield, Check, Package } from 'lucide-react';
import './ShopPage.css';

const DECORATION_CATALOG = [
  { id: '11111111-0000-0000-0000-000000000001', name: 'Red Flag', category: 'rooftop', price_coins: 15, emoji: '🚩' },
  { id: '11111111-0000-0000-0000-000000000002', name: 'Blue Flag', category: 'rooftop', price_coins: 15, emoji: '🏳️' },
  { id: '11111111-0000-0000-0000-000000000003', name: 'Garden', category: 'garden', price_coins: 25, emoji: '🌿' },
  { id: '11111111-0000-0000-0000-000000000004', name: 'Flower Bed', category: 'garden', price_coins: 20, emoji: '🌸' },
  { id: '11111111-0000-0000-0000-000000000005', name: 'Tree', category: 'garden', price_coins: 30, emoji: '🌳' },
  { id: '11111111-0000-0000-0000-000000000006', name: 'Fairy Lights', category: 'lights', price_coins: 35, emoji: '✨' },
  { id: '11111111-0000-0000-0000-000000000007', name: 'Lantern', category: 'lights', price_coins: 20, emoji: '🏮' },
  { id: '11111111-0000-0000-0000-000000000008', name: 'Fountain', category: 'garden', price_coins: 50, emoji: '⛲' },
  { id: '11111111-0000-0000-0000-000000000009', name: 'Bench', category: 'garden', price_coins: 15, emoji: '🪑' },
  { id: '11111111-0000-0000-0000-000000000010', name: 'Mailbox', category: 'garden', price_coins: 10, emoji: '📮' },
  { id: '11111111-0000-0000-0000-000000000011', name: 'Satellite Dish', category: 'rooftop', price_coins: 40, emoji: '📡' },
  { id: '11111111-0000-0000-0000-000000000012', name: 'Solar Panel', category: 'rooftop', price_coins: 45, emoji: '☀️' },
  { id: '11111111-0000-0000-0000-000000000013', name: 'Clock Tower', category: 'rooftop', price_coins: 60, emoji: '🕐' },
  { id: '11111111-0000-0000-0000-000000000014', name: 'Statue', category: 'garden', price_coins: 75, emoji: '🗽' },
  { id: '11111111-0000-0000-0000-000000000015', name: 'Swimming Pool', category: 'garden', price_coins: 100, emoji: '🏊' },
];

const COIN_PACKAGES = [
   { coins: 100, price: '₹0.99', popular: false },
   { coins: 500, price: '₹3.99', popular: true },
   { coins: 1200, price: '₹7.99', popular: false },
   { coins: 3000, price: '₹14.99', popular: false },
 ];

const SHIELD_OPTIONS = [
  { days: 1, cost: 10 },
  { days: 3, cost: 25 },
  { days: 5, cost: 38 },
  { days: 7, cost: 50 },
];

export default function ShopPage() {
  const { coins, spendCoins, buyDecoration, ownedDecorations, refreshData } = useGame();
  const { habits } = useHabits();
  const { buyShield } = useStreaks();
  const [activeTab, setActiveTab] = useState('decorations');
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [purchaseMessage, setPurchaseMessage] = useState('');

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

    // Use the buyDecoration from GameContext which properly inserts into user_decorations
    const success = await buyDecoration(decoration.id, null);
    if (success) {
      showMessage(`Bought ${decoration.emoji} ${decoration.name}! Go to City to place it 🏙️`);
    } else {
      showMessage('Purchase failed. Try again.');
    }
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

  const handleBuyCoins = (pkg) => {
    showMessage('💳 Payment integration coming soon! (Stripe → Wise)');
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
          <div className="decorations-grid">
            {DECORATION_CATALOG.map(dec => {
              const owned = getOwnedCount(dec.id);
              return (
                <div key={dec.id} className="decoration-card glass-sm">
                  <div className="decoration-emoji">{dec.emoji}</div>
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
                  const catalog = DECORATION_CATALOG.find(d => d.id === od.decoration_id);
                  return (
                    <div key={i} className={`inventory-item glass-sm ${od.building_id ? 'placed' : 'unplaced'}`}>
                      <div className="inventory-emoji">{catalog?.emoji || '🎨'}</div>
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
          </div>
        )}
      </div>
    </div>
  );
}
