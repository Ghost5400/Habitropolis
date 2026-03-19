import { useEffect, useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useCity } from '../hooks/useCity';
import { useGame } from '../contexts/GameContext';
import Building from '../components/Building';
import { Building2, Star, Sparkles, ArrowLeft } from 'lucide-react';
import './CityPage.css';

const DECORATION_CATALOG = {
  'flag-red': { emoji: '🚩', name: 'Red Flag', slot: 'rooftop' },
  'flag-blue': { emoji: '🏳️', name: 'Blue Flag', slot: 'rooftop' },
  'garden': { emoji: '🌿', name: 'Garden', slot: 'ground' },
  'flowers': { emoji: '🌸', name: 'Flower Bed', slot: 'ground' },
  'tree': { emoji: '🌳', name: 'Tree', slot: 'ground' },
  'lights': { emoji: '✨', name: 'Fairy Lights', slot: 'wall' },
  'lantern': { emoji: '🏮', name: 'Lantern', slot: 'wall' },
  'fountain': { emoji: '⛲', name: 'Fountain', slot: 'ground' },
  'bench': { emoji: '🪑', name: 'Bench', slot: 'ground' },
  'mailbox': { emoji: '📮', name: 'Mailbox', slot: 'ground' },
  'satellite': { emoji: '📡', name: 'Satellite Dish', slot: 'rooftop' },
  'solar': { emoji: '☀️', name: 'Solar Panel', slot: 'rooftop' },
  'clock': { emoji: '🕐', name: 'Clock Tower', slot: 'rooftop' },
  'statue': { emoji: '🗽', name: 'Statue', slot: 'ground' },
  'pool': { emoji: '🏊', name: 'Swimming Pool', slot: 'ground' },
};

