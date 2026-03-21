import React from 'react';

// Common Isometric rendering primitive block
const IsoBlock = ({ cx = 100, cy = 150, dx = 20, dy = 10, height = 20, colors }) => {
  const topPts = `${cx},${cy - dy - height} ${cx + dx},${cy - height} ${cx},${cy + dy - height} ${cx - dx},${cy - height}`;
  const leftPts = `${cx - dx},${cy - height} ${cx},${cy + dy - height} ${cx},${cy + dy} ${cx - dx},${cy}`;
  const rightPts = `${cx},${cy + dy - height} ${cx + dx},${cy - height} ${cx + dx},${cy} ${cx},${cy + dy}`;

  return (
    <g>
      {colors.left && <polygon points={leftPts} fill={colors.left} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />}
      {colors.right && <polygon points={rightPts} fill={colors.right} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />}
      {colors.top && <polygon points={topPts} fill={colors.top} stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />}
    </g>
  );
};

// Flat Tile primitive for roads/gardens
const IsoTile = ({ cx = 100, cy = 150, dx = 50, dy = 25, color, pattern }) => {
  const pts = `${cx},${cy - dy} ${cx + dx},${cy} ${cx},${cy + dy} ${cx - dx},${cy}`;
  return (
    <g>
      <polygon points={pts} fill={color} />
      {pattern}
    </g>
  );
};

