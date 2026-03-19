import { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

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

      dispatch({
        type: 'INIT_DATA',
        payload: {
          coins: profileRes.data?.coins || 0,
          buildings: buildingsRes.data || [],
          decorations: decorationsRes.data || [],
          ownedDecorations: ownedDecRes.data || [],
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
    if (!user || state.coins < amount) return false;
    try {
      const newCoins = state.coins - amount;
      await supabase
        .from('profiles')
        .update({ coins: newCoins })
        .eq('user_id', user.id);

      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'purchase',
        amount,
        currency: 'coins',
        description,
      });

      dispatch({ type: 'SPEND_COINS', payload: amount });
      return true;
    } catch (err) {
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

  const buyDecoration = async (decorationId, buildingId) => {
    if (!user) return false;
    const decoration = state.decorations.find(d => d.id === decorationId);
    if (!decoration || state.coins < decoration.price_coins) return false;

    const spent = await spendCoins(decoration.price_coins, `Bought ${decoration.name}`);
    if (!spent) return false;

    try {
      const { data, error } = await supabase
        .from('user_decorations')
        .insert({
          user_id: user.id,
          decoration_id: decorationId,
          building_id: buildingId || null,
        })
        .select('*, decorations(*)')
        .single();

      if (error) throw error;
      dispatch({ type: 'ADD_OWNED_DECORATION', payload: data });
      return true;
    } catch (err) {
      console.error('Error buying decoration:', err);
      return false;
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