export default function CityPage() {
  const { habits, loading: habitsLoading } = useHabits();
  const { buildings, getBuildingForHabit, getMaxFloors, placeDecoration } = useCity();
  const { ownedDecorations } = useGame();
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [decorateMode, setDecorateMode] = useState(false);
  const [placingDecoration, setPlacingDecoration] = useState(null);
  const [message, setMessage] = useState('');

  const totalStars = buildings.reduce((sum, b) => sum + (b.golden_stars || 0), 0);
  const totalFloors = buildings.reduce((sum, b) => sum + (b.floors || 0), 0);

  // Get decorations that are NOT yet placed on a building
  const unplacedDecorations = (ownedDecorations || []).filter(od => !od.building_id);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePlaceDecoration = async (habitId) => {
    if (!placingDecoration) return;
    try {
      await placeDecoration(habitId, placingDecoration.decoration_id);
      showMessage(`Placed ${DECORATION_CATALOG[placingDecoration.decoration_id]?.emoji || '🎨'} on building!`);
      setPlacingDecoration(null);
      setDecorateMode(false);
    } catch (err) {
      console.error('Error placing decoration:', err);
      showMessage('Failed to place decoration');
    }
  };

  if (habitsLoading) {
    return <div className="city-loading"><div className="loading-spinner" />Loading your city...</div>;
  }

  return (
    <div className="city-page">
      <div className="city-header">
        <div className="city-title-row">
          <Building2 size={32} className="city-icon" />
          <h1>Your City</h1>
        </div>
        <p className="city-subtitle">Each habit is a building. Keep your streaks to make them grow!</p>

        <div className="city-overview">
          <div className="city-stat glass-sm">
            <span className="city-stat-value">{habits.length}</span>
            <span className="city-stat-label">Buildings</span>
          </div>
          <div className="city-stat glass-sm">
            <span className="city-stat-value">{totalFloors}</span>
            <span className="city-stat-label">Total Floors</span>
          </div>
          <div className="city-stat glass-sm">
            <span className="city-stat-value">{totalStars} ⭐</span>
            <span className="city-stat-label">Golden Stars</span>
          </div>
          {unplacedDecorations.length > 0 && (
            <button
              className={`city-decorate-btn glass-sm ${decorateMode ? 'active' : ''}`}
              onClick={() => { setDecorateMode(!decorateMode); setPlacingDecoration(null); }}
            >
              <Sparkles size={18} />
              <span>Decorate ({unplacedDecorations.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Message toast */}
      {message && <div className="city-toast glass-sm">{message}</div>}

      {/* Decoration picker panel */}
      {decorateMode && (
        <div className="decoration-panel glass">
          <h3>
            {placingDecoration
              ? '👆 Now tap a building to place it!'
              : '🎨 Select a decoration to place:'}
          </h3>
          {!placingDecoration && (
            <div className="decoration-picker">
              {unplacedDecorations.map((od, i) => {
                const info = DECORATION_CATALOG[od.decoration_id] || { emoji: '🎨', name: od.decoration_id };
                return (
                  <button
                    key={`${od.decoration_id}-${i}`}
                    className="decoration-pick-btn glass-sm"
                    onClick={() => setPlacingDecoration(od)}
                  >
                    <span className="decoration-pick-emoji">{info.emoji}</span>
                    <span className="decoration-pick-name">{info.name}</span>
                  </button>
                );
              })}
            </div>
          )}
          {placingDecoration && (
            <div className="placing-indicator">
              <span className="placing-emoji">
                {DECORATION_CATALOG[placingDecoration.decoration_id]?.emoji || '🎨'}
              </span>
              <span>{DECORATION_CATALOG[placingDecoration.decoration_id]?.name}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setPlacingDecoration(null)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {habits.length === 0 ? (
        <div className="city-empty glass">
          <Building2 size={64} className="empty-icon" />
          <h3>Your city is empty</h3>
          <p>Create habits to start building your city!</p>
        </div>
      ) : (
        <div className="city-scene">
          {/* Sky with stars */}
          <div className="city-sky">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="sky-star"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 4}s`,
                  '--star-size': `${2 + Math.random() * 3}px`,
                }}
              />
            ))}
            <div className="city-moon" />
          </div>

          {/* Buildings on ground */}
          <div className="city-ground">
            <div className="city-buildings-row">
              {habits.map(habit => {
                const building = getBuildingForHabit(habit.id);
                const maxFloors = getMaxFloors(habit.frequency);
                return (
                  <div
                    key={habit.id}
                    className={`city-building-slot ${placingDecoration ? 'placeable' : ''} ${selectedBuilding === habit.id ? 'selected' : ''}`}
                    onClick={() => {
                      if (placingDecoration) {
                        handlePlaceDecoration(habit.id);
                      } else {
                        setSelectedBuilding(selectedBuilding === habit.id ? null : habit.id);
                      }
                    }}
                  >
                    <Building
                      habit={habit}
                      building={building}
                      maxFloors={maxFloors}
                      isSelected={selectedBuilding === habit.id}
                      onClick={() => {}}
                    />
                    {/* Render decorations around building */}
                    {(building.decorations || []).length > 0 && (
                      <div className="building-decorations-display">
                        {building.decorations.map((decId, idx) => (
                          <span key={idx} className="placed-decoration" style={{ '--dec-index': idx }}>
                            {DECORATION_CATALOG[decId]?.emoji || '🎨'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ground line */}
          <div className="city-ground-line" />
          <div className="city-road" />
        </div>
      )}

      {/* Detail modal */}
      {selectedBuilding && !placingDecoration && (() => {
        const habit = habits.find(h => h.id === selectedBuilding);
        const building = getBuildingForHabit(selectedBuilding);
        const maxFloors = getMaxFloors(habit?.frequency);
        if (!habit) return null;
        return (
          <div className="building-detail" onClick={() => setSelectedBuilding(null)}>
            <div className="building-detail-content glass" onClick={e => e.stopPropagation()}>
              <h3 style={{ color: habit.color || 'var(--accent-primary)' }}>{habit.name}</h3>
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="detail-label">Floors</span>
                  <span className="detail-value">{building.floors}/{maxFloors}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Golden Stars</span>
                  <span className="detail-value">{building.golden_stars} ⭐</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Frequency</span>
                  <span className="detail-value">{habit.frequency}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Decorations</span>
                  <span className="detail-value">
                    {(building.decorations || []).map((d, i) => (
                      <span key={i}>{DECORATION_CATALOG[d]?.emoji || '🎨'}</span>
                    ))}
                    {(building.decorations || []).length === 0 && 'None'}
                  </span>
                </div>
              </div>
              <div className="detail-progress">
                <div className="progress-label">Building Progress</div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${(building.floors / maxFloors) * 100}%` }}
                  />
                </div>
              </div>
              <button className="btn btn-secondary w-full" style={{ marginTop: '1rem' }} onClick={() => setSelectedBuilding(null)}>
                Close
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
