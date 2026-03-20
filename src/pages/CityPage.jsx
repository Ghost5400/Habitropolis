import { useEffect, useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useCity } from '../hooks/useCity';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import Building from '../components/Building';
import { Building2, Sparkles, X, Sunrise, Moon } from 'lucide-react';
import './CityPage.css';

const DECORATION_CATALOG = {
  '11111111-0000-0000-0000-000000000001': { emoji: '🚩', name: 'Red Flag' },
  '11111111-0000-0000-0000-000000000002': { emoji: '🏳️', name: 'Blue Flag' },
  '11111111-0000-0000-0000-000000000003': { emoji: '🌿', name: 'Garden' },
  '11111111-0000-0000-0000-000000000004': { emoji: '🌸', name: 'Flower Bed' },
  '11111111-0000-0000-0000-000000000005': { emoji: '🌳', name: 'Tree' },
  '11111111-0000-0000-0000-000000000006': { emoji: '✨', name: 'Fairy Lights' },
  '11111111-0000-0000-0000-000000000007': { emoji: '🏮', name: 'Lantern' },
  '11111111-0000-0000-0000-000000000008': { emoji: '⛲', name: 'Fountain' },
  '11111111-0000-0000-0000-000000000009': { emoji: '🪑', name: 'Bench' },
  '11111111-0000-0000-0000-000000000010': { emoji: '📮', name: 'Mailbox' },
  '11111111-0000-0000-0000-000000000011': { emoji: '📡', name: 'Satellite Dish' },
  '11111111-0000-0000-0000-000000000012': { emoji: '☀️', name: 'Solar Panel' },
  '11111111-0000-0000-0000-000000000013': { emoji: '🕐', name: 'Clock Tower' },
  '11111111-0000-0000-0000-000000000014': { emoji: '🗽', name: 'Statue' },
  '11111111-0000-0000-0000-000000000015': { emoji: '🏊', name: 'Swimming Pool' },
};

