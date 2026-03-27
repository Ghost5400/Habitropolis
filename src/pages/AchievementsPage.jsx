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
    { id: '6', name: 'Skyscraper', description: 'Max out the floors on any building', icon: '🏢', reward_coins: 100 },
    { id: '7', name: 'Golden Collection', description: 'Earn 5 golden stars', icon: '⭐', reward_coins: 300 },
    { id: '8', name: 'Decorator', description: 'Buy your first decoration', icon: '🎨', reward_coins: 20 },
    { id: '9', name: 'Coin Collector', description: 'Earn 500 coins total', icon: '💰', reward_coins: 50 },
    { id: '10', name: 'Habit Machine', description: 'Complete 50 habits', icon: '⚙️', reward_coins: 75 },
    { id: '11', name: 'Century Club', description: 'Complete 100 habits', icon: '💯', reward_coins: 150 },
    { id: '12', name: 'Pet Parent', description: 'Get Parth to Level 5', icon: '🐯', reward_coins: 100 },
    { id: '13', name: 'Tiger Tamer', description: 'Get Parth to Level 10', icon: '🐅', reward_coins: 200 },
    { id: '14', name: 'Happy Tiger', description: "Max out Parth's happiness, hunger, and hygiene", icon: '😻', reward_coins: 50 },
    { id: '15', name: 'Social Butterfly', description: "Visit another mayor's city", icon: '🦋', reward_coins: 20 },
    { id: '16', name: 'Generous Mayor', description: 'Send a gift to a friend', icon: '🎁', reward_coins: 30 },
    { id: '17', name: 'Lucky Draw', description: 'Open a Mystery Chest', icon: '🎰', reward_coins: 20 },
    { id: '18', name: 'Bounty Hunter', description: 'Claim 10 daily bounties', icon: '🎯', reward_coins: 75 },
    { id: '19', name: 'Loyal Citizen', description: 'Log in for 7 days straight', icon: '📅', reward_coins: 100 },
    { id: '20', name: 'Rising Star', description: 'Reach 1000 lifetime XP', icon: '🌟', reward_coins: 100 },
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
