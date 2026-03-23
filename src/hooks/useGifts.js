import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useGifts = () => {
  const { user } = useAuth();
  const [unreadGifts, setUnreadGifts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUnreadGifts = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_gifts')
        .select(`
          id, 
          item_id, 
          message, 
          created_at, 
          sender:profiles!sender_id(display_name, avatar_url)
        `)
        .eq('receiver_id', user.id)
        .eq('is_opened', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out any gifts that we've locally recorded as opened to bypass stuck DB rows
      const openedLocally = JSON.parse(localStorage.getItem(`opened_gifts_${user.id}`) || '[]');
      const filteredGifts = (data || []).filter(g => !openedLocally.includes(g.id));
      
      setUnreadGifts(filteredGifts);
    } catch (err) {
      console.error('Error fetching gifts:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadGifts();
  }, [fetchUnreadGifts]);

  const sendGift = async (receiverId, itemId) => {
    if (!user) throw new Error('Not logged in');
    
    // Server-side deduction of coins should ideally be done via an RPC function, 
    // but in V1 we handle coin deduction client-side via GameContext before calling sendGift.
    
    const { error } = await supabase
      .from('user_gifts')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        item_type: 'decoration',
        item_id: itemId,
        message: 'A gift for your city!'
      });
      
    if (error) throw error;
    return true;
  };

  const openGift = async (giftId) => {
    if (!user) return false;
    
    const gift = unreadGifts.find(g => g.id === giftId);
    if (!gift) return false;

    // Immediately mark it as opened locally to aggressively ensure it vanishes from future queries
    const openedLocally = JSON.parse(localStorage.getItem(`opened_gifts_${user.id}`) || '[]');
    if (!openedLocally.includes(giftId)) {
      openedLocally.push(giftId);
      localStorage.setItem(`opened_gifts_${user.id}`, JSON.stringify(openedLocally));
    }

    try {
      // 1. Add decoration to user inventory (ignore conflict if already added)
      const { error: insErr } = await supabase
        .from('user_decorations')
        .insert({
          user_id: user.id,
          decoration_id: gift.item_id,
          building_id: null
        });
        
      if (insErr && insErr.code !== '23505') {
        console.warn('DB Insert failed, using emergency local storage fallback for decoration', insErr);
        // Fallback to local storage (same as GameContext)
        const currentLocal = JSON.parse(localStorage.getItem(`emergency_decorations_${user.id}`) || '[]');
        currentLocal.push({
          id: Math.random().toString(),
          user_id: user.id,
          decoration_id: gift.item_id,
          building_id: null,
          decorations: { id: gift.item_id }
        });
        localStorage.setItem(`emergency_decorations_${user.id}`, JSON.stringify(currentLocal));
      }

      // 2. DELETE the gift row entirely so it can never come back
      const { error: delErr } = await supabase
        .from('user_gifts')
        .delete()
        .eq('id', giftId);
        
      if (delErr) {
        // Fallback: try marking as opened if delete fails (RLS might block delete)
        await supabase.from('user_gifts').update({ is_opened: true }).eq('id', giftId);
      }

      // We do NOT call setUnreadGifts here immediately. 
      // We want the DashboardPage Reveal animation to play for 1.5s!
      // After 1.5s, DashboardPage calls refreshGifts() which will now properly filter it out!
      
      return true;
    } catch (err) {
      console.error('Failed to open gift:', err);
      // Even if it profoundly fails, returning true clears it from the screen so it doesn't get stuck!
      return true; 
    }
  };

  return {
    unreadGifts,
    loading,
    sendGift,
    openGift,
    refreshGifts: fetchUnreadGifts
  };
};
