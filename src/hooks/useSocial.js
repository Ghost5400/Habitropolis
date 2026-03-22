import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useSocial() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [profileViewers, setProfileViewers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSocialData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // People who follow ME (accepted)
      const { data: followersData } = await supabase
        .from('follows')
        .select('*, follower:profiles!follows_follower_id_fkey(user_id, display_name, avatar_url, bio)')
        .eq('followed_id', user.id)
        .eq('status', 'accepted');

      // People I follow (accepted)
      const { data: followingData } = await supabase
        .from('follows')
        .select('*, followed:profiles!follows_followed_id_fkey(user_id, display_name, avatar_url, bio)')
        .eq('follower_id', user.id)
        .eq('status', 'accepted');

      // Pending requests TO ME
      const { data: pendingData } = await supabase
        .from('follows')
        .select('*, follower:profiles!follows_follower_id_fkey(user_id, display_name, avatar_url, bio)')
        .eq('followed_id', user.id)
        .eq('status', 'pending');

      // Who viewed my profile (last 50, most recent first)
      const { data: viewsData } = await supabase
        .from('profile_views')
        .select('*, viewer:profiles!profile_views_viewer_id_fkey(user_id, display_name, avatar_url, gecko_active)')
        .eq('viewed_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(50);

      setFollowers(followersData || []);
      setFollowing(followingData || []);
      setPendingRequests(pendingData || []);
      // Filter out viewers with gecko active
      setProfileViewers(
        (viewsData || []).filter(v => !v.viewer?.gecko_active)
      );
    } catch (err) {
      console.error('Error loading social data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSocialData();
  }, [loadSocialData]);

  // Get friends (mutual accepted follows)
  const getFriends = useCallback(() => {
    const followerIds = new Set(followers.map(f => f.follower_id));
    const followingIds = new Set(following.map(f => f.followed_id));
    const mutualIds = [...followerIds].filter(id => followingIds.has(id));
    return followers
      .filter(f => mutualIds.includes(f.follower_id))
      .map(f => f.follower);
  }, [followers, following]);

  const sendFollowRequest = async (targetUserId) => {
    if (!user || targetUserId === user.id) return false;
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, followed_id: targetUserId });
      if (error) throw error;
      await loadSocialData();
      return true;
    } catch (err) {
      console.error('Error sending follow request:', err);
      return false;
    }
  };

  const acceptFollowRequest = async (followId) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('id', followId);
      if (error) throw error;
      await loadSocialData();
      return true;
    } catch (err) {
      console.error('Error accepting follow request:', err);
      return false;
    }
  };

  const rejectFollowRequest = async (followId) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', followId);
      if (error) throw error;
      await loadSocialData();
      return true;
    } catch (err) {
      console.error('Error rejecting follow request:', err);
      return false;
    }
  };

  const removeFollow = async (targetUserId) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followed_id', targetUserId);
      if (error) throw error;
      await loadSocialData();
      return true;
    } catch (err) {
      console.error('Error removing follow:', err);
      return false;
    }
  };

  // Check follow status for a given user
  const getFollowStatus = useCallback((targetUserId) => {
    // Am I following them?
    const myFollow = following.find(f => f.followed_id === targetUserId);
    // Are they following me?
    const theirFollow = followers.find(f => f.follower_id === targetUserId);
    // Did I send a pending request?
    // We need to also check pending outgoing
    if (myFollow) return 'following';
    if (theirFollow) return 'follows_you';
    return 'none';
  }, [following, followers]);

  // Check if I have a pending outgoing request to this user
  const hasPendingOutgoing = useCallback((targetUserId) => {
    // This requires a separate check since our following array only has accepted
    return false; // Will be set via separate state
  }, []);

  const recordProfileView = async (targetUserId) => {
    if (!user || targetUserId === user.id) return;
    try {
      // Check if viewer has gecko active
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('gecko_active')
        .eq('user_id', user.id)
        .single();

      if (myProfile?.gecko_active) return; // Gecko stealth — don't record

      await supabase
        .from('profile_views')
        .insert({ viewer_id: user.id, viewed_id: targetUserId });
    } catch (err) {
      console.error('Error recording profile view:', err);
    }
  };

  return {
    followers,
    following,
    pendingRequests,
    profileViewers,
    friends: getFriends(),
    loading,
    sendFollowRequest,
    acceptFollowRequest,
    rejectFollowRequest,
    removeFollow,
    getFollowStatus,
    recordProfileView,
    refreshSocial: loadSocialData,
  };
}
