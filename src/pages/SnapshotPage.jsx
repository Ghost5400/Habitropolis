import React, { useEffect, useRef, useState } from 'react';
import CityBuildingSVG from '../components/CityBuildingSVG';

const TARGETS = [
  { file: 'air_L1.png', level: 1, icon: 'palmtree' },
  { file: 'air_L2.png', level: 2, icon: 'palmtree' },
  { file: 'art_L2.png', level: 2, icon: 'pen-tool' },
  { file: 'gaming_L2.png', level: 2, icon: 'gamepad-2' },
  { file: 'focus_L2.png', level: 2, icon: 'star' }
];

export default function SnapshotPage() {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('Generating...');

  useEffect(() => {
    const generate = async () => {
      if (!containerRef.current) return;
      const svgNodes = containerRef.current.querySelectorAll('svg');
      
      for (let i = 0; i < svgNodes.length; i++) {
        const svgElement = svgNodes[i];
        const target = TARGETS[i];
        
        // Convert SVG to data URL
        const svgData = new XMLSerializer().serializeToString(svgElement);
        // Add xmlns so it's valid
        const validSvgData = svgData.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
        const blob = new Blob([validSvgData], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        
        await new Promise((resolve) => {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Draw image scaled up
            ctx.drawImage(img, 0, 0, 512, 512);
            
            const base64data = canvas.toDataURL('image/png');
            
            try {
              await fetch('http://localhost:4000/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename: target.file, base64data })
              });
            } catch (err) {
              console.error(err);
            }
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });
      }
      setStatus('Done! Files saved in public/assets/buildings.');
    };
    
    // allow font and layout to settle
    setTimeout(generate, 500);
  }, []);

  return (
    <div style={{ background: '#fff', minHeight: '100vh', padding: 20 }}>
      <h1>{status}</h1>
      <div ref={containerRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 20, pointerEvents: 'none' }}>
        {TARGETS.map((t, idx) => (
          <div key={idx} style={{ width: 512, height: 512, border: '1px solid #ccc' }}>
            <CityBuildingSVG level={t.level} icon={t.icon} />
          </div>
        ))}
      </div>
    </div>
  );
}
