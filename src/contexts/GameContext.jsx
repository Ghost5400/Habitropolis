import { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { notifyAchievementUnlocked } from '../lib/notifications';

const GameContext = createContext();

const initialState = {
  coins: 0,
  buildings: [],
  decorations: [],
  ownedDecorations: [],
  achievements: [],
  unlockedAchievements: [],
  loading: true,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_COINS':
      return { ...state, coins: action.payload };
    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.payload };
    case 'SPEND_COINS':
      return { ...state, coins: Math.max(0, state.coins - action.payload) };
    case 'SET_BUILDINGS':
      return { ...state, buildings: action.payload };
    case 'UPDATE_BUILDING':
      return {
        ...state,
        buildings: state.buildings.map(b =>
          b.habit_id === action.payload.habit_id ? { ...b, ...action.payload } : b
        ),
      };
    case 'SET_DECORATIONS':
      return { ...state, decorations: action.payload };
    case 'SET_OWNED_DECORATIONS':
      return { ...state, ownedDecorations: action.payload };
    case 'ADD_OWNED_DECORATION':
      return { ...state, ownedDecorations: [...state.ownedDecorations, action.payload] };
    case 'SET_ACHIEVEMENTS':
      return { ...state, achievements: action.payload };
    case 'SET_UNLOCKED_ACHIEVEMENTS':
      return { ...state, unlockedAchievements: action.payload };
    case 'UNLOCK_ACHIEVEMENT':
      return {
        ...state,
        unlockedAchievements: [...state.unlockedAchievements, action.payload],
      };
    case 'INIT_DATA':
      return { ...state, ...action.payload, loading: false };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    if (user) {
      loadGameData();
    } else {
      dispatch({ type: 'INIT_DATA', payload: initialState });
    }
  }, [user]);

  const loadGameData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const [profileRes, buildingsRes, decorationsRes, ownedDecRes, achievementsRes, unlockedRes] =
        await Promise.all([
          supabase.from('profiles').select('coins').eq('user_id', user.id).single(),
          supabase.from('city_buildings').select('*').eq('user_id', user.id),
          supabase.from('decorations').select('*'),
          supabase.from('user_decorations').select('*, decorations(*)').eq('user_id', user.id),
          supabase.from('achievements').select('*'),
          supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', user.id),
        ]);

      const fallbackDecorations = JSON.parse(localStorage.getItem(`emergency_decorations_${user.id}`) || '[]');

      dispatch({
        type: 'INIT_DATA',
        payload: {
          coins: profileRes.data?.coins || 0,
          buildings: buildingsRes.data || [],
          decorations: decorationsRes.data || [],
          ownedDecorations: [...(ownedDecRes.data || []), ...fallbackDecorations],
          achievements: achievementsRes.data || [],
          unlockedAchievements: unlockedRes.data || [],
        },
      });
    } catch (err) {
      console.error('Error loading game data:', err);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addCoins = async (amount, description = 'Habit completion') => {
    if (!user) return;
    try {
      const newCoins = state.coins + amount;
      await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('user_id', user.id);

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'earn',
        amount,
        currency: 'coins',
        description,
      });

      dispatch({ type: 'ADD_COINS', payload: amount });
      return newCoins;
    } catch (err) {
      console.error('Error adding coins:', err);
    }
  };

  const spendCoins = async (amount, description = 'Purchase') => {
    if (!user) { alert("DEBUG spendCoins: No user"); return false; }
    if (state.coins < amount) { alert(`DEBUG spendCoins: state.coins (${state.coins}) < amount (${amount})`); return false; }
    try {
      const newCoins = state.coins - amount;
      const res1 = await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('user_id', user.id);
        
      if (res1.error) alert("DEBUG profiles: " + res1.error.message);

      const res2 = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'purchase',
        amount,
        currency: 'coins',
        description,
      });
      if (res2.error) alert("DEBUG transactions: " + res2.error.message);

      dispatch({ type: 'SPEND_COINS', payload: amount });
      return true;
    } catch (err) {
      alert("DEBUG spendCoins catch: " + err.message);
      console.error('Error spending coins:', err);
      return false;
    }
  };

  const updateBuilding = async (habitId, updates) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('city_buildings')
        .upsert({ habit_id: habitId, user_id: user.id, ...updates }, { onConflict: 'habit_id' })
        .select()
        .single();

      if (error) throw error;
      dispatch({ type: 'UPDATE_BUILDING', payload: data });
      return data;
    } catch (err) {
      console.error('Error updating building:', err);
    }
  };

  const buyDecoration = async (decorationObj, buildingId) => {
    if (!user) { alert("DEBUG: No user found in GameContext"); return false; }
    if (!decorationObj) { alert("DEBUG: decorationObj is undefined"); return false; }
    if (state.coins < decorationObj.price_coins) { alert("DEBUG: state.coins is less than price"); return false; }

    const spent = await spendCoins(decorationObj.price_coins, `Bought ${decorationObj.name}`);
    if (!spent) { alert("DEBUG: spendCoins returned false!"); return false; }

    try {
      const { data, error } = await supabase
        .from('user_decorations')
        .insert({
          user_id: user.id,
          decoration_id: decorationObj.id,
          building_id: buildingId || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Database enforcement error:', error.message);
        throw error;
      }
      
      const payload = { ...data, decorations: decorationObj };
      dispatch({ type: 'ADD_OWNED_DECORATION', payload });
      return true;
    } catch (err) {
      console.error('Error buying decoration:', err);
      try {
        const currentLocal = JSON.parse(localStorage.getItem(`emergency_decorations_${user.id}`) || '[]');
        const newDeco = {
          id: Math.random().toString(),
          user_id: user.id,
          decoration_id: decorationObj.id,
          building_id: buildingId || null,
          decorations: decorationObj
        };
        currentLocal.push(newDeco);
        localStorage.setItem(`emergency_decorations_${user.id}`, JSON.stringify(currentLocal));
        
        dispatch({ type: 'ADD_OWNED_DECORATION', payload: newDeco });
        return true; 
      } catch (critErr) {
        alert("DEBUG: Even the emergency fallback failed! " + critErr.message);
        return false;
      }
    }
  };

  const unlockAchievement = async (achievementId) => {
    if (!user) return;
    const alreadyUnlocked = state.unlockedAchievements.some(
      ua => ua.achievement_id === achievementId
    );
    if (alreadyUnlocked) return;

    const achievement = state.achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({ user_id: user.id, achievement_id: achievementId })
        .select('*, achievements(*)')
        .single();

      if (error) throw error;

      dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: data });

      if (achievement.reward_coins > 0) {
        await addCoins(achievement.reward_coins, `Achievement: ${achievement.name}`);
      }

      // Officially notify the user visually!
      notifyAchievementUnlocked(achievement.name, achievement.reward_coins);

      return data;
    } catch (err) {
      console.error('Error unlocking achievement:', err);
    }
  };

  const refreshData = () => loadGameData();

  return (
    <GameContext.Provider
      value={{
        ...state,
        dispatch,
        addCoins,
        spendCoins,
        updateBuilding,
        buyDecoration,
        unlockAchievement,
        refreshData,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
