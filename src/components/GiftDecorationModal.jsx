import { useState } from 'react';
import { X, Gift, Coins, Check } from 'lucide-react';
import DecorationSVG from './DecorationSVG';
import { useCoins } from '../hooks/useCoins';
import { useGifts } from '../hooks/useGifts';
import { useGame } from '../contexts/GameContext';
import '../pages/ShopPage.css';
import './GiftDecorationModal.css';

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

export default function GiftDecorationModal({ onClose, receiverId, receiverName }) {
  const { coins, spendCoins } = useGame();
  const { sendGift } = useGifts();
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendGift = async () => {
    if (!selectedItem || isSending) return;
    
    if (coins < selectedItem.price_coins) {
      setErrorMsg('Not enough coins!');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    try {
      setIsSending(true);
      setErrorMsg('');
      
      // Deduct coins locally and via the GameContext hook
      const spent = await spendCoins(selectedItem.price_coins, `Gifted ${selectedItem.name} to ${receiverName}`);
      if (!spent) throw new Error('Transaction failed');

      // Send the gift in DB
      await sendGift(receiverId, selectedItem.id);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
       console.error(err);
       setErrorMsg('Failed to send gift. Try again.');
       setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget && !isSending) onClose(); }}>
      <div className="modal-content shop-modal">
        <div className="modal-header">
          <div className="modal-title">
            <Gift className="text-primary" />
            <h2>Send a Gift to {receiverName}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} disabled={isSending}>
            <X size={20} />
          </button>
        </div>

        <div className="shop-balance glass-sm">
          <span>Your Balance:</span>
          <div className="balance-amount">
            <Coins size={18} className="text-gold" />
            <span>{coins}</span>
          </div>
        </div>

        {success ? (
          <div className="gift-success-state">
            <div className="gift-success-icon-wrapper">
              <Check size={40} className="text-promote" />
            </div>
            <h3>Gift Sent!</h3>
            <p className="text-muted">A special delivery is on its way to {receiverName}!</p>
          </div>
        ) : (
          <>
            <div className="gift-selection-area">
              <div className="decorations-grid">
              {DECORATION_CATALOG.map((item) => (
                <div 
                  key={item.id} 
                  className={`decoration-card glass-sm ${selectedItem?.id === item.id ? 'gift-selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                  style={{ cursor: 'pointer', border: selectedItem?.id === item.id ? '2px solid #4ade80' : 'none' }}
                >
                  <div className="decoration-emoji" style={{ height: '50px', width: '50px', margin: '0 auto' }}>
                    <DecorationSVG type={item.type} />
                  </div>
                  <div className="decoration-name" style={{ marginTop: '0.5rem' }}>{item.name}</div>
                  <div className="decoration-price" style={{ justifyContent: 'center' }}>
                    <Coins size={14} className="text-gold" />
                      <span className={coins >= item.price_coins ? '' : 'text-demote'}>
                        {item.price_coins}
                      </span>
                  </div>
                </div>
              ))}
              </div>
            </div>

            {errorMsg && <div className="error-msg text-center mt-4 text-demote">{errorMsg}</div>}

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSendGift} 
                disabled={!selectedItem || coins < selectedItem?.price_coins || isSending}
              >
                {isSending ? 'Sending...' : `Send Gift for ${selectedItem ? selectedItem.price_coins : 0}`} <Coins size={16}/>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
