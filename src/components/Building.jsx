import { useState } from 'react';
import './Building.css';
import CityBuildingSVG, { getHabitTheme } from './CityBuildingSVG';

export default function Building({ habit, building, maxFloors, isSelected, onClick }) {
  const [imgError, setImgError] = useState(false);
  const floors = building?.floors || 0;
  const stars = building?.golden_stars || 0;
  
  // Levels map to golden stars: 0 stars = Level 1, 6+ stars = Level 7.
  const level = Math.min(stars + 1, 7);
  const theme = getHabitTheme(habit?.icon);
  
  // Use .svg for the missing assets that were dynamically generated in Node, otherwise .png
  const fallbackAssets = ['air_L1', 'air_L2', 'art_L2', 'gaming_L2', 'focus_L2'];
  const ext = fallbackAssets.includes(`${theme}_L${level}`) ? 'svg' : 'png';
  const imagePath = `/assets/buildings/${theme}_L${level}.${ext}`;

  return (
    <div
      className={`building-container ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="building-visual-wrapper">
        {/* If the exact PNG file is completely missing, 
            the image onError handler triggers, replacing it with the 3D SVG code! */}
        {imgError ? (
          <CityBuildingSVG level={level} icon={habit?.icon} />
        ) : (
          <img 
            src={imagePath} 
            alt={`${habit?.name} Level ${level}`} 
            className="building-image-asset"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="building-info-plate">
        <span className="building-name">{habit?.name || 'Unknown'}</span>
        <div className="building-stats">
          <span className="floor-badge">⬆ {floors}/{maxFloors}</span>
          {stars > 0 && <span className="star-badge">⭐ {stars}</span>}
        </div>
      </div>

      {/* Render the shop decorations attached to this building */}
      {(building?.decorations || []).length > 0 && (
        <div className="decoration-indicator">
          🎨 {building.decorations.length}
        </div>
      )}
    </div>
  );
}
