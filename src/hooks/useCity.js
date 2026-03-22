import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { getHabitTheme } from '../components/CityBuildingSVG';
import { supabase } from '../lib/supabase';

// Assets that only exist as SVG (fallbacks for missing PNGs)
const SVG_ASSETS = new Set(['air_L1', 'air_L2', 'art_L2', 'gaming_L2', 'focus_L2']);

// Returns the path to the correct building image given the habit theme + settlement level
export const getBuildingImage = (theme, settlementLevel = 1) => {
  // Cap at level 2 until L3–L7 assets are created
  const level = Math.min(settlementLevel, 2);
  const key = `${theme}_L${level}`;
  const ext = SVG_ASSETS.has(key) ? 'svg' : 'png';
  return `/assets/buildings/${key}.${ext}`;
};

export const useCity = () => {
  const { user } = useAuth();
  const { buildings, updateBuilding } = useGame();

  const getBuildingForHabit = (habitId) => {
    return buildings.find(b => b.habit_id === habitId) || {
      habit_id: habitId,
      decorations: [],
    };
  };

  const placeDecoration = async (buildingId, decorationId) => {
    if (!user) return;

    const building = buildings.find(b => b.habit_id === buildingId);
    if (!building) return;

    const currentDecorations = building.decorations || [];
    const updatedDecorations = [...currentDecorations, decorationId];

    await updateBuilding(buildingId, { decorations: updatedDecorations });

    await supabase
      .from('user_decorations')
      .update({ building_id: buildingId })
      .eq('decoration_id', decorationId)
      .eq('user_id', user.id);
  };

  return {
    buildings,
    getBuildingForHabit,
    getBuildingImage,
    placeDecoration,
  };
};
