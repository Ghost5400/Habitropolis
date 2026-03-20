import { useEffect, useState, useRef } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useCity } from '../hooks/useCity';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import Building from '../components/Building';
import { Building2, Sparkles } from 'lucide-react';
import './CityPage.css';

const DECORATION_CATALOG = {
  'flag-red': { emoji: '🚩', name: 'Red Flag' },
  'flag-blue': { emoji: '🏳️', name: 'Blue Flag' },
  'garden': { emoji: '🌿', name: 'Garden' },
  'flowers': { emoji: '🌸', name: 'Flower Bed' },
  'tree': { emoji: '🌳', name: 'Tree' },
  'lights': { emoji: '✨', name: 'Fairy Lights' },
  'lantern': { emoji: '🏮', name: 'Lantern' },
  'fountain': { emoji: '⛲', name: 'Fountain' },
  'bench': { emoji: '🪑', name: 'Bench' },
  'mailbox': { emoji: '📮', name: 'Mailbox' },
  'satellite': { emoji: '📡', name: 'Satellite Dish' },
  'solar': { emoji: '☀️', name: 'Solar Panel' },
  'clock': { emoji: '🕐', name: 'Clock Tower' },
  'statue': { emoji: '🗽', name: 'Statue' },
  'pool': { emoji: '🏊', name: 'Swimming Pool' },
};

const GRID_SIZE = 10;
const TILE_W = 120;
const TILE_H = 60;
const START_Y = 150; // Base vertical offset for the isometric diamond grid

// Projection function for mathematical 2.5D placement
const getScreenPos = (col, row) => ({
  x: `calc(50% + ${(col - row) * (TILE_W / 2)}px)`,
  y: START_Y + (col + row) * (TILE_H / 2),
  zIndex: col + row
});

