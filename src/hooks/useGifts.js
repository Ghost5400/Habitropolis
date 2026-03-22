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
      setUnreadGifts(data || []);
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
    if (!user) return;
    
    const gift = unreadGifts.find(g => g.id === giftId);
    if (!gift) return;

    try {
      // 1. Add decoration to user_decorations
      const { error: insErr } = await supabase
        .from('user_decorations')
        .insert({
          user_id: user.id,
          decoration_id: gift.item_id
        });
        
      if (insErr) throw insErr;

      // 2. Mark gift as opened
      const { error: updErr } = await supabase
        .from('user_gifts')
        .update({ is_opened: true })
        .eq('id', giftId);
        
      if (updErr) throw updErr;

      // Update local state
      setUnreadGifts(prev => prev.filter(g => g.id !== giftId));
      
      return true;
    } catch (err) {
      console.error('Failed to open gift:', err);
      return false;
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
