import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';

export const useCity = () => {
  const { user } = useAuth();
  const { buildings, updateBuilding, addCoins } = useGame();

  const getMaxFloors = (frequency) => {
    switch (frequency) {
      case 'daily': return 7;
      case 'weekly': return 4;
      case 'monthly': return 1;
      default: return 7;
    }
  };

  const growBuilding = async (habitId, frequency) => {
    if (!user) return;

    const building = buildings.find(b => b.habit_id === habitId);
    const maxFloors = getMaxFloors(frequency);
    const currentFloors = building?.floors || 0;

    if (currentFloors >= maxFloors) {
      // Reset and add golden star
      const newStars = (building?.golden_stars || 0) + 1;
      await updateBuilding(habitId, {
        floors: 1,
        golden_stars: newStars,
        updated_at: new Date().toISOString(),
      });
      // Bonus coins for completing a building cycle
      await addCoins(50, 'Building cycle complete! ⭐');
    } else {
      await updateBuilding(habitId, {
        floors: currentFloors + 1,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const getBuildingForHabit = (habitId) => {
    return buildings.find(b => b.habit_id === habitId) || {
      habit_id: habitId,
      floors: 0,
      golden_stars: 0,
      decorations: [],
    };
  };

  const placeDecoration = async (buildingId, decorationId) => {
    if (!user) return;

    const building = buildings.find(b => b.habit_id === buildingId);
    if (!building) return;

    const currentDecorations = building.decorations || [];
    const updatedDecorations = [...currentDecorations, decorationId];

    await updateBuilding(buildingId, {
      decorations: updatedDecorations,
    });

    // Update user_decorations to mark it as placed
    await supabase
      .from('user_decorations')
      .update({ building_id: buildingId })
      .eq('decoration_id', decorationId)
      .eq('user_id', user.id);
  };

  return {
    buildings,
    growBuilding,
    getBuildingForHabit,
    placeDecoration,
    getMaxFloors,
  };
};
