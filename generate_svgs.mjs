import fs from 'fs';
import path from 'path';

const THEMES = {
  air: { top: '#86efac', left: '#22c55e', right: '#15803d', accTop: '#d9f99d', accLeft: '#84cc16', accRight: '#4d7c0f' },
  art: { top: '#f9a8d4', left: '#ec4899', right: '#be185d', accTop: '#5eead4', accLeft: '#14b8a6', accRight: '#0f766e' },
  gaming: { top: '#a78bfa', left: '#6d28d9', right: '#4c1d95', accTop: '#fca5a5', accLeft: '#ef4444', accRight: '#b91c1c' },
  focus: { top: '#f8fafc', left: '#cbd5e1', right: '#94a3b8', accTop: '#fef08a', accLeft: '#eab308', accRight: '#a16207' }
};

const getIsoBlock = ({ x = 100, y = 150, z = 0, size = 50, height = 40, colors, isAccent = false }) => {
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

  return `
    <polygon points="${leftPts}" fill="${cLeft}" stroke="rgba(0,0,0,0.1)" stroke-width="0.5" />
    <polygon points="${rightPts}" fill="${cRight}" stroke="rgba(0,0,0,0.1)" stroke-width="0.5" />
    <polygon points="${topPts}" fill="${cTop}" stroke="rgba(255,255,255,0.2)" stroke-width="0.5" />
  `;
};

// Simplified icon generator just uses a solid circle instead of lucide icons for the static SVG images to maintain 100% no-DOM reliability.
const getIconSvg = (colors, bx, by, topZ) => {
  return `<g transform="translate(${bx - 16}, ${by - topZ - 40})" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.5))">
    <circle cx="16" cy="16" r="20" fill="${colors.accTop}" opacity="0.2" />
    <circle cx="16" cy="16" r="10" fill="${colors.accLeft}" />
  </g>`;
};

const generateBuildingSVG = (level, themeName) => {
  const colors = THEMES[themeName];
  const BX = 100;
  const BY = 180;
  
  let topZ = 30;
  if (level === 2) topZ = 40;

  let blocks = '';
  if (level === 1) {
    blocks += getIsoBlock({ x: BX, y: BY, z: 0, size: 35, height: 15, colors });
    blocks += getIsoBlock({ x: BX, y: BY, z: 15, size: 25, height: 10, colors, isAccent: true });
  } else if (level === 2) {
    blocks += getIsoBlock({ x: BX, y: BY, z: 0, size: 40, height: 20, colors });
    blocks += getIsoBlock({ x: BX, y: BY, z: 20, size: 25, height: 15, colors, isAccent: true });
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%" style="overflow: visible;">
    ${getIconSvg(colors, BX, BY, topZ)}
    ${blocks}
  </svg>`;
};

const targets = [
  { file: 'air_L1.svg', level: 1, theme: 'air' },
  { file: 'air_L2.svg', level: 2, theme: 'air' },
  { file: 'art_L2.svg', level: 2, theme: 'art' },
  { file: 'gaming_L2.svg', level: 2, theme: 'gaming' },
  { file: 'focus_L2.svg', level: 2, theme: 'focus' }
];

targets.forEach(t => {
  const svg = generateBuildingSVG(t.level, t.theme);
  const outPath = path.join(process.cwd(), 'public', 'assets', 'buildings', t.file);
  fs.writeFileSync(outPath, svg);
  console.log('Saved', outPath);
});
