import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Trophy, ChevronUp, ChevronDown, Minus, Medal } from 'lucide-react';
import './LeaderboardPage.css';

const LEAGUES = [
  'Dirt League', 'Wood League', 'Stone League', 'Brick League',
  'Copper League', 'Iron League', 'Steel League', 'Cobalt League',
  'Amber League', 'Topaz League', 'Quartz League', 'Pearl League',
  'Jade League', 'Sapphire League', 'Emerald League', 'Ruby League',
  'Bronze League', 'Silver League', 'Gold League', 'Platinum League',
  'Obsidian League', 'Neon League', 'Plasma League', 'Titanium League',
  'Diamond League', 'Apex League', 'Quantum League', 'Celestial League'
];

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) loadLeaderboard();
  }, [user]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      // Try to fetch the user's profile to get their group & league
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('league_id, weekly_score, leaderboard_group_id, display_name')
        .eq('user_id', user.id)
        .single();

      if (profileErr) throw profileErr;
      
      // If the columns don't exist (migration not run yet) this will throw and we handle it below
      if (profile.league_id === undefined) {
        throw new Error("League system not initialized in DB");
      }

      setUserProfile(profile);

      // Fetch the bracket
      const { data: bracket, error: bracketErr } = await supabase
        .from('profiles')
        .select('user_id, display_name, weekly_score')
        .eq('leaderboard_group_id', profile.leaderboard_group_id)
        .eq('league_id', profile.league_id)
        .order('weekly_score', { ascending: false });

      if (bracketErr) throw bracketErr;

      setLeaderboard(bracket || []);
    } catch (err) {
      console.error('Leaderboard error:', err);
      setError("Please run the SQL migration script in Supabase to enable League tracking!");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="loading-spinner"/>Loading League...</div>;

  if (error) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-error glass">
          <Trophy size={48} className="text-warning mb-4" />
          <h2>League System Not Ready</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const userLeagueName = LEAGUES[(userProfile?.league_id || 1) - 1];

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <div className="league-title">
          <Medal size={40} className="league-icon" />
          <div>
            <h1>{userLeagueName}</h1>
            <p>Complete habits and earn coins to rank up!</p>
          </div>
        </div>
        <div className="league-stats glass-sm">
          <div>Your Score: <strong>{userProfile?.weekly_score || 0}</strong> XP</div>
        </div>
      </div>

      <div className="leaderboard-board glass">
        <div className="board-legend">
          <span className="text-success"><ChevronUp size={16}/> Promotion Zone (Top 7)</span>
          <span className="text-danger"><ChevronDown size={16}/> Demotion Zone (Bottom 7)</span>
        </div>

        <div className="board-list">
          {leaderboard.map((u, i) => {
            const rank = i + 1;
            const isMe = u.user_id === user.id;
            const isPromotion = rank <= 7 && userProfile.league_id < 28;
            const isDemotion = rank >= (Math.max(leaderboard.length - 6, 24)) && userProfile.league_id > 1;

            let rankClass = "rank-safe";
            let RankIcon = Minus;
            if (isPromotion) { rankClass = "rank-promote"; RankIcon = ChevronUp; }
            if (isDemotion) { rankClass = "rank-demote"; RankIcon = ChevronDown; }

            return (
              <div key={u.user_id} className={`board-row ${isMe ? 'is-me' : ''} ${rankClass}`}>
                <div className="board-rank">
                  <span className="rank-num">{rank}</span>
                  <RankIcon size={16} className="rank-indicator" />
                </div>
                <div className="board-name">
                  {u.display_name || 'Anonymous User'} 
                  {isMe && <span className="me-badge">YOU</span>}
                </div>
                <div className="board-score">
                  {u.weekly_score} XP
                </div>
              </div>
            );
          })}

          {leaderboard.length === 0 && (
            <div className="p-8 text-center muted-text">Bracket is calculating...</div>
          )}
        </div>
      </div>
    </div>
  );
}
