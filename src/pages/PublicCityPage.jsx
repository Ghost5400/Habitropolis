import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Building from '../components/Building';
import DecorationSVG from '../components/DecorationSVG';
import { getBuildingName } from '../components/CityBuildingSVG';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ArrowLeft, Map, Sunrise, Moon } from 'lucide-react';
import './CityPage.css'; // Reuse existing CSS for grid visuals

const DECORATION_CATALOG = {
  '11111111-0000-0000-0000-000000000001': { type: 'tree-oak', name: 'Oak Tree' },
  '11111111-0000-0000-0000-000000000002': { type: 'tree-pine', name: 'Pine Tree' },
  '11111111-0000-0000-0000-000000000003': { type: 'shrubbery', name: 'Park Shrubbery' },
  '11111111-0000-0000-0000-000000000004': { type: 'flower-garden', name: 'Flower Garden' },
  '11111111-0000-0000-0000-000000000005': { type: 'zen-garden', name: 'Zen Rock Garden' },
  '11111111-0000-0000-0000-000000000006': { type: 'fountain', name: 'Water Fountain' },
  '11111111-0000-0000-0000-000000000007': { type: 'statue', name: 'Statue Monument' },
  '11111111-0000-0000-0000-000000000008': { type: 'bench', name: 'City Bench' },
  '11111111-0000-0000-0000-000000000009': { type: 'street-lamp', name: 'Street Lamp' },
  '11111111-0000-0000-0000-000000000010': { type: 'pool', name: 'Swimming Pool' },
  '11111111-0000-0000-0000-000000000011': { type: 'cobblestone', name: 'Cobblestone Patch' },
  '11111111-0000-0000-0000-000000000012': { type: 'road', name: 'Asphalt Road' },
  '11111111-0000-0000-0000-000000000013': { type: 'crosswalk', name: 'Crosswalk' },
  '11111111-0000-0000-0000-000000000014': { type: 'bus-stop', name: 'Bus Shelter' },
  '11111111-0000-0000-0000-000000000015': { type: 'kiosk', name: 'Food Stand' },
  '22222222-0000-0000-0000-000000000001': { type: 'golden-trophy', name: 'Golden Trophy' },
  '22222222-0000-0000-0000-000000000002': { type: 'ferris-wheel', name: 'Neon Ferris Wheel' },
  '22222222-0000-0000-0000-000000000003': { type: 'cyber-monolith', name: 'Cyber Monolith' },
};

const TILE_W = 120;
const TILE_H = 60;
const START_Y = 150; 

const getScreenPos = (col, row) => ({
  x: `calc(50% + ${(col - row) * (TILE_W / 2)}px)`,
  y: START_Y + (col + row) * (TILE_H / 2),
  zIndex: col + row
});

