import './Building.css';

const BUILDING_COLORS = [
  'var(--accent-primary)',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

export default function Building({ habit, building, maxFloors, isSelected, onClick }) {
  const floors = building?.floors || 0;
  const stars = building?.golden_stars || 0;
  const color = habit?.color || BUILDING_COLORS[Math.abs(habit?.name?.charCodeAt(0) || 0) % BUILDING_COLORS.length];

  const renderFloors = () => {
    const floorElements = [];
    for (let i = 0; i < maxFloors; i++) {
      const isBuilt = i < floors;
      const isTop = i === floors - 1 && floors > 0;
      floorElements.unshift(
        <div
          key={i}
          className={`building-floor ${isBuilt ? 'built' : 'unbuilt'} ${isTop ? 'top-floor' : ''}`}
          style={{
            '--floor-color': color,
            '--floor-delay': `${i * 0.1}s`,
          }}
        >
          {isBuilt && (
            <>
              <div className="floor-window left" />
              <div className="floor-window right" />
            </>
          )}
        </div>
      );
    }
    return floorElements;
  };

  return (
    <div
      className={`building-container ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {/* Roof */}
      {floors > 0 && (
        <div className="building-roof" style={{ '--floor-color': color }}>
          <div className="roof-peak" />
        </div>
      )}

      {/* Floors */}
      <div className="building-body">
        {renderFloors()}
      </div>

      {/* Foundation */}
      <div className="building-foundation" style={{ '--floor-color': color }}>
        <div className="building-door" />
      </div>

      {/* Nameplate */}
      <div className="building-nameplate">
        <span className="building-name">{habit?.name || 'Unknown'}</span>
        {stars > 0 && (
          <span className="building-stars">
            {Array.from({ length: Math.min(stars, 5) }).map((_, i) => (
              <span key={i} className="golden-star">⭐</span>
            ))}
            {stars > 5 && <span className="star-count">+{stars - 5}</span>}
          </span>
        )}
      </div>

      {/* Floor counter */}
      <div className="floor-counter">
        {floors}/{maxFloors}
      </div>

      {/* Decorations indicator */}
      {(building?.decorations || []).length > 0 && (
        <div className="decoration-indicator">
          🎨 {building.decorations.length}
        </div>
      )}
    </div>
  );
}
