import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLeague, getLeagueBracketRules } from '../hooks/useLeague';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronUp, ChevronDown, Minus, Medal, Crown, Shield, Swords, RefreshCw, Sparkles, Star, Zap, Building2, UserPlus, UserCheck, Globe, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTotalUsers } from '../hooks/useTotalUsers';
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
    daysElapsed,
    daysRemaining,
    progressPercent,
    settlementLevel,
  } = useLeague();
  
  const { totalUsers } = useTotalUsers();

  const navigate = useNavigate();

  const [refreshing, setRefreshing] = useState(false);
  const [followStates, setFollowStates] = useState({}); // { [userId]: 'none' | 'pending' | 'following' }

  const [activeTab, setActiveTab] = useState('weekly');
  const [globalBoard, setGlobalBoard] = useState([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  const loadGlobalBoard = async () => {
    setGlobalLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, lifetime_xp, league_id')
        .order('lifetime_xp', { ascending: false })
        .order('display_name', { ascending: true })
        .limit(100);
      setGlobalBoard(data || []);
      
      // Load follow states for global too
      if (data && user) {
        const { data: fData } = await supabase
          .from('follows')
          .select('followed_id, status')
          .eq('follower_id', user.id)
          .in('followed_id', data.map(u => u.user_id));
        setFollowStates(prev => {
          const states = { ...prev };
          (fData || []).forEach(f => {
            states[f.followed_id] = f.status === 'accepted' ? 'following' : 'pending';
          });
          return states;
        });
      }
    } catch (err) {}
    finally { setGlobalLoading(false); }
  };

  useEffect(() => {
    if (activeTab === 'global' && globalBoard.length === 0) {
      loadGlobalBoard();
    }
  }, [activeTab]);

  // Load follow states for leaderboard users
  useEffect(() => {
    const loadFollowStates = async () => {
      if (!user || !leaderboard.length) return;
      try {
        const { data } = await supabase
          .from('follows')
          .select('followed_id, status')
          .eq('follower_id', user.id)
          .in('followed_id', leaderboard.map(u => u.user_id));
        const states = {};
        (data || []).forEach(f => {
          states[f.followed_id] = f.status === 'accepted' ? 'following' : 'pending';
        });
        setFollowStates(states);
      } catch (err) {
        // Silently fail if follows table doesn't exist yet
      }
    };
    loadFollowStates();
  }, [user, leaderboard]);

  const handleFollowFromBoard = async (targetId) => {
    if (!user || targetId === user.id) return;
    const current = followStates[targetId];
    if (current === 'following' || current === 'pending') {
      // Unfollow
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('followed_id', targetId);
      setFollowStates(prev => ({ ...prev, [targetId]: undefined }));
    } else {
      // Follow
      await supabase.from('follows').insert({ follower_id: user.id, followed_id: targetId });
      setFollowStates(prev => ({ ...prev, [targetId]: 'pending' }));
    }
  };

  const league = useMemo(() => {
    return getLeagueInfo(userProfile?.league_id || 1);
  }, [userProfile, getLeagueInfo]);

  const { promoteCutoff, demoteCutoff } = useMemo(() => {
    return getLeagueBracketRules(league?.id || 1, leaderboard.length || 1);
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
            {totalUsers > 0 && (
              <div className="hero-stat">
                <Globe size={18} />
                <span className="hero-stat-value">+{totalUsers}</span>
                <span className="hero-stat-label">Total Mayors</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7-Day Cycle Progress Bar */}
      <div className="league-cycle-bar glass-sm">
        <div className="cycle-header">
          <span className="cycle-day-label">📅 Day {daysElapsed} of 7</span>
          {daysElapsed >= 7 ? (
            <span className="cycle-end-badge">🔥 Results today!</span>
          ) : (
            <span className="cycle-days-left">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</span>
          )}
        </div>
        <div className="cycle-progress-track">
          <div
            className={`cycle-progress-fill ${daysElapsed >= 7 ? 'cycle-complete' : ''}`}
            style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${league.color}, ${league.color}cc)` }}
          />
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={`cycle-tick ${i < daysElapsed ? 'done' : i === daysElapsed ? 'current' : ''}`}
              style={{ left: `${((i + 1) / 7) * 100}%` }}
            />
          ))}
        </div>
        <div className="cycle-footer">
          <span>League resets every 7 days • Top players promote</span>
          <span>Settlement Lv {settlementLevel}</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="league-board glass">
        <div className="board-tabs">
          <button 
            className={`board-tab ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            <Swords size={18} /> Weekly Bracket
          </button>
          <button 
            className={`board-tab ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            <Globe size={18} /> Global Top 100
          </button>
        </div>

        {activeTab === 'weekly' ? (
          <>
            <div className="board-header">
              <h2><Swords size={20} /> Current Bracket</h2>
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
          {league.id > 1 && demoteCutoff <= leaderboard.length && (
            <span className="zone-badge zone-demote">
              <ChevronDown size={14}/> Bottom {leaderboard.length - demoteCutoff + 1} demote
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
                  {!isMe && (
                    <button
                      className={`visit-btn ${followStates[u.user_id] ? 'followed' : ''}`}
                      title={followStates[u.user_id] === 'following' ? 'Following' : followStates[u.user_id] === 'pending' ? 'Pending' : `Follow ${u.display_name || 'Mayor'}`}
                      onClick={() => handleFollowFromBoard(u.user_id)}
                      style={followStates[u.user_id] ? { color: '#4ade80', borderColor: '#4ade80' } : {}}
                    >
                      {followStates[u.user_id] ? <UserCheck size={16} /> : <UserPlus size={16} />}
                    </button>
                  )}
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
        </>
        ) : (
          <>
            <div className="board-header">
              <h2><Globe size={20} /> All-Time Legends</h2>
              <button 
                className={`btn btn-sm btn-secondary refresh-btn ${globalLoading ? 'spinning' : ''}`}
                onClick={loadGlobalBoard}
              >
                <RefreshCw size={14} />
              </button>
            </div>
            
            <div className="board-list">
              {globalBoard.map((u, i) => {
                const rank = i + 1;
                const isMe = u.user_id === user.id;
                const userL = leagueData.find(l => l.id === u.league_id) || leagueData[0];

                return (
                  <div
                    key={'global'+u.user_id}
                    className={`board-row ${isMe ? 'is-me' : ''}`}
                    style={{ '--row-delay': `${i * 0.04}s` }}
                  >
                    <div className="board-rank-cell">
                      {rank <= 3 ? (
                        <span className="rank-medal">{RANK_MEDALS[rank - 1]}</span>
                      ) : (
                        <span className="rank-number">{rank}</span>
                      )}
                    </div>

                    <div className="board-player">
                      <div className="player-avatar-emoji" style={{
                        borderColor: isMe ? 'var(--accent-primary)' : `${userL?.color}88`,
                        background: isMe ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)'
                      }}>
                        {u.avatar_url?.length > 5 ? '👤' : (u.avatar_url || '🤖')}
                      </div>
                      <div className="player-info">
                        <span className="player-name">
                          {u.display_name || u.user_id.split('-')[0]}
                          {isMe && <span className="you-badge">YOU</span>}
                        </span>
                        <span className="player-league-badge" style={{ color: userL?.color, fontSize: '0.75rem', fontWeight: 600 }}>
                          {userL?.name}
                        </span>
                      </div>
                    </div>

                    <div className="board-xp">
                      <Globe size={14} className="xp-icon text-accent" />
                      <span>{u.lifetime_xp || 0}</span>
                      <span className="xp-label">XP</span>
                    </div>
                    
                    <div className="board-actions">
                      {!isMe && (
                        <button
                          className={`visit-btn ${followStates[u.user_id] ? 'followed' : ''}`}
                          title={followStates[u.user_id] === 'following' ? 'Following' : followStates[u.user_id] === 'pending' ? 'Pending' : `Follow ${u.display_name || 'Mayor'}`}
                          onClick={() => handleFollowFromBoard(u.user_id)}
                          style={followStates[u.user_id] ? { color: '#4ade80', borderColor: '#4ade80' } : {}}
                        >
                          {followStates[u.user_id] ? <UserCheck size={16} /> : <UserPlus size={16} />}
                        </button>
                      )}
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

              {globalBoard.length === 0 && !globalLoading && (
                <div className="board-empty">
                  <Star size={32} />
                  <p>No legends yet...</p>
                  <span>Earn XP to claim your spot on the Global Board!</span>
                </div>
              )}
            </div>
          </>
        )}
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