export default function CityPage() {
  const { user } = useAuth();
  const { habits, loading: habitsLoading } = useHabits();
  const { buildings, getBuildingForHabit, getMaxFloors, placeDecoration } = useCity();
  const { ownedDecorations } = useGame();
  
  const [layout, setLayout] = useState({});
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  
  // Drag and Drop State
  const [draggedHabit, setDraggedHabit] = useState(null);
  const [hoverTile, setHoverTile] = useState(null);

  // Decoration State
  const [decorateMode, setDecorateMode] = useState(false);
  const [placingDecoration, setPlacingDecoration] = useState(null);
  const [message, setMessage] = useState('');

  const totalStars = buildings.reduce((sum, b) => sum + (b.golden_stars || 0), 0);
  const totalFloors = buildings.reduce((sum, b) => sum + (b.floors || 0), 0);
  const unplacedDecorations = (ownedDecorations || []).filter(od => !od.building_id);

  // Load layout from localStorage on mount
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`habitropolis_layout_${user.id}`);
    if (stored) setLayout(JSON.parse(stored));
  }, [user]);

  // Auto-place unassigned habits
  useEffect(() => {
    if (!habits.length || !user) return;
    
    let updated = false;
    const newLayout = { ...layout };
    const occupied = new Set(Object.values(newLayout).map(p => `${p.col},${p.row}`));

    habits.forEach(habit => {
      if (!newLayout[habit.id]) {
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            if (!occupied.has(`${c},${r}`)) {
              newLayout[habit.id] = { col: c, row: r };
              occupied.add(`${c},${r}`);
              updated = true;
              break;
            }
          }
          if (newLayout[habit.id]) break; // Assigned
        }
      }
    });

    if (updated) {
      setLayout(newLayout);
      localStorage.setItem(`habitropolis_layout_${user.id}`, JSON.stringify(newLayout));
    }
  }, [habits, user]);

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePlaceDecoration = async (habitId) => {
    if (!placingDecoration) return;
    try {
      await placeDecoration(habitId, placingDecoration.decoration_id);
      showMessage(`Placed ${DECORATION_CATALOG[placingDecoration.decoration_id]?.emoji || '🎨'}!`);
      setPlacingDecoration(null);
      setDecorateMode(false);
    } catch (err) {
      console.error(err);
      showMessage('Failed to place decoration');
    }
  };

  // Drag and Drop Handlers
  const onDragStart = (e, habitId) => {
    setDraggedHabit(habitId);
    e.dataTransfer.setData('text/plain', habitId);
    
    // Create an invisible drag image to prevent giant ghosts
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const onDragOver = (e, col, row) => {
    e.preventDefault();
    if (!draggedHabit) return;

    if (hoverTile?.col !== col || hoverTile?.row !== row) {
      setHoverTile({ col, row });
    }
  };

  const onDragLeave = () => {
    setHoverTile(null);
  };

  const onDrop = (e, targetCol, targetRow) => {
    e.preventDefault();
    setHoverTile(null);
    
    const habitId = e.dataTransfer.getData('text/plain');
    if (!habitId) return;

    setLayout(prev => {
      const newLayout = { ...prev };
      const oldSpot = { ...newLayout[habitId] };
      
      // Check for occupant
      const occupantEntry = Object.entries(newLayout).find(
        ([id, p]) => p.col === targetCol && p.row === targetRow && id !== habitId
      );

      // Swap if occupied
      if (occupantEntry) {
        const occupantId = occupantEntry[0];
        newLayout[occupantId] = oldSpot;
      }
      
      newLayout[habitId] = { col: targetCol, row: targetRow };
      localStorage.setItem(`habitropolis_layout_${user.id}`, JSON.stringify(newLayout));
      return newLayout;
    });
    setDraggedHabit(null);
  };

  if (habitsLoading) {
    return <div className="city-loading"><div className="loading-spinner" />Loading your town builder...</div>;
  }

  // Generate the 100 tiles
  const tiles = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const { x, y, zIndex } = getScreenPos(c, r);
      const isHovered = hoverTile?.col === c && hoverTile?.row === r;
      
      tiles.push(
        <div
          key={`${c}-${r}`}
          className={`iso-grid-tile ${isHovered ? 'drag-over' : ''}`}
          style={{
            left: x,
            top: `${y}px`,
            zIndex: zIndex,
            transform: 'translate(-50%, -50%)',
            width: `${TILE_W}px`,
            height: `${TILE_H}px`
          }}
          onDragOver={(e) => onDragOver(e, c, r)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, c, r)}
        />
      );
    }
  }

  return (
    <div className="city-page">
      <div className="city-header">
        <div className="city-title-row">
          <Building2 size={32} className="city-icon" />
          <h1>Interactive Town Builder</h1>
        </div>
        <p className="city-subtitle">Drag and Drop buildings to rearrange your base!</p>

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

      {message && <div className="city-toast glass-sm">{message}</div>}

      {decorateMode && (
        <div className="decoration-panel glass">
          <h3>
            {placingDecoration
              ? '👆 Now click a building to place it!'
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
              <button className="btn btn-secondary btn-sm" onClick={() => setPlacingDecoration(null)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {habits.length === 0 ? (
        <div className="city-empty glass">
          <Building2 size={64} className="empty-icon" />
          <h3>Your base is empty</h3>
          <p>Create habits to start building your clash matrix!</p>
        </div>
      ) : (
        <div className="town-builder-scene">
          {/* Base Environment */}
          <div className="town-sky" />
          <div className="town-sun" />

          {/* Mathematical Grid Area */}
          <div className="town-grid-container">
            {/* The 100 interactive grid tiles */}
            {tiles}

            {/* The Draggable Buildings */}
            {habits.map(habit => {
              const building = getBuildingForHabit(habit.id);
              const maxFloors = getMaxFloors(habit.frequency);
              const pos = layout[habit.id];
              
              if (!pos) return null; // Safe fallback just in case
              const { x, y, zIndex } = getScreenPos(pos.col, pos.row);

              return (
                <div
                  key={habit.id}
                  draggable={!placingDecoration} // Can't drag while decorating
                  onDragStart={(e) => onDragStart(e, habit.id)}
                  className={`draggable-building-wrapper ${draggedHabit === habit.id ? 'is-dragging' : ''} ${placingDecoration ? 'placeable' : ''}`}
                  style={{
                    left: x,
                    top: `${y}px`,
                    zIndex: zIndex + 10, // Always above the empty tiles
                    transform: 'translate(-50%, -100%)' // Shift so base touches exactly the center of the tile
                  }}
                  onClick={() => {
                    if (placingDecoration) handlePlaceDecoration(habit.id);
                    else setSelectedBuilding(selectedBuilding === habit.id ? null : habit.id);
                  }}
                >
                  <Building
                    habit={habit}
                    building={building}
                    maxFloors={maxFloors}
                    isSelected={selectedBuilding === habit.id}
                    onClick={() => {}}
                  />
                  
                  {/* Floating decorations */}
                  {(building.decorations || []).length > 0 && (
                    <div className="placed-decorations-wrapper">
                      {building.decorations.map((decId, idx) => (
                        <span key={idx} className="placed-decoration-badge" style={{ '--idx': idx }}>
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
      )}

      {/* Detail modal exactly as before */}
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
                  <span className="detail-label">Grid Coord</span>
                  <span className="detail-value">{(layout[habit.id]?.col ?? '?')}, {(layout[habit.id]?.row ?? '?')}</span>
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
