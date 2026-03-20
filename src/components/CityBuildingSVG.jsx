import React from 'react';

// Color definitions for the 6 themes (Top, Left, Right faces)
const THEMES = {
  neutral: { top: '#cbd5e1', left: '#64748b', right: '#475569', accTop: '#e2e8f0', accLeft: '#94a3b8', accRight: '#475569' },
  fitness: { top: '#fca5a5', left: '#ef4444', right: '#b91c1c', accTop: '#fcd34d', accLeft: '#f59e0b', accRight: '#b45309' },
  water: { top: '#7dd3fc', left: '#0ea5e9', right: '#0369a1', accTop: '#a5f3fc', accLeft: '#06b6d4', accRight: '#0891b2' },
  study: { top: '#d8b4fe', left: '#a855f7', right: '#7e22ce', accTop: '#fdf4ff', accLeft: '#e879f9', accRight: '#c026d3' },
  air: { top: '#86efac', left: '#22c55e', right: '#15803d', accTop: '#d9f99d', accLeft: '#84cc16', accRight: '#4d7c0f' },
  discipline: { top: '#fde047', left: '#eab308', right: '#a16207', accTop: '#fef08a', accLeft: '#eab308', accRight: '#ca8a04' },
  morning: { top: '#fdba74', left: '#f97316', right: '#c2410c', accTop: '#fef08a', accLeft: '#eab308', accRight: '#a16207' },
  coding: { top: '#86efac', left: '#16a34a', right: '#064e3b', accTop: '#111827', accLeft: '#1f2937', accRight: '#030712' },
  art: { top: '#f9a8d4', left: '#ec4899', right: '#be185d', accTop: '#5eead4', accLeft: '#14b8a6', accRight: '#0f766e' },
  gaming: { top: '#a78bfa', left: '#6d28d9', right: '#4c1d95', accTop: '#fca5a5', accLeft: '#ef4444', accRight: '#b91c1c' },
  focus: { top: '#f8fafc', left: '#cbd5e1', right: '#94a3b8', accTop: '#fef08a', accLeft: '#eab308', accRight: '#a16207' }
};

// Map habit icon to a theme
export const getHabitTheme = (icon) => {
  switch(icon) {
    case 'dumbbell': case 'activity': case 'heart': return 'fitness';
    case 'droplet': return 'water';
    case 'book': case 'briefcase': return 'study';
    case 'apple': case 'palmtree': return 'air';
    case 'ban': case 'moon': return 'discipline';
    case 'sun': return 'morning';
    case 'code': return 'coding';
    case 'pen-tool': case 'camera': return 'art';
    case 'gamepad-2': case 'headphones': return 'gaming';
    case 'star': case 'zap': return 'focus';
    default: return 'neutral';
  }
};

/**
 * A primitive isometric block.
 */
const IsoBlock = ({ x = 100, y = 150, z = 0, size = 50, height = 40, colors, isAccent = false }) => {
  const dx = size;
  const dy = size / 2;
  const cx = x;
  const cy = y - z;

  const cTop = isAccent ? colors.accTop : colors.top;
  const cLeft = isAccent ? colors.accLeft : colors.left;
  const cRight = isAccent ? colors.accRight : colors.right;

  const topPts = `${cx},${cy - dy - height} ${cx + dx},${cy - height} ${cx},${cy + dy - height} ${cx - dx},${cy - height}`;
  const leftPts = `${cx - dx},${cy - height} ${cx},${cy + dy - height} ${cx},${cy + dy} ${cx - dx},${cy}`;
  const rightPts = `${cx},${cy + dy - height} ${cx + dx},${cy - height} ${cx + dx},${cy} ${cx},${cy + dy}`;

  return (
    <g>
      <polygon points={leftPts} fill={cLeft} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
      <polygon points={rightPts} fill={cRight} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
      <polygon points={topPts} fill={cTop} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
    </g>
  );
};

export default function CityBuildingSVG({ level = 1, icon = 'activity', className = '' }) {
  const maxLvl = Math.max(1, Math.min(level, 7)); // clamp 1-7
  const themeKey = getHabitTheme(icon);
  const colors = THEMES[themeKey] || THEMES.neutral;
  
  // Base coordinate
  const BX = 100;
  const BY = 180;
  
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={`city-building-svg ${className}`}
      style={{ width: '100%', height: '100%', dropShadow: '0 10px 10px rgba(0,0,0,0.3)' }}
    >
      {/* Ground Shadow */}
      <ellipse cx={BX} cy={BY + 5} rx={50} ry={25} fill="rgba(0,0,0,0.2)" filter="blur(2px)" />

      {/* Level Geometry Assembly */}
      {(maxLvl === 1) && (
        <IsoBlock x={BX} y={BY} z={0} size={30} height={20} colors={colors} />
      )}

      {(maxLvl === 2) && (
        <>
          <IsoBlock x={BX} y={BY} z={0} size={40} height={20} colors={colors} />
          <IsoBlock x={BX} y={BY} z={20} size={25} height={15} colors={colors} isAccent />
        </>
      )}

      {(maxLvl === 3) && (
        <>
          <IsoBlock x={BX} y={BY} z={0} size={45} height={25} colors={colors} />
          <IsoBlock x={BX} y={BY} z={25} size={30} height={20} colors={colors} />
          <IsoBlock x={BX} y={BY} z={45} size={15} height={20} colors={colors} isAccent />
        </>
      )}

      {(maxLvl === 4) && (
        <>
          <IsoBlock x={BX} y={BY} z={0} size={50} height={30} colors={colors} />
          <IsoBlock x={BX} y={BY} z={30} size={40} height={15} colors={colors} isAccent />
          <IsoBlock x={BX} y={BY} z={45} size={25} height={40} colors={colors} />
          <IsoBlock x={BX} y={BY} z={85} size={10} height={15} colors={colors} isAccent />
        </>
      )}

      {(maxLvl === 5) && (
        <>
          <IsoBlock x={BX} y={BY} z={0} size={60} height={20} colors={colors} />
          <IsoBlock x={BX} y={BY} z={20} size={50} height={40} colors={colors} />
          <IsoBlock x={BX} y={BY} z={60} size={40} height={35} colors={colors} isAccent />
          <IsoBlock x={BX} y={BY} z={95} size={20} height={30} colors={colors} />
        </>
      )}

      {(maxLvl === 6) && (
        <>
          <IsoBlock x={BX} y={BY} z={0} size={60} height={25} colors={colors} />
          <IsoBlock x={BX} y={BY} z={25} size={55} height={50} colors={colors} />
          <IsoBlock x={BX} y={BY} z={75} size={45} height={40} colors={colors} />
          {/* Twin towers on top */}
          <IsoBlock x={BX - 15} y={BY - 7.5} z={115} size={15} height={40} colors={colors} isAccent />
          <IsoBlock x={BX + 15} y={BY + 7.5} z={115} size={15} height={30} colors={colors} isAccent />
        </>
      )}

      {(maxLvl === 7) && (
        <>
          <IsoBlock x={BX} y={BY} z={0} size={70} height={30} colors={colors} />
          <IsoBlock x={BX} y={BY} z={30} size={65} height={60} colors={colors} />
          <IsoBlock x={BX} y={BY} z={90} size={55} height={40} colors={colors} isAccent />
          <IsoBlock x={BX} y={BY} z={130} size={40} height={30} colors={colors} />
          <IsoBlock x={BX} y={BY} z={160} size={20} height={40} colors={colors} isAccent />
          <IsoBlock x={BX} y={BY} z={200} size={5} height={30} colors={colors} />
        </>
      )}
    </svg>
  );
}
