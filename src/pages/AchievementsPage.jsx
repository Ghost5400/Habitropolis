import { useGame } from '../contexts/GameContext';
import { Trophy, Lock, Check } from 'lucide-react';
import './AchievementsPage.css';

export default function AchievementsPage() {
  const { achievements, unlockedAchievements } = useGame();

  const isUnlocked = (achievementId) => {
    return unlockedAchievements.some(ua => ua.achievement_id === achievementId);
  };

  const getUnlockDate = (achievementId) => {
    const ua = unlockedAchievements.find(ua => ua.achievement_id === achievementId);
    if (!ua) return null;
    return new Date(ua.unlocked_at).toLocaleDateString();
  };

  // Fallback achievements if none loaded from DB
  const displayAchievements = achievements.length > 0 ? achievements : [
    { id: '1', name: 'First Step', description: 'Complete your first habit', icon: '👣', reward_coins: 10 },
    { id: '2', name: 'Getting Started', description: 'Complete 10 habits', icon: '🌱', reward_coins: 25 },
    { id: '3', name: 'Week Warrior', description: 'Reach a 7-day streak', icon: '🔥', reward_coins: 50 },
    { id: '4', name: 'Month Master', description: 'Reach a 30-day streak', icon: '👑', reward_coins: 200 },
    { id: '5', name: 'City Planner', description: 'Own 5 buildings', icon: '🏗️', reward_coins: 100 },
    { id: '6', name: 'Skyscraper', description: 'Reach max floors on a building', icon: '🏢', reward_coins: 100 },
    { id: '7', name: 'Golden Collection', description: 'Earn 5 golden stars', icon: '⭐', reward_coins: 300 },
    { id: '8', name: 'Decorator', description: 'Buy your first decoration', icon: '🎨', reward_coins: 20 },
    { id: '9', name: 'Hydration Hero', description: 'Complete a counter habit 30 times', icon: '💧', reward_coins: 75 },
    { id: '10', name: 'Bad Habit Breaker', description: 'Resist a bad habit for 30 days', icon: '💪', reward_coins: 150 },
    { id: '11', name: 'Coin Collector', description: 'Earn 500 coins total', icon: '💰', reward_coins: 50 },
    { id: '12', name: 'Shield Master', description: 'Use 3 shields', icon: '🛡️', reward_coins: 30 },
  ];

  const unlockedCount = unlockedAchievements.length;
  const totalCount = displayAchievements.length;

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <div className="achievements-title-row">
          <Trophy size={32} className="trophy-icon" />
          <h1>Achievements</h1>
        </div>
        <div className="achievements-progress glass-sm">
          <div className="progress-text">{unlockedCount}/{totalCount} Unlocked</div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="achievements-grid">
        {displayAchievements.map(achievement => {
          const unlocked = isUnlocked(achievement.id);
          const unlockDate = getUnlockDate(achievement.id);

          return (
            <div
              key={achievement.id}
              className={`achievement-card glass-sm ${unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon-wrapper">
                <span className="achievement-icon">
                  {achievement.icon || '🏆'}
                </span>
                {unlocked ? (
                  <div className="unlock-badge"><Check size={12} /></div>
                ) : (
                  <div className="lock-badge"><Lock size={12} /></div>
                )}
              </div>

              <div className="achievement-info">
                <h3 className="achievement-name">{achievement.name}</h3>
                <p className="achievement-desc">{achievement.description}</p>
                <div className="achievement-reward">
                  <span className="reward-coins">🪙 {achievement.reward_coins} coins</span>
                  {unlockDate && (
                    <span className="unlock-date">Unlocked {unlockDate}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
