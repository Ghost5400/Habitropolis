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

export const useLeague = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leagueReady, setLeagueReady] = useState(false);
  const bracketAssignedRef = useRef(false);

  const getLeagueInfo = useCallback((leagueId) => {
    return LEAGUE_DATA.find(l => l.id === leagueId) || LEAGUE_DATA[0];
  }, []);

  // Try RPC first, then client-side fallback for bracket assignment
  const ensureBracket = async (userId) => {
    try {
      // Try the server-side RPC first (most reliable)
      const { data, error: rpcError } = await supabase.rpc('assign_user_bracket', {
        p_user_id: userId
      });

      if (!rpcError && data) {
        console.log('Bracket assigned via RPC:', data);
        return data;
      }

      console.warn('RPC failed, trying client-side fallback:', rpcError?.message);
    } catch (err) {
      console.warn('RPC exception, trying client-side fallback:', err.message);
    }

    // Client-side fallback: just assign a new group UUID if needed
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('league_id, leaderboard_group_id')
        .eq('user_id', userId)
        .single();

      if (!profile) return null;

      // Already has a group? keep it
      if (profile.leaderboard_group_id) {
        return profile.leaderboard_group_id;
      }

      // Generate a new group and assign it
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

  const loadLeaderboard = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Step 1: First just fetch the profile to see if league columns exist
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('league_id, weekly_score, leaderboard_group_id, display_name, avatar_url, league_cycle_start, settlement_level')
        .eq('user_id', user.id)
        .single();

      if (profileErr) {
        console.error('Profile fetch error:', profileErr);
        throw profileErr;
      }

      // Check if the league columns exist at all
      // PostgREST silently ignores columns that don't exist in the table,
      // so if league_id comes back as undefined, the migration hasn't run
      if (!('league_id' in profile)) {
        throw new Error('league_columns_missing');
      }

      // If league_id is null, the column exists but the user wasn't seeded - fix it
      if (profile.league_id === null || profile.league_id === undefined) {
        await supabase
          .from('profiles')
          .update({ league_id: 1, weekly_score: 0 })
          .eq('user_id', user.id);
        profile.league_id = 1;
        profile.weekly_score = 0;
      }

      // Step 2: Ensure bracket assignment (only once per session)
      if (!bracketAssignedRef.current || !profile.leaderboard_group_id) {
        await ensureBracket(user.id);
        bracketAssignedRef.current = true;

        // Re-fetch profile after bracket assignment
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('league_id, weekly_score, leaderboard_group_id, display_name, avatar_url, league_cycle_start, settlement_level')
          .eq('user_id', user.id)
          .single();

        if (updatedProfile) {
          Object.assign(profile, updatedProfile);
        }
      }

      setUserProfile(profile);

      // Step 3: Fetch bracket leaderboard
      if (profile.leaderboard_group_id) {
        const { data: bracket, error: bracketErr } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, weekly_score, league_id')
          .eq('leaderboard_group_id', profile.leaderboard_group_id)
          .eq('league_id', profile.league_id)
          .order('weekly_score', { ascending: false });

        if (bracketErr) {
          console.warn('Bracket fetch error (may be RLS):', bracketErr.message);
          // Fallback: just show the user themselves
          setLeaderboard([{
            user_id: user.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            weekly_score: profile.weekly_score || 0,
            league_id: profile.league_id
          }]);
        } else {
          setLeaderboard(bracket && bracket.length > 0 ? bracket : [{
            user_id: user.id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            weekly_score: profile.weekly_score || 0,
            league_id: profile.league_id
          }]);
        }
      } else {
        // No bracket yet - show just the user
        setLeaderboard([{
          user_id: user.id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          weekly_score: profile.weekly_score || 0,
          league_id: profile.league_id
        }]);
      }

      setLeagueReady(true);
    } catch (err) {
      console.error('League load error:', err);
      if (err.message === 'league_columns_missing') {
        setError('migration_needed');
      } else {
        // Show the actual Supabase error to help debug
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

  // Compute cycle progress from league_cycle_start
  const getCycleProgress = useCallback(() => {
    const cycleStart = userProfile?.league_cycle_start;
    if (!cycleStart) return { daysElapsed: 0, daysRemaining: 7, progressPercent: 0 };
    const msElapsed = Date.now() - new Date(cycleStart).getTime();
    const daysElapsed = Math.min(7, Math.floor(msElapsed / 86400000));
    return {
      daysElapsed,
      daysRemaining: 7 - daysElapsed,
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
    settlementLevel: userProfile?.settlement_level || 1,
    ...getCycleProgress(),
  };
};
