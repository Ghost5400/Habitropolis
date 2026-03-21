import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLeague } from '../hooks/useLeague';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronUp, ChevronDown, Minus, Medal, Crown, Shield, Swords, RefreshCw, Sparkles, Star, Zap, Building2 } from 'lucide-react';
import './LeaderboardPage.css';

const TIER_ICONS = {
  'Dwelling': '🏚️',
  'Settlement': '⛺',
  'Village': '🏘️',
  'Town': '🏙️',
  'City': '🌆',
  'Metropolis': '🌃',
  'Megalopolis': '✨',
};

const RANK_MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const {
    userProfile,
    leaderboard,
    loading,
    error,
    leagueReady,
    leagueData,
    getLeagueInfo,
    loadLeaderboard,
  } = useLeague();
  
  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);

  const league = useMemo(() => {
    return getLeagueInfo(userProfile?.league_id || 1);
  }, [userProfile, getLeagueInfo]);

  const promoteCutoff = useMemo(() => {
    const cityLvl = Math.floor(((league?.id || 1) - 1) / 4) + 1;
    let pPct = 0.23;
    if (cityLvl === 1) pPct = 0.40;
    else if (cityLvl === 2) pPct = 0.30;
    else if (cityLvl === 3) pPct = 0.25;
    else if (cityLvl === 4) pPct = 0.20;
    else if (cityLvl === 5) pPct = 0.15;
    else if (cityLvl === 6) pPct = 0.10;
    else pPct = 0.05;

    let cutoff = Math.round(leaderboard.length * pPct);
    if (cutoff === 0 && leaderboard.length >= 3) cutoff = 1;
    return cutoff;
  }, [leaderboard.length, league?.id]);

  const demoteCutoff = useMemo(() => {
    const cityLvl = Math.floor(((league?.id || 1) - 1) / 4) + 1;
    let dPct = 0.23;
    if (cityLvl === 1) dPct = 0.00;
    else if (cityLvl === 2) dPct = 0.15;
    else if (cityLvl === 3) dPct = 0.20;
    else if (cityLvl === 4) dPct = 0.20;
    else if (cityLvl === 5) dPct = 0.25;
    else if (cityLvl === 6) dPct = 0.30;
    else dPct = 0.35;

    const dCount = Math.round(leaderboard.length * dPct);
    if (dCount === 0) return leaderboard.length + 1; // nobody demotes
    return leaderboard.length - dCount + 1;
  }, [leaderboard.length, league?.id]);

  const userRank = useMemo(() => {
    const idx = leaderboard.findIndex(u => u.user_id === user?.id);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Calculate next league info
  const nextLeague = useMemo(() => {
    if (!league || league.id >= 28) return null;
    return leagueData.find(l => l.id === league.id + 1);
  }, [league, leagueData]);

  const prevLeague = useMemo(() => {
    if (!league || league.id <= 1) return null;
    return leagueData.find(l => l.id === league.id - 1);
  }, [league, leagueData]);

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="league-loading">
          <div className="league-loading-orb">
            <Medal size={48} />
          </div>
          <p>Loading League...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="league-error-card glass">
          <div className="league-error-icon">
            <Trophy size={56} />
          </div>
          <h2>League System Setup Required</h2>
          {error === 'migration_needed' ? (
            <>
              <p>The league tables haven't been created in your Supabase database yet.</p>
              <div className="league-error-steps">
                <div className="error-step">
                  <span className="step-num">1</span>
                  <span>Open your Supabase Dashboard → SQL Editor</span>
                </div>
                <div className="error-step">
                  <span className="step-num">2</span>
                  <span>Run the <code>supabase/league_migration.sql</code> file</span>
                </div>
                <div className="error-step">
                  <span className="step-num">3</span>
                  <span>Refresh this page</span>
                </div>
              </div>
            </>
          ) : (
            <p>{error}</p>
          )}
          <button className="btn btn-primary" onClick={handleRefresh}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      {/* League Header */}
      <div className="league-hero" style={{ '--league-color': league.color }}>
        <div className="league-hero-bg">
          <div className="hero-particles">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="hero-particle" style={{ 
                '--delay': `${i * 0.3}s`,
                '--x': `${10 + Math.random() * 80}%`,
                '--size': `${3 + Math.random() * 5}px`
              }} />
            ))}
          </div>
        </div>

        <div className="league-hero-content">
          <div className="league-emblem">
            <div className="emblem-ring" />
            <div className="emblem-ring emblem-ring-2" />
            <span className="emblem-icon">{TIER_ICONS[league.tier] || '🏆'}</span>
          </div>

          <div className="league-hero-info">
            <div className="league-tier-label">{league.tier} • Tier {league.city_level}/7</div>
            <h1 className="league-hero-name">{league.name}</h1>
            <p className="league-hero-sub">
              {league.id < 28 ? 'Rank up by earning XP from habits & coins!' : 'You\'ve reached the pinnacle!'}
            </p>
          </div>

          <div className="league-hero-stats">
            <div className="hero-stat">
              <Zap size={18} />
              <span className="hero-stat-value">{userProfile?.weekly_score || 0}</span>
              <span className="hero-stat-label">Weekly XP</span>
            </div>
            {userRank && (
              <div className="hero-stat">
                <Medal size={18} />
                <span className="hero-stat-value">#{userRank}</span>
                <span className="hero-stat-label">Rank</span>
              </div>
            )}
            <div className="hero-stat">
              <Swords size={18} />
              <span className="hero-stat-value">{leaderboard.length}</span>
              <span className="hero-stat-label">Competitors</span>
            </div>
          </div>
        </div>
      </div>

      {/* League Progression Bar */}
      <div className="league-progression glass-sm">
        <div className="progression-row">
          {prevLeague && (
            <div className="progression-prev">
              <ChevronDown size={14} className="text-demote"/>
              <span style={{ color: prevLeague.color }}>{prevLeague.name}</span>
            </div>
          )}
          <div className="progression-current">
            <Star size={14} className="text-current"/>
            <strong style={{ color: league.color }}>{league.name}</strong>
          </div>
          {nextLeague && (
            <div className="progression-next">
              <ChevronUp size={14} className="text-promote"/>
              <span style={{ color: nextLeague.color }}>{nextLeague.name}</span>
            </div>
          )}
        </div>
        <div className="progression-bar">
          <div 
            className="progression-fill"
            style={{ 
              width: `${Math.min(100, ((league.id - 1) / 27) * 100)}%`,
              background: `linear-gradient(90deg, ${league.color}, ${league.color}dd)` 
            }}
          />
          {[...Array(7)].map((_, i) => (
            <div 
              key={i} 
              className={`progression-marker ${league.city_level > i + 1 ? 'completed' : league.city_level === i + 1 ? 'current' : ''}`}
              style={{ left: `${(i / 6) * 100}%` }}
              title={['Dwelling', 'Settlement', 'Village', 'Town', 'City', 'Metropolis', 'Megalopolis'][i]}
            />
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="league-board glass">
        <div className="board-header">
          <h2><Swords size={20} /> This Week's Bracket</h2>
          <button 
            className={`btn btn-sm btn-secondary refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={handleRefresh}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <div className="board-zones">
          {league.id < 28 && (
            <span className="zone-badge zone-promote">
              <ChevronUp size={14}/> Top {promoteCutoff} promote
            </span>
          )}
          {league.id > 1 && (
            <span className="zone-badge zone-demote">
              <ChevronDown size={14}/> Bottom {Math.max(1, Math.floor(leaderboard.length * 0.23))} demote
            </span>
          )}
        </div>

        <div className="board-list">
          {leaderboard.map((u, i) => {
            const rank = i + 1;
            const isMe = u.user_id === user.id;
            const isPromotion = rank <= promoteCutoff && league.id < 28;
            const isDemotion = rank >= demoteCutoff && league.id > 1;

            let zoneClass = 'zone-safe';
            let ZoneIcon = Minus;
            if (isPromotion) { zoneClass = 'zone-up'; ZoneIcon = ChevronUp; }
            if (isDemotion) { zoneClass = 'zone-down'; ZoneIcon = ChevronDown; }

            return (
              <div
                key={u.user_id}
                className={`board-row ${isMe ? 'is-me' : ''} ${zoneClass}`}
                style={{ '--row-delay': `${i * 0.04}s` }}
              >
                <div className="board-rank-cell">
                  {rank <= 3 ? (
                    <span className="rank-medal">{RANK_MEDALS[rank - 1]}</span>
                  ) : (
                    <span className="rank-number">{rank}</span>
                  )}
                  <ZoneIcon size={14} className="zone-arrow" />
                </div>

                <div className="board-player">
                  <div className="player-avatar-emoji" style={{
                    borderColor: isMe ? 'var(--accent-primary)' : `${league.color}88`,
                    background: isMe ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)'
                  }}>
                    {u.avatar_url?.length > 5 ? '👤' : (u.avatar_url || '🤖')}
                  </div>
                  <div className="player-info">
                    <span className="player-name">
                      {u.display_name || u.user_id.split('-')[0]}
                      {isMe && <span className="you-badge">YOU</span>}
                    </span>
                  </div>
                </div>

                <div className="board-xp">
                  <Zap size={14} className="xp-icon" />
                  <span>{u.weekly_score || 0}</span>
                  <span className="xp-label">XP</span>
                </div>
                
                <div className="board-actions">
                  <button 
                    className="visit-btn" 
                    title={`Visit ${u.display_name || 'City'}`}
                    onClick={() => navigate(`/visit/${u.user_id}`)}
                  >
                    <Building2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="board-empty">
              <Sparkles size={32} />
              <p>Waiting for competitors...</p>
              <span>Complete habits to earn XP and climb the ranks!</span>
            </div>
          )}

          {leaderboard.length === 1 && leaderboard[0]?.user_id === user?.id && (
            <div className="board-solo-notice">
              <Shield size={20} />
              <p>You're the first in your bracket! As more players join Habitropolis, they'll be placed in your group for competition.</p>
            </div>
          )}
        </div>
      </div>

      {/* All Leagues Overview */}
      <div className="all-leagues glass">
        <h2><Crown size={20} /> All 28 Leagues</h2>
        <div className="leagues-grid">
          {leagueData.map(l => (
            <div 
              key={l.id}
              className={`league-chip ${l.id === league.id ? 'current' : ''} ${l.id < league.id ? 'passed' : ''}`}
              style={{ '--chip-color': l.color }}
            >
              <span className="chip-tier-icon">{TIER_ICONS[l.tier]}</span>
              <span className="chip-name">{l.name.replace(' League', '')}</span>
              <span className="chip-level">Lv{l.city_level}</span>
              {l.id === league.id && <span className="chip-current-dot" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
