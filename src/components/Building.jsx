import { useState } from 'react';
import './Building.css';
import { getHabitTheme } from './CityBuildingSVG';
import { getBuildingImage } from '../hooks/useCity';

export default function Building({ habit, building, settlementLevel = 1, isSelected, onClick }) {
  const [imgError, setImgError] = useState(false);
  const theme = getHabitTheme(habit?.icon);
  const imagePath = getBuildingImage(theme, settlementLevel);

  return (
    <div
      className={`building-container ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="building-visual-wrapper">
        {imgError ? (
          // Final fallback: show a neutral placeholder emoji
          <div className="building-emoji-fallback">🏗️</div>
        ) : (
          <img
            src={imagePath}
            alt={`${habit?.name} - Level ${settlementLevel}`}
            className="building-image-asset"
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="building-info-plate">
        <span className="building-name">{habit?.name || 'Unknown'}</span>
        <div className="building-stats">
          <span className="settlement-badge">🏙️ Lv {settlementLevel}</span>
        </div>
      </div>

      {/* Render decorations indicator */}
      {(building?.decorations || []).length > 0 && (
        <div className="decoration-indicator">
          🎨 {building.decorations.length}
        </div>
      )}
    </div>
  );
}
