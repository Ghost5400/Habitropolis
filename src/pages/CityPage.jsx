import { useEffect, useState, useRef } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useCity } from '../hooks/useCity';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import Building from '../components/Building';
import { getBuildingName } from '../components/CityBuildingSVG';
import { Building2, Sparkles, X, Sunrise, Moon, Archive } from 'lucide-react';
import 'drag-drop-touch'; // Mobile Drag/Drop HTML5 Polyfill
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
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
    // User requested Day mode lasts until exactly 7:00 PM (19:00)
    setIsDay(curHour >= 6 && curHour < 19);
    const timer = setInterval(() => {
      const h = new Date().getHours();
      setIsDay(h >= 6 && h < 19);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Stats
  const totalStars = buildings.reduce((sum, b) => sum + (b.golden_stars || 0), 0);
  const totalFloors = buildings.reduce((sum, b) => sum + (b.floors || 0), 0);

  // Calculate highest city level
  const highestStars = Math.max(0, ...buildings.map(b => b.golden_stars || 0));
  const cityLvl = Math.min(7, highestStars + 1);
  const GRID_SIZE = 4; // Hardcoded 4x4 grid as requested

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

  const [hoveredItem, setHoveredItem] = useState(null);
  const holdTimers = useRef({});

  const handlePointerDown = (id, type) => {
    // Exactly 1.5 seconds is the UX golden standard for "long press"
    holdTimers.current[id] = setTimeout(() => {
      const newLayout = { ...layout };
      const stateKey = type === 'decoration' ? `deco_${id}` : id;
      delete newLayout[stateKey];
      updateLayout(newLayout);
      showMessage(`${type === 'building' ? 'Building' : 'Decoration'} returned to inventory!`);
    }, 1500); 
  };

  const handlePointerCancel = (id) => {
    if (holdTimers.current[id]) {
      clearTimeout(holdTimers.current[id]);
      delete holdTimers.current[id];
    }
  };

  const onDragStart = (e, type, id) => {
    handlePointerCancel(id);
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

  const cityTitles = ['Dwelling', 'Settlement', 'Village', 'Town', 'City', 'Metropolis', 'Megalopolis'];
  const currentTitle = cityTitles[cityLvl - 1] || 'City';

  return (
    <div className="city-page">
      <div className="city-header">
        <div className="city-title-row">
          <Building2 size={32} className="city-icon" />
          <h1>{user?.user_metadata?.full_name?.split(' ')[0] || 'Your'} {currentTitle} (Lv {cityLvl})</h1>
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
        {/* Sky Engine */}
        <div className="town-sky">
          <div className="sky-clouds" />
        </div>

        {/* Global Action HUD */}
        <div className="city-hud">
          <button 
            className="stash-all-btn glass-sm"
            onPointerDown={(e) => e.stopPropagation()} /* Prevents pan logic intercept */
            onClick={() => {
              if(window.confirm("Pack up ALL buildings and decorations and return them to the inventory?")) {
                updateLayout({});
                showMessage("Entire city stashed!");
              }
            }}
          >
            <Archive size={18} />
             Stash All
          </button>
        </div>
        
        {/* Deep immersive Cloud Bed beneath the grid */}
        <div className="town-cloud-bed">
          <div className="cloud-puff puff-1" />
          <div className="cloud-puff puff-2" />
          <div className="cloud-puff puff-3" />
          <div className="cloud-puff puff-4" />
          <div className="cloud-puff puff-5" />
          <div className="cloud-puff puff-6" />
          <div className="cloud-puff puff-7" />
          <div className="cloud-puff puff-8" />
          <div className="cloud-puff puff-9" />
          <div className="cloud-puff puff-10" />
          <div className="cloud-puff puff-11" />
          <div className="cloud-puff puff-12" />
        </div>

        <div className="town-celestial">
          {isDay && (
            <div className="sun-character">
              <div className="sun-ray-spinner" />
              <div className="sun-face">
                <div className="sun-eye left" />
                <div className="sun-eye right" />
                <div className="sun-blush left" />
                <div className="sun-blush right" />
                <div className="sun-mouth" />
              </div>
            </div>
          )}
        </div>
        
        {/* Infinite Pan/Zoom Mobile Camera Viewport */}
        <div style={{ position: 'absolute', inset: 0, bottom: '120px', zIndex: 10 }}>
          <TransformWrapper
            initialScale={1}
            minScale={0.3}
            maxScale={3}
            centerOnInit
            limitToBounds={false}
            wheel={{ step: 0.1 }}
            panning={{ excluded: ['draggable-building-wrapper', 'dock-item'], velocityDisabled: true }}
            doubleClick={{ disabled: true }}
          >
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ width: '100%', height: '100%' }}
            >
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
                      title={info.name}
                      onPointerEnter={() => setHoveredItem(`deco_${od.id}`)}
                      onPointerLeave={() => { setHoveredItem(null); handlePointerCancel(od.id); }}
                      onPointerDown={() => handlePointerDown(od.id, 'decoration')}
                      onPointerUp={() => handlePointerCancel(od.id)}
                      onPointerCancel={() => handlePointerCancel(od.id)}
                      style={{
                        left: x, top: `${y}px`, zIndex: zIndex + 2,
                        transform: 'translate(-50%, -50%)',
                        fontSize: '1.5rem',
                        filter: 'drop-shadow(0 5px 2px rgba(0,0,0,0.4))'
                      }}
                      onDragOver={(e) => onDragOverGrid(e, pos.col, pos.row)}
                      onDrop={(e) => onDropGrid(e, pos.col, pos.row)}
                    >
                      {info.emoji}
                      <div className={`building-hover-tooltip ${hoveredItem === `deco_${od.id}` ? 'show' : ''}`}>
                        <strong>{info.name}</strong>
                        <span>Decoration (Hold to stash)</span>
                      </div>
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
                      onPointerEnter={() => setHoveredItem(habit.id)}
                      onPointerLeave={() => { setHoveredItem(null); handlePointerCancel(habit.id); }}
                      onPointerDown={() => handlePointerDown(habit.id, 'building')}
                      onPointerUp={() => {
                         handlePointerCancel(habit.id);
                         setSelectedBuilding(selectedBuilding === habit.id ? null : habit.id);
                      }}
                      onPointerCancel={() => handlePointerCancel(habit.id)}
                      style={{
                        left: x, top: `${y}px`, zIndex: zIndex + 10,
                        transform: 'translate(-50%, -70%)'
                      }}
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
                      <div className={`building-hover-tooltip ${hoveredItem === habit.id ? 'show' : ''}`}>
                        <strong>{habit.name}</strong>
                        <span>Lvl {building?.level || 1} • (Hold to stash)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TransformComponent>
          </TransformWrapper>
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
                <span className="detail-label">Habit Name</span>
                <span className="detail-value text-xl font-bold">{habits.find(h => h.id === selectedBuilding)?.name}</span>
              </div>
              <div className="detail-stat">
                <span className="detail-label">Building Name</span>
                <span className="detail-value text-xl font-bold">
                  {getBuildingName(
                     habits.find(h => h.id === selectedBuilding)?.icon,
                     getBuildingForHabit(selectedBuilding)?.level || (getBuildingForHabit(selectedBuilding)?.golden_stars || 0) + 1
                  )}
                </span>
              </div>
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
