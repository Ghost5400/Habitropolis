import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

export function useDuels() {
  const { user } = useAuth();
  const { spendCoins, addCoins } = useGame();
  
  const [activeDuels, setActiveDuels] = useState([]);
  const [pendingDuels, setPendingDuels] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDuels = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('duels')
        .select(`
          *,
          challenger:profiles!duels_challenger_id_fkey(user_id, display_name, avatar_url, active_title),
          defender:profiles!duels_defender_id_fkey(user_id, display_name, avatar_url, active_title)
        `)
        .or(`challenger_id.eq.${user.id},defender_id.eq.${user.id}`)
        .in('status', ['pending', 'active'])
        .order('created_at', { ascending: false });

      if (data) {
        // Evaluate active duels that might be finished
        const now = new Date();
        const active = [];
        const pending = [];

        for (const duel of data) {
          if (duel.status === 'active') {
            const endDate = new Date(duel.end_time);
            if (now >= endDate) {
              await finishDuel(duel);
            } else {
              active.push(duel);
            }
          } else if (duel.status === 'pending') {
            pending.push(duel);
          }
        }
        
        setActiveDuels(active);
        setPendingDuels(pending);
      }
    } catch (err) {
      console.error('Error loading duels:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDuels();
  }, [loadDuels]);

  const challengeFriend = async (friendId, wager = 50) => {
    const success = await spendCoins(wager, 'Challenged friend to duel');
    if (!success) return false;

    const { error } = await supabase.from('duels').insert({
      challenger_id: user.id,
      defender_id: friendId,
      wager
    });

    if (!error) {
      loadDuels();
      return true;
    }
    return false;
  };

  const acceptDuel = async (duel) => {
    const success = await spendCoins(duel.wager, 'Accepted duel wager');
    if (!success) return false;

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 72 * 60 * 60 * 1000); // 3 days

    const { error } = await supabase
      .from('duels')
      .update({ status: 'active', start_time: startTime.toISOString(), end_time: endTime.toISOString() })
      .eq('id', duel.id);
      
    if (!error) loadDuels();
    return !error;
  };

  const declineDuel = async (duel) => {
    // Refund the challenger
    if (user.id === duel.defender_id) {
       await supabase.rpc('add_coins', { amount: duel.wager, target_id: duel.challenger_id, reason: 'Duel declined refund' });
    }
    await supabase.from('duels').update({ status: 'declined' }).eq('id', duel.id);
    loadDuels();
  };

  const incrementDuelScore = async (amount = 1) => {
    if (!activeDuels.length) return;
    
    // Updates local scores immediately just to be snappy
    const updated = [];
    for (const d of activeDuels) {
       const isChallenger = user.id === d.challenger_id;
       const col = isChallenger ? 'challenger_score' : 'defender_score';
       const currentScore = isChallenger ? d.challenger_score : d.defender_score;
       
       await supabase.from('duels')
         .update({ [col]: currentScore + amount })
         .eq('id', d.id);
         
       updated.push({ ...d, [col]: currentScore + amount });
    }
    setActiveDuels(updated);
  };

  const finishDuel = async (duel) => {
    const isChallenger = user.id === duel.challenger_id;
    // Whoever processes it first handles payout
    const amChallengerWinner = duel.challenger_score > duel.defender_score;
    const amDefenderWinner = duel.defender_score > duel.challenger_score;
    const isTie = duel.challenger_score === duel.defender_score;
    
    let winnerId = null;
    if (amChallengerWinner) winnerId = duel.challenger_id;
    if (amDefenderWinner) winnerId = duel.defender_id;

    // Check if it's already completed by the other user during this exact load tick
    const { data: check } = await supabase.from('duels').select('status').eq('id', duel.id).single();
    if (check?.status === 'completed') return;

    await supabase.from('duels')
      .update({ status: 'completed', winner_id: winnerId })
      .eq('id', duel.id);

    // If I'm the winner
    if (winnerId === user.id) {
       addCoins(duel.wager * 2, 'Won 1v1 Habit Duel!');
    } else if (isTie) {
       addCoins(duel.wager, 'Duel Tie Refund');
    }
  };

  return {
    activeDuels,
    pendingDuels,
    loading,
    challengeFriend,
    acceptDuel,
    declineDuel,
    incrementDuelScore,
    refreshDuels: loadDuels
  };
}
