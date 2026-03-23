import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const LEAGUE_DATA = [
  { id: 1, name: 'Dirt League', city_level: 1, tier: 'Dwelling', color: '#8B6914' },
  { id: 2, name: 'Wood League', city_level: 1, tier: 'Dwelling', color: '#A0522D' },
  { id: 3, name: 'Stone League', city_level: 1, tier: 'Dwelling', color: '#808080' },
  { id: 4, name: 'Brick League', city_level: 1, tier: 'Dwelling', color: '#CB4154' },
  { id: 5, name: 'Copper League', city_level: 2, tier: 'Settlement', color: '#B87333' },
  { id: 6, name: 'Iron League', city_level: 2, tier: 'Settlement', color: '#848484' },
  { id: 7, name: 'Steel League', city_level: 2, tier: 'Settlement', color: '#71797E' },
  { id: 8, name: 'Cobalt League', city_level: 2, tier: 'Settlement', color: '#0047AB' },
  { id: 9, name: 'Amber League', city_level: 3, tier: 'Village', color: '#FFBF00' },
  { id: 10, name: 'Topaz League', city_level: 3, tier: 'Village', color: '#FFC87C' },
  { id: 11, name: 'Quartz League', city_level: 3, tier: 'Village', color: '#E8D0A9' },
  { id: 12, name: 'Pearl League', city_level: 3, tier: 'Village', color: '#FDEEF4' },
  { id: 13, name: 'Jade League', city_level: 4, tier: 'Town', color: '#00A86B' },
  { id: 14, name: 'Sapphire League', city_level: 4, tier: 'Town', color: '#0F52BA' },
  { id: 15, name: 'Emerald League', city_level: 4, tier: 'Town', color: '#50C878' },
  { id: 16, name: 'Ruby League', city_level: 4, tier: 'Town', color: '#E0115F' },
  { id: 17, name: 'Bronze League', city_level: 5, tier: 'City', color: '#CD7F32' },
  { id: 18, name: 'Silver League', city_level: 5, tier: 'City', color: '#C0C0C0' },
  { id: 19, name: 'Gold League', city_level: 5, tier: 'City', color: '#FFD700' },
  { id: 20, name: 'Platinum League', city_level: 5, tier: 'City', color: '#E5E4E2' },
  { id: 21, name: 'Obsidian League', city_level: 6, tier: 'Metropolis', color: '#3D3635' },
  { id: 22, name: 'Neon League', city_level: 6, tier: 'Metropolis', color: '#39FF14' },
  { id: 23, name: 'Plasma League', city_level: 6, tier: 'Metropolis', color: '#8F00FF' },
  { id: 24, name: 'Titanium League', city_level: 6, tier: 'Metropolis', color: '#878681' },
  { id: 25, name: 'Diamond League', city_level: 7, tier: 'Megalopolis', color: '#B9F2FF' },
  { id: 26, name: 'Apex League', city_level: 7, tier: 'Megalopolis', color: '#FF4500' },
  { id: 27, name: 'Quantum League', city_level: 7, tier: 'Megalopolis', color: '#7DF9FF' },
  { id: 28, name: 'Celestial League', city_level: 7, tier: 'Megalopolis', color: '#FFD700' },
];

// Get the most recent Monday at midnight UTC
function getLastMonday() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1; // Days since last Monday
  const monday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - diff,
    0, 0, 0, 0
  ));
  return monday;
}

