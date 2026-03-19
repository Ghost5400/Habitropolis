import { useGame } from '../contexts/GameContext';

export const useCoins = () => {
  const { coins, addCoins, spendCoins } = useGame();

  const getCoinReward = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 5;
      case 'medium': return 10;
      case 'hard': return 20;
      default: return 5;
    }
  };

  const getShieldCost = (days) => {
    const costs = { 1: 10, 2: 18, 3: 25, 4: 32, 5: 38, 6: 44, 7: 50 };
    return costs[days] || days * 8;
  };

  return {
    coins,
    addCoins,
    spendCoins,
    getCoinReward,
    getShieldCost,
  };
};
