import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import './ParthPreviewModal.css';

export default function ParthPreviewModal({ friendId, onClose }) {
  const [friendData, setFriendData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!friendId) return;
    
    const fetchParth = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, parth_hunger, parth_equipped')
          .eq('user_id', friendId)
          .single();
          
        if (error) throw error;
        setFriendData(data);
      } catch (err) {
        console.error('Error fetching friend Parth:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchParth();
  }, [friendId]);

  if (!friendId) return null;

  const hunger = friendData?.parth_hunger ?? 50;
  const equipped = friendData?.parth_equipped || '';
  
  // Predict mood from hunger alone for social viewing
  let mood = 'neutral';
  let message = `Hi! I'm ${friendData?.display_name || 'Mayor'}'s Parth!`;
  let image = '/parth.png';
  
  if (hunger <= 20) {
    mood = 'sad';
    image = '/parth-sad.png';
    message = "I'm a bit hungry right now...";
  } else if (hunger >= 80) {
    mood = 'ecstatic';
    image = '/parth-ecstatic.png';
    message = `Life in ${friendData?.display_name}'s city is amazing!`;
  }

  return (
    <div className="parth-preview-overlay" onClick={onClose}>
      <div className="parth-preview-card glass" onClick={e => e.stopPropagation()}>
        <button className="preview-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        {loading ? (
          <div className="preview-loading">Loading Mascot...</div>
        ) : (
          <div className={`parth-mascot-container glass-sm mood-${mood}`}>
            <h3 style={{ margin: 0, paddingBottom: '1rem', color: 'var(--text-primary)' }}>
              {friendData?.display_name}'s Tiger
            </h3>
            
            <div className="parth-mood-scene">
              <img src={image} alt={`Parth`} className="parth-mascot-img" />
              
              {/* Inherit Aura styles from ParthMascot.css */}
              {equipped.includes('aura_sparkles') && (
                <div className="aura-layer aura-sparkles">
                  <span>✨</span><span>✨</span><span>✨</span>
                </div>
              )}
              {equipped.includes('aura_snow') && (
                <div className="aura-layer aura-snow">
                  <span>❄️</span><span>❄️</span><span>❄️</span>
                </div>
              )}
              {equipped.includes('aura_gold') && <div className="aura-layer aura-gold-ring"></div>}
              {equipped.includes('aura_shadow') && <div className="aura-layer aura-shadow-pulse"></div>}

              {/* Inherit Outfit styles from ParthMascot.css */}
              {equipped.includes('outfit_shades') && <div className="outfit-layer outfit-shades">🕶️</div>}
              {equipped.includes('outfit_cap') && <div className="outfit-layer outfit-cap">🧢</div>}
              {equipped.includes('outfit_headband') && <div className="outfit-layer outfit-headband">🏋️</div>}
              {equipped.includes('outfit_tophat') && <div className="outfit-layer outfit-tophat">🎩</div>}
              {equipped.includes('outfit_crown') && <div className="outfit-layer outfit-crown">👑</div>}
            </div>
            
            <div className="parth-status">
              <div className="parth-speech-bubble">
                {message}
              </div>
              
              <div className="hunger-bar-container" style={{ marginTop: '1rem' }}>
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
        )}
      </div>
    </div>
  );
}