export default function PublicCityPage() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [profile, setProfile] = useState(null);
  const [layout, setLayout] = useState({});
  const [habits, setHabits] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [decorations, setDecorations] = useState([]);

  const [isDay, setIsDay] = useState(true);

  useEffect(() => {
    const curHour = new Date().getHours();
    setIsDay(curHour >= 6 && curHour < 19);
  }, []);

  useEffect(() => {
    const fetchCityData = async () => {
      try {
        setLoading(true);

        // Fetch Profile
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, city_layout, league_id')
          .eq('user_id', userId)
          .single();

        if (profErr || !prof) throw new Error("Could not find this Mayor's profile.");
        setProfile(prof);
        setLayout(prof.city_layout || {});

        // Fetch user's habits to map buildings
        const { data: hbs } = await supabase.from('habits').select('*').eq('user_id', userId);
        setHabits(hbs || []);

        // Fetch user's city_buildings
        const { data: bldgs } = await supabase.from('city_buildings').select('*').eq('user_id', userId);
        setBuildings(bldgs || []);

        // Fetch user's owned decorations
        const { data: decos } = await supabase.from('user_decorations').select('*').eq('user_id', userId);
        setDecorations(decos || []);

        setLoading(false);
      } catch (err) {
        console.error("Public city fetch error", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (userId) fetchCityData();
  }, [userId]);

  if (loading) {
    return (
      <div className="city-loading">
        <div className="loading-spinner" />
        <p>Traveling to City...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="city-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass" style={{ padding: '2rem', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <Map size={48} style={{ color: 'var(--error)', margin: '0 auto 1rem' }} />
          <h2>City Not Found</h2>
          <p className="text-muted mb-4">{error}</p>
          <button className="btn-primary" onClick={() => navigate('/leaderboard')}>Go Back</button>
        </div>
      </div>
    );
  }

  // Stats calculate
  const highestStars = Math.max(0, ...buildings.map(b => b.golden_stars || 0));
  const cityLvl = Math.min(7, highestStars + 1);
  const cityTitles = ['Dwelling', 'Settlement', 'Village', 'Town', 'City', 'Metropolis', 'Megalopolis'];
  const currentTitle = cityTitles[cityLvl - 1] || 'City';

  // Extract layout placements
  const placedHabits = habits.filter(h => layout[h.id] != null);
  const placedDecorations = decorations.filter(od => layout[`deco_${od.id}`] != null);

  const getBuildingForHabit = (id) => buildings.find(b => b.habit_id === id) || { floors: 0, golden_stars: 0 };
  const getMaxFloors = (freq) => freq === 'daily' ? 1 : freq === 'weekly' ? 3 : 5;

  const GRID_SIZE = 4;
  const tiles = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const { x, y, zIndex } = getScreenPos(c, r);
      tiles.push(
        <div
          key={`${c}-${r}`}
          className="iso-grid-tile"
          style={{
            left: x, top: `${y}px`, zIndex,
            transform: 'translate(-50%, -50%)',
            width: `${TILE_W}px`, height: `${TILE_H}px`
          }}
        />
      );
    }
  }

  return (
    <div className="city-page">
      <div className="city-header" style={{ position: 'relative', zIndex: 100 }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn-secondary btn-icon" onClick={() => navigate(-1)} title="Back">
            <ArrowLeft size={20} />
          </button>
          <div className="city-title-row" style={{ marginBottom: 0 }}>
            <div className="player-avatar-emoji" style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.4), rgba(74, 222, 128, 0.4))',
              borderColor: 'var(--accent-primary)',
              width: '42px', height: '42px', fontSize: '1.4rem'
            }}>
              {profile?.avatar_url?.length > 5 ? '👤' : (profile?.avatar_url || '🤖')}
            </div>
            <h1>{profile?.display_name || 'Mayor'}'s {currentTitle}</h1>
          </div>
        </div>
        
        <div className="city-overview" style={{ marginLeft: 'auto' }}>
          <div className="city-stat glass-sm">{placedHabits.length} Buildings</div>
          <div className="city-stat glass-sm sky-indicator">
            {isDay ? <><Sunrise size={16} /> Day</> : <><Moon size={16} /> Night</>}
          </div>
        </div>
      </div>

      <div className={`town-builder-viewport ${isDay ? 'is-day' : 'is-night'}`} style={{ height: 'calc(100vh - 120px)' }}>
        {/* Sky Engine */}
        <div className="town-sky">
          <div className="sky-clouds" />
        </div>
        
        {/* Clouds */}
        <div className="town-cloud-bed">
          {[...Array(12)].map((_, i) => <div key={i} className={`cloud-puff puff-${i + 1}`} />)}
        </div>

        {/* Sun */}
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
        
        {/* Infinite Pan/Zoom Camera Viewport */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          <TransformWrapper
            initialScale={1}
            minScale={0.3}
            maxScale={3}
            centerOnInit
            limitToBounds={false}
            wheel={{ step: 0.1 }}
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
                  const info = DECORATION_CATALOG[od.decoration_id] || { type: 'tree-oak', name: od.decoration_id };
                  
                  return (
                    <div
                      key={`deco_${od.id}`}
                      className="grid-decoration-item"
                      title={info.name}
                      style={{
                        position: 'absolute',
                        left: x, top: `${y}px`, zIndex: zIndex + 2,
                        transform: 'translate(-50%, -50%)',
                        width: '240px', height: '240px',
                        pointerEvents: 'none' /* read only */
                      }}
                    >
                      <DecorationSVG type={info.type} style={{ width: '100%', height: '100%' }} />
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
                      style={{
                        position: 'absolute',
                        left: x, top: `${y}px`, zIndex: zIndex + 10,
                        transform: 'translate(-50%, -70%)',
                        pointerEvents: 'none' /* read only */
                      }}
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
            </TransformComponent>
          </TransformWrapper>
        </div>
        
        {/* Read-only overlay badge */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }} className="glass-sm">
          <p style={{ margin: 0, padding: '0.75rem 1.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            👀 Spectator Mode - Read Only
          </p>
        </div>
      </div>
    </div>
  );
}