export default function DecorationSVG({ type = 'tree-oak', className = '' }) {
  // Base coordinate for grid center - aligned precisely with the center of the 200x200 viewBox
  const BX = 100;
  const BY = 100;

  // Colors
  const trunk = { top: '#78350f', left: '#92400e', right: '#451a03' };
  const leavesGreen = { top: '#4ade80', left: '#22c55e', right: '#166534' };
  const leavesDark = { top: '#22c55e', left: '#16a34a', right: '#14532d' };
  const stone = { top: '#e2e8f0', left: '#94a3b8', right: '#475569' };
  const golden = { top: '#fde047', left: '#eab308', right: '#ca8a04' };
  const wood = { top: '#d97706', left: '#b45309', right: '#78350f' };
  const iron = { top: '#475569', left: '#334155', right: '#1e293b' };
  const water = { top: '#7dd3fc', left: '#38bdf8', right: '#0284c7' };
  const glass = { top: 'rgba(125, 211, 252, 0.4)', left: 'rgba(56, 189, 248, 0.5)', right: 'rgba(2, 132, 199, 0.6)' };
  const concrete = { top: '#cbd5e1', left: '#94a3b8', right: '#64748b' };
  const road = '#334155';
  
  return (
    <svg viewBox="0 0 200 200" className={`decoration-svg ${className}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
      
      {type === 'tree-oak' && (
        <g>
          <circle cx={BX} cy={BY-5} r={25} fill="rgba(0,0,0,0.15)" transform="scale(1, 0.5)" />
          <IsoBlock cx={BX} cy={BY} dx={6} dy={3} height={20} colors={trunk} />
          <IsoBlock cx={BX} cy={BY-15} dx={30} dy={15} height={20} colors={leavesGreen} />
          <IsoBlock cx={BX} cy={BY-35} dx={20} dy={10} height={15} colors={leavesGreen} />
          <IsoBlock cx={BX} cy={BY-50} dx={10} dy={5} height={10} colors={leavesGreen} />
        </g>
      )}

      {type === 'tree-pine' && (
        <g>
          <circle cx={BX} cy={BY-5} r={20} fill="rgba(0,0,0,0.15)" transform="scale(1, 0.5)" />
          <IsoBlock cx={BX} cy={BY} dx={4} dy={2} height={10} colors={trunk} />
          <IsoBlock cx={BX} cy={BY-5} dx={25} dy={12.5} height={15} colors={leavesDark} />
          <IsoBlock cx={BX} cy={BY-20} dx={20} dy={10} height={20} colors={leavesDark} />
          <IsoBlock cx={BX} cy={BY-40} dx={15} dy={7.5} height={25} colors={leavesDark} />
          <IsoBlock cx={BX} cy={BY-65} dx={8} dy={4} height={20} colors={leavesDark} />
        </g>
      )}

      {type === 'shrubbery' && (
        <g>
          <IsoBlock cx={BX} cy={BY} dx={15} dy={7.5} height={15} colors={leavesGreen} />
          <IsoBlock cx={BX+10} cy={BY-5} dx={12} dy={6} height={12} colors={leavesGreen} />
          <IsoBlock cx={BX-10} cy={BY-5} dx={10} dy={5} height={10} colors={leavesGreen} />
        </g>
      )}

      {type === 'flower-garden' && (
        <g>
          <IsoBlock cx={BX} cy={BY} dx={40} dy={20} height={5} colors={trunk} />
          <IsoBlock cx={BX} cy={BY-5} dx={38} dy={19} height={2} colors={{top:'#166534'}} />
          {/* Flowers */}
          <IsoBlock cx={BX-15} cy={BY-5} dx={3} dy={1.5} height={3} colors={{top:'#f472b6', left:'#db2777', right:'#9d174d'}} />
          <IsoBlock cx={BX+10} cy={BY-10} dx={3} dy={1.5} height={3} colors={{top:'#fde047', left:'#eab308', right:'#ca8a04'}} />
          <IsoBlock cx={BX} cy={BY-15} dx={3} dy={1.5} height={3} colors={{top:'#38bdf8', left:'#0284c7', right:'#075985'}} />
          <IsoBlock cx={BX+20} cy={BY-5} dx={3} dy={1.5} height={3} colors={{top:'#f472b6', left:'#db2777', right:'#9d174d'}} />
        </g>
      )}

      {type === 'zen-garden' && (
        <g>
          <IsoBlock cx={BX} cy={BY} dx={40} dy={20} height={4} colors={concrete} />
          <IsoBlock cx={BX} cy={BY-4} dx={38} dy={19} height={1} colors={{top:'#fef08a'}} />
          {/* Rocks */}
          <IsoBlock cx={BX-10} cy={BY-5} dx={8} dy={4} height={8} colors={stone} />
          <IsoBlock cx={BX+15} cy={BY-12} dx={5} dy={2.5} height={5} colors={stone} />
        </g>
      )}

      {type === 'fountain' && (
        <g>
          <circle cx={BX} cy={BY-5} r={30} fill="rgba(0,0,0,0.15)" transform="scale(1, 0.5)" />
          {/* Base */}
          <IsoBlock cx={BX} cy={BY} dx={30} dy={15} height={10} colors={stone} />
          <IsoBlock cx={BX} cy={BY-10} dx={26} dy={13} height={2} colors={water} />
          {/* Middle Tier */}
          <IsoBlock cx={BX} cy={BY-10} dx={10} dy={5} height={20} colors={stone} />
          <IsoBlock cx={BX} cy={BY-30} dx={15} dy={7.5} height={4} colors={stone} />
          <IsoBlock cx={BX} cy={BY-34} dx={12} dy={6} height={2} colors={water} />
          {/* Spout */}
          <IsoBlock cx={BX} cy={BY-34} dx={4} dy={2} height={10} colors={stone} />
          <IsoBlock cx={BX} cy={BY-44} dx={2} dy={1} height={15} colors={water} />
        </g>
      )}

      {type === 'statue' && (
        <g>
          <circle cx={BX} cy={BY-5} r={20} fill="rgba(0,0,0,0.15)" transform="scale(1, 0.5)" />
          <IsoBlock cx={BX} cy={BY} dx={20} dy={10} height={8} colors={concrete} />
          <IsoBlock cx={BX} cy={BY-8} dx={15} dy={7.5} height={12} colors={stone} />
          <IsoBlock cx={BX} cy={BY-20} dx={10} dy={5} height={25} colors={golden} />
          <circle cx={BX} cy={BY-50} r={6} fill={golden.left} />
        </g>
      )}

      {type === 'bench' && (
        <g>
          {/* Legs */}
          <IsoBlock cx={BX-10} cy={BY} dx={3} dy={1.5} height={12} colors={iron} />
          <IsoBlock cx={BX+10} cy={BY} dx={3} dy={1.5} height={12} colors={iron} />
          {/* Seat */}
          <IsoBlock cx={BX} cy={BY-6} dx={18} dy={9} height={2} colors={wood} />
          {/* Backrest */}
          <IsoBlock cx={BX-8} cy={BY-10} dx={2} dy={1} height={12} colors={iron} />
          <IsoBlock cx={BX+8} cy={BY-10} dx={2} dy={1} height={12} colors={iron} />
          <IsoBlock cx={BX} cy={BY-18} dx={18} dy={2} height={10} colors={wood} />
        </g>
      )}

      {type === 'street-lamp' && (
        <g>
          <IsoBlock cx={BX} cy={BY} dx={8} dy={4} height={5} colors={concrete} />
          <IsoBlock cx={BX} cy={BY-5} dx={3} dy={1.5} height={50} colors={iron} />
          <IsoBlock cx={BX} cy={BY-55} dx={8} dy={4} height={10} colors={{top:'#fef08a', left:'#fde047', right:'#eab308'}} />
          <IsoBlock cx={BX} cy={BY-65} dx={10} dy={5} height={4} colors={iron} />
          {/* Glow */}
          <circle cx={BX} cy={BY-60} r={40} fill="#fef08a" opacity="0.2" />
        </g>
      )}

      {type === 'pool' && (
        <g>
          <IsoBlock cx={BX} cy={BY} dx={40} dy={20} height={4} colors={concrete} />
          <IsoBlock cx={BX} cy={BY-3} dx={36} dy={18} height={1} colors={water} />
          <IsoBlock cx={BX} cy={BY-3} dx={10} dy={5} height={2} colors={glass} />
        </g>
      )}

      {type === 'cobblestone' && (
        <IsoTile cx={BX} cy={BY} color="#cbd5e1" pattern={
          <path d="M 60,100 L 100,120 M 140,100 L 100,120 M 80,90 L 120,110 M 120,90 L 80,110" stroke="#94a3b8" strokeWidth="2" opacity="0.5"/>
        }/>
      )}

      {type === 'road' && (
        <IsoTile cx={BX} cy={BY} color={road} pattern={
          <path d="M 60,80 L 140,120" stroke="#fde047" strokeWidth="4" strokeDasharray="10, 5" />
        }/>
      )}

      {type === 'crosswalk' && (
        <IsoTile cx={BX} cy={BY} color={road} pattern={
          <g>
            <path d="M 70,95 L 90,105 M 80,90 L 100,100 M 90,85 L 110,95 M 100,80 L 120,90 M 110,75 L 130,85" stroke="#ffffff" strokeWidth="6" />
          </g>
        }/>
      )}

      {type === 'bus-stop' && (
        <g>
          <IsoBlock cx={BX} cy={BY} dx={25} dy={12.5} height={4} colors={concrete} />
          <IsoBlock cx={BX-15} cy={BY-4} dx={2} dy={1} height={25} colors={iron} />
          <IsoBlock cx={BX+15} cy={BY-4} dx={2} dy={1} height={25} colors={iron} />
          <IsoBlock cx={BX} cy={BY-29} dx={25} dy={12.5} height={3} colors={iron} />
          {/* Glass back */}
          <IsoBlock cx={BX+10} cy={BY-4} dx={15} dy={2} height={25} colors={glass} />
          <IsoBlock cx={BX-10} cy={BY} dx={2} dy={1.5} height={10} colors={wood} />
        </g>
      )}

      {type === 'kiosk' && (
        <g>
          <IsoBlock cx={BX} cy={BY} dx={20} dy={10} height={25} colors={wood} />
          <IsoBlock cx={BX} cy={BY-15} dx={22} dy={11} height={5} colors={{top:'#ef4444', left:'#b91c1c', right:'#f87171'}} />
          <IsoBlock cx={BX-5} cy={BY-15} dx={5} dy={11} height={5} colors={{top:'#f8fafc', left:'#cbd5e1', right:'#e2e8f0'}} />
        </g>
      )}
      
      {type === 'golden-trophy' && (
        <g>
          <circle cx={BX} cy={BY-5} r={20} fill="rgba(0,0,0,0.15)" transform="scale(1, 0.5)" />
          <IsoBlock cx={BX} cy={BY} dx={15} dy={7.5} height={10} colors={concrete} />
          <IsoBlock cx={BX} cy={BY-10} dx={12} dy={6} height={8} colors={stone} />
          <IsoBlock cx={BX} cy={BY-18} dx={8} dy={4} height={35} colors={golden} />
          {/* Trophy Cup Bowl */}
          <IsoBlock cx={BX} cy={BY-53} dx={18} dy={9} height={15} colors={golden} />
          <IsoBlock cx={BX} cy={BY-68} dx={16} dy={8} height={2} colors={{top:'#ca8a04'}} />
          <circle cx={BX} cy={BY-80} r={4} fill="#fef08a" style={{ animation: 'pulse 1.5s infinite' }} />
        </g>
      )}

      {type === 'ferris-wheel' && (
        <g>
          <circle cx={BX} cy={BY-5} r={40} fill="rgba(0,0,0,0.15)" transform="scale(1, 0.5)" />
          {/* Supports */}
          <path d={`M ${BX-25} ${BY-10} L ${BX} ${BY-80} L ${BX+25} ${BY-10}`} stroke={concrete.right} strokeWidth="5" fill="none" />
          <path d={`M ${BX-15} ${BY-5} L ${BX} ${BY-80} L ${BX+15} ${BY-5}`} stroke={concrete.left} strokeWidth="5" fill="none" />
          {/* Core Hub */}
          <circle cx={BX} cy={BY-80} r={6} fill="#14b8a6" />
          {/* Wheel Frame */}
          <circle cx={BX} cy={BY-80} r={45} stroke="#5eead4" strokeWidth="4" fill="none" opacity={0.6} />
          <circle cx={BX} cy={BY-80} r={40} stroke="#2dd4bf" strokeWidth="2" fill="none" />
          {/* Spokes */}
          <path d={`M ${BX} ${BY-125} L ${BX} ${BY-35} M ${BX-45} ${BY-80} L ${BX+45} ${BY-80}`} stroke="#14b8a6" strokeWidth="2" />
          <path d={`M ${BX-31} ${BY-111} L ${BX+31} ${BY-49} M ${BX-31} ${BY-49} L ${BX+31} ${BY-111}`} stroke="#14b8a6" strokeWidth="2" />
        </g>
      )}

      {type === 'cyber-monolith' && (
        <g>
          <circle cx={BX} cy={BY-5} r={20} fill="rgba(0,0,0,0.3)" transform="scale(1, 0.5)" />
          <IsoBlock cx={BX} cy={BY} dx={15} dy={7.5} height={5} colors={concrete} />
          <IsoBlock cx={BX} cy={BY-5} dx={12} dy={6} height={60} colors={{top: '#0f172a', left: '#1e293b', right: '#020617'}} />
          {/* Neon Lines */}
          <path d={`M ${BX-12} ${BY-11} L ${BX-12} ${BY-50}`} stroke="#c084fc" strokeWidth="2" />
          <path d={`M ${BX+12} ${BY-11} L ${BX+12} ${BY-65}`} stroke="#a855f7" strokeWidth="2" />
          <path d={`M ${BX} ${BY-65} L ${BX} ${BY-15}`} stroke="#e879f9" strokeWidth="1" />
          {/* Core orb */}
          <circle cx={BX} cy={BY-40} r={6} fill="#f0abfc" opacity={0.8} />
        </g>
      )}

    </svg>
  );
}