// Get the upcoming Monday at midnight UTC
function getNextMonday() {
  const lastMon = getLastMonday();
  return new Date(lastMon.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export const useLeague = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leagueReady, setLeagueReady] = useState(false);
  const [weekReset, setWeekReset] = useState(false);
  const bracketAssignedRef = useRef(false);

  const getLeagueInfo = useCallback((leagueId) => {
    return LEAGUE_DATA.find(l => l.id === leagueId) || LEAGUE_DATA[0];
  }, []);

  // Try RPC first, then client-side fallback for bracket assignment
  const ensureBracket = async (userId) => {
    try {
      const { data, error: rpcError } = await supabase.rpc('assign_user_bracket', {
        p_user_id: userId
      });

      if (!rpcError && data) {
        return data;
      }
    } catch (err) {
      console.warn('RPC exception, trying client-side fallback:', err.message);
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('league_id, leaderboard_group_id')
        .eq('user_id', userId)
        .single();

      if (!profile) return null;
      if (profile.leaderboard_group_id) return profile.leaderboard_group_id;

      const newGroup = crypto.randomUUID();
      await supabase
        .from('profiles')
        .update({ leaderboard_group_id: newGroup })
        .eq('user_id', userId);

      return newGroup;
    } catch (err) {
      console.error('Client-side bracket assign failed:', err);
      return null;
    }
  };

  // ===== THE CORE WEEKLY RESET LOGIC =====
  const checkAndRunWeeklyReset = async (profile) => {
    if (!user || !profile) return profile;

    const cycleStart = profile.league_cycle_start ? new Date(profile.league_cycle_start) : null;
    const lastMonday = getLastMonday();

    // Case 1: cycle_start has never been set — initialize it to this Monday
    if (!cycleStart) {
      await supabase
        .from('profiles')
        .update({ league_cycle_start: lastMonday.toISOString(), weekly_score: 0 })
        .eq('user_id', user.id);
      return { ...profile, league_cycle_start: lastMonday.toISOString(), weekly_score: 0 };
    }

    // Case 2: The stored cycle_start is from a PREVIOUS week (before this Monday)
    // That means a new week has started and we need to reset!
    if (cycleStart < lastMonday) {
      console.log('🔄 Weekly league reset triggered!');

      // Determine promotion/demotion based on last week's bracket ranking
      let newLeagueId = profile.league_id || 1;

      if (profile.leaderboard_group_id) {
        try {
          const { data: bracket } = await supabase
            .from('profiles')
            .select('user_id, weekly_score')
            .eq('leaderboard_group_id', profile.leaderboard_group_id)
            .eq('league_id', profile.league_id)
            .order('weekly_score', { ascending: false });

          if (bracket && bracket.length > 1) {
            const myRank = bracket.findIndex(b => b.user_id === user.id) + 1;
            const total = bracket.length;
            const promoteCutoff = Math.max(1, Math.ceil(total * 0.30)); // Top 30%
            const demoteCutoff = total - Math.max(1, Math.floor(total * 0.23)) + 1; // Bottom 23%

            if (myRank <= promoteCutoff && newLeagueId < 28) {
              newLeagueId = newLeagueId + 1;
              console.log('⬆️ Promoted to league', newLeagueId);
            } else if (myRank >= demoteCutoff && newLeagueId > 1) {
              newLeagueId = newLeagueId - 1;
              console.log('⬇️ Demoted to league', newLeagueId);
            }
          }
        } catch (err) {
          console.warn('Could not evaluate bracket for promotion:', err.message);
        }
      }

      // Reset score, update cycle start, assign new league, new bracket
      const newGroup = crypto.randomUUID();
      await supabase
        .from('profiles')
        .update({
          weekly_score: 0,
          league_cycle_start: lastMonday.toISOString(),
          league_id: newLeagueId,
          leaderboard_group_id: newGroup,
        })
        .eq('user_id', user.id);

      setWeekReset(true);
      bracketAssignedRef.current = true;

      return {
        ...profile,
        weekly_score: 0,
        league_cycle_start: lastMonday.toISOString(),
        league_id: newLeagueId,
        leaderboard_group_id: newGroup,
      };
    }

    // Case 3: We're still in the current week — do nothing
    return profile;
  };

  const loadLeaderboard = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('league_id, weekly_score, leaderboard_group_id, display_name, avatar_url, league_cycle_start, settlement_level')
        .eq('user_id', user.id)
        .single();

      if (profileErr) throw profileErr;

      if (!('league_id' in profile)) {
        throw new Error('league_columns_missing');
      }

      // Seed defaults if needed
      if (profile.league_id === null || profile.league_id === undefined) {
        await supabase
          .from('profiles')
          .update({ league_id: 1, weekly_score: 0 })
          .eq('user_id', user.id);
        profile.league_id = 1;
        profile.weekly_score = 0;
      }

      // ===== CHECK WEEKLY RESET =====
      const updatedProfile = await checkAndRunWeeklyReset(profile);

      // Ensure bracket assignment
      if (!bracketAssignedRef.current || !updatedProfile.leaderboard_group_id) {
        await ensureBracket(user.id);
        bracketAssignedRef.current = true;

        const { data: refreshed } = await supabase
          .from('profiles')
          .select('league_id, weekly_score, leaderboard_group_id, display_name, avatar_url, league_cycle_start, settlement_level')
          .eq('user_id', user.id)
          .single();

        if (refreshed) Object.assign(updatedProfile, refreshed);
      }

      setUserProfile(updatedProfile);

      // Fetch bracket leaderboard
      if (updatedProfile.leaderboard_group_id) {
        const { data: bracket, error: bracketErr } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, weekly_score, league_id')
          .eq('leaderboard_group_id', updatedProfile.leaderboard_group_id)
          .eq('league_id', updatedProfile.league_id)
          .order('weekly_score', { ascending: false });

        if (bracketErr) {
          setLeaderboard([{
            user_id: user.id,
            display_name: updatedProfile.display_name,
            avatar_url: updatedProfile.avatar_url,
            weekly_score: updatedProfile.weekly_score || 0,
            league_id: updatedProfile.league_id
          }]);
        } else {
          setLeaderboard(bracket && bracket.length > 0 ? bracket : [{
            user_id: user.id,
            display_name: updatedProfile.display_name,
            avatar_url: updatedProfile.avatar_url,
            weekly_score: updatedProfile.weekly_score || 0,
            league_id: updatedProfile.league_id
          }]);
        }
      } else {
        setLeaderboard([{
          user_id: user.id,
          display_name: updatedProfile.display_name,
          avatar_url: updatedProfile.avatar_url,
          weekly_score: updatedProfile.weekly_score || 0,
          league_id: updatedProfile.league_id
        }]);
      }

      setLeagueReady(true);
    } catch (err) {
      console.error('League load error:', err);
      if (err.message === 'league_columns_missing') {
        setError('migration_needed');
      } else {
        setError(err.message || 'Unknown error loading league data');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Increment weekly score
  const addWeeklyScore = useCallback(async (points) => {
    if (!user || !points) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('weekly_score')
        .eq('user_id', user.id)
        .single();

      if (data && data.weekly_score !== undefined) {
        const newScore = (data.weekly_score || 0) + points;
        await supabase
          .from('profiles')
          .update({ weekly_score: newScore })
          .eq('user_id', user.id);

        setUserProfile(prev => prev ? { ...prev, weekly_score: newScore } : prev);
      }
    } catch (err) {
      console.warn('Could not update weekly_score:', err.message);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadLeaderboard();
    }
  }, [user]);

  // Compute cycle progress using Monday-to-Monday logic
  const getCycleProgress = useCallback(() => {
    const cycleStart = userProfile?.league_cycle_start;
    if (!cycleStart) return { daysElapsed: 0, daysRemaining: 7, progressPercent: 0 };

    const start = new Date(cycleStart);
    const now = new Date();
    const msElapsed = now.getTime() - start.getTime();
    const daysElapsed = Math.min(7, Math.floor(msElapsed / (24 * 60 * 60 * 1000)));
    
    return {
      daysElapsed,
      daysRemaining: Math.max(0, 7 - daysElapsed),
      progressPercent: Math.round((daysElapsed / 7) * 100),
    };
  }, [userProfile]);

  return {
    userProfile,
    leaderboard,
    loading,
    error,
    leagueReady,
    leagueData: LEAGUE_DATA,
    getLeagueInfo,
    loadLeaderboard,
    addWeeklyScore,
    weekReset,
    settlementLevel: userProfile?.settlement_level || 1,
    ...getCycleProgress(),
  };
};