const TILE_W = 120;
const TILE_H = 60;
const START_Y = 150; 

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
  
  // Drag State
  const [draggedItem, setDraggedItem] = useState(null); // { type: 'building'|'decoration', id: string }
  const [hoverTile, setHoverTile] = useState(null);

  const [message, setMessage] = useState('');
  
  // Realtime Sky calculations
  const [isDay, setIsDay] = useState(true);

  useEffect(() => {
    const curHour = new Date().getHours();
    setIsDay(curHour >= 6 && curHour < 18);
    const timer = setInterval(() => {
      const h = new Date().getHours();
      setIsDay(h >= 6 && h < 18);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Stats
  const totalStars = buildings.reduce((sum, b) => sum + (b.golden_stars || 0), 0);
  const totalFloors = buildings.reduce((sum, b) => sum + (b.floors || 0), 0);

  // Calculate highest city level
  const highestStars = Math.max(0, ...buildings.map(b => b.golden_stars || 0));
  const cityLvl = Math.min(7, highestStars + 1);
  const GRID_SIZE = cityLvl + 3;

  // Filter elements into grid/tray arrays
  const placedHabits = habits.filter(h => layout[h.id] != null);
  const unplacedHabits = habits.filter(h => layout[h.id] == null);

  // Parse standalone decorations
  const placedDecorations = (ownedDecorations || []).filter(od => layout[`deco_${od.id}`] != null);
  const unplacedDecorations = (ownedDecorations || []).filter(od => !od.building_id && layout[`deco_${od.id}`] == null);

  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem(`habitropolis_layout_${user.id}`);
    if (stored) setLayout(JSON.parse(stored));
  }, [user]);

  const updateLayout = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem(`habitropolis_layout_${user.id}`, JSON.stringify(newLayout));
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const onDragStart = (e, type, id) => {
    setDraggedItem({ type, id });
    e.dataTransfer.setData('text/plain', id);
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const onDragOverGrid = (e, col, row) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (hoverTile?.col !== col || hoverTile?.row !== row || hoverTile?.type !== 'grid') {
      setHoverTile({ type: 'grid', col, row });
    }
  };

  const onDragOverTray = (e) => {
    e.preventDefault();
    if (hoverTile?.type !== 'tray') setHoverTile({ type: 'tray' });
  };

  const onDropGrid = (e, targetCol, targetRow) => {
    e.preventDefault();
    setHoverTile(null);
    if (!draggedItem) return;

    const newLayout = { ...layout };
    const stateKey = draggedItem.type === 'decoration' ? `deco_${draggedItem.id}` : draggedItem.id;
    const oldSpot = newLayout[stateKey];
    
    // Check if the target tile is occupied
    const occupantEntry = Object.entries(newLayout).find(
      ([id, p]) => p.col === targetCol && p.row === targetRow && id !== stateKey
    );

    if (occupantEntry) {
      if (oldSpot) newLayout[occupantEntry[0]] = oldSpot; // Swap!
      else delete newLayout[occupantEntry[0]]; // Bump occupant back to tray
    }
    
    newLayout[stateKey] = { col: targetCol, row: targetRow };
    updateLayout(newLayout);
    setDraggedItem(null);
  };

  const onDropTray = (e) => {
    e.preventDefault();
    setHoverTile(null);
    if (!draggedItem) return;

    const newLayout = { ...layout };
    const stateKey = draggedItem.type === 'decoration' ? `deco_${draggedItem.id}` : draggedItem.id;
    delete newLayout[stateKey];
    updateLayout(newLayout);
    setDraggedItem(null);
    showMessage(`${draggedItem.type === 'building' ? 'Building' : 'Decoration'} returned to inventory.`);
  };

  if (habitsLoading) {
    return <div className="city-loading"><div className="loading-spinner" />Loading your town builder...</div>;
  }

  const tiles = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const { x, y, zIndex } = getScreenPos(c, r);
      const isHoveredGrid = hoverTile?.type === 'grid' && hoverTile?.col === c && hoverTile?.row === r;
      
      tiles.push(
        <div
          key={`${c}-${r}`}
          className={`iso-grid-tile ${isHoveredGrid ? 'drag-over' : ''}`}
          style={{
            left: x, top: `${y}px`, zIndex,
            transform: 'translate(-50%, -50%)',
            width: `${TILE_W}px`, height: `${TILE_H}px`
          }}
          onDragOver={(e) => onDragOverGrid(e, c, r)}
          onDragLeave={() => setHoverTile(null)}
          onDrop={(e) => onDropGrid(e, c, r)}
        />
      );
    }
  }

  return (
    <div className="city-page">
      <div className="city-header">
        <div className="city-title-row">
          <Building2 size={32} className="city-icon" />
          <h1>{user?.user_metadata?.full_name?.split(' ')[0] || 'Your'} Town (Lv {cityLvl})</h1>
        </div>
        <div className="city-overview">
          <div className="city-stat glass-sm">{habits.length} Buildings</div>
          <div className="city-stat glass-sm">{totalFloors} Floors</div>
          <div className="city-stat glass-sm">{totalStars} ⭐ Stars</div>
          <div className="city-stat glass-sm sky-indicator">
            {isDay ? <><Sunrise size={16} /> Day</> : <><Moon size={16} /> Night</>}
          </div>
        </div>
      </div>

      {message && <div className="city-toast glass-sm">{message}</div>}

      <div className={`town-builder-viewport ${isDay ? 'is-day' : 'is-night'}`}>
        <div className="town-sky" />
        <div className="town-celestial" />
        
        <div className="town-grid-container">
          {tiles}

          {/* Render Standalone Decorations */}
          {placedDecorations.map(od => {
            const pos = layout[`deco_${od.id}`];
            const { x, y, zIndex } = getScreenPos(pos.col, pos.row);
            const info = DECORATION_CATALOG[od.decoration_id] || { emoji: '🎨', name: od.decoration_id };
            
            return (
              <div
                key={`deco_${od.id}`}
                draggable
                onDragStart={(e) => onDragStart(e, 'decoration', od.id)}
                className={`draggable-building-wrapper grid-decoration-item ${draggedItem?.id === od.id ? 'is-dragging' : ''}`}
                style={{
                  left: x, top: `${y}px`, zIndex: zIndex + 2, // slightly above building bases
                  transform: 'translate(-50%, -80%)',
                  fontSize: '2rem',
                  filter: 'drop-shadow(0 10px 5px rgba(0,0,0,0.4))'
                }}
                onDragOver={(e) => onDragOverGrid(e, pos.col, pos.row)}
                onDrop={(e) => onDropGrid(e, pos.col, pos.row)}
              >
                {info.emoji}
              </div>
            );
          })}

          {/* Render Buildings */}
          {placedHabits.map(habit => {
            const building = getBuildingForHabit(habit.id);
            const pos = layout[habit.id];
            const { x, y, zIndex } = getScreenPos(pos.col, pos.row);

            return (
              <div
                key={habit.id}
                draggable
                onDragStart={(e) => onDragStart(e, 'building', habit.id)}
                className={`draggable-building-wrapper ${draggedItem?.id === habit.id ? 'is-dragging' : ''}`}
                style={{
                  left: x, top: `${y}px`, zIndex: zIndex + 10,
                  transform: 'translate(-50%, -100%)'
                }}
                onClick={() => setSelectedBuilding(selectedBuilding === habit.id ? null : habit.id)}
                onDragOver={(e) => onDragOverGrid(e, pos.col, pos.row)}
                onDrop={(e) => onDropGrid(e, pos.col, pos.row)}
              >
                <Building
                  habit={habit}
                  building={building}
                  maxFloors={getMaxFloors(habit.frequency)}
                  isSelected={false}
                  onClick={() => {}}
                />
              </div>
            );
          })}
        </div>

        {/* Inventory Dropper Dock */}
        <div 
          className={`inventory-dock ${hoverTile?.type === 'tray' ? 'drag-over' : ''}`}
          onDragOver={onDragOverTray}
          onDrop={onDropTray}
        >
          <div className="dock-title">
            <span>Inventory Tray</span>
            <small>(Drag Items onto the Grass)</small>
          </div>
          
          <div className="dock-items">
            {unplacedHabits.map(habit => (
              <div 
                key={habit.id} 
                className="dock-item building-item glass-sm"
                draggable
                onDragStart={(e) => onDragStart(e, 'building', habit.id)}
              >
                <div className="dock-item-preview">
                  <Building 
                    habit={habit} 
                    building={getBuildingForHabit(habit.id)} 
                    maxFloors={getMaxFloors(habit.frequency)}
                  />
                </div>
                <span className="dock-item-name">{habit.name}</span>
              </div>
            ))}

            {unplacedDecorations.map((od, i) => {
              const info = DECORATION_CATALOG[od.decoration_id] || { emoji: '🎨', name: od.decoration_id };
              return (
                <div
                  key={`dec-${i}`}
                  className="dock-item deco-item glass-sm"
                  draggable
                  onDragStart={(e) => onDragStart(e, 'decoration', od.id)} // Critical: pass unique instance id
                >
                  <span className="dock-deco-emoji">{info.emoji}</span>
                  <span className="dock-item-name">{info.name}</span>
                </div>
              );
            })}

            {unplacedHabits.length === 0 && unplacedDecorations.length === 0 && (
              <div className="dock-empty">Inventory Empty</div>
            )}
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {selectedBuilding && (
        <div className="building-detail" onClick={() => setSelectedBuilding(null)}>
          <div className="building-detail-content glass" onClick={e => e.stopPropagation()}>
            {/* ... keeping modal code identical visually but slightly cleaner */}
            <div className="flex justify-between items-center mb-4">
               <h3 className="m-0" style={{ color: habits.find(h => h.id === selectedBuilding)?.color || 'white' }}>
                 {habits.find(h => h.id === selectedBuilding)?.name}
               </h3>
               <X className="cursor-pointer" onClick={() => setSelectedBuilding(null)}/>
            </div>
            
            <div className="detail-stats">
              <div className="detail-stat">
                <span className="detail-label">Coordinate</span>
                <span className="detail-value text-xl font-bold">{layout[selectedBuilding] ? `C${layout[selectedBuilding].col} R${layout[selectedBuilding].row}` : 'In Tray'}</span>
              </div>
            </div>
            <button className="btn btn-secondary w-full" onClick={() => setSelectedBuilding(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
