import { useEffect, useState } from 'react';
import { useHabits } from '../hooks/useHabits';
import { useStreaks } from '../hooks/useStreaks';
import { useGame } from '../contexts/GameContext';
import { useCity } from '../hooks/useCity';
import { useCoins } from '../hooks/useCoins';
import QuoteBanner from '../components/QuoteBanner';
import HabitCard from '../components/HabitCard';
import { scheduleHabitReminders, registerServiceWorker, requestNotificationPermission } from '../lib/notifications';
import { Target, Flame, Coins, Building2, Gift, Check, CheckCircle2, MailOpen } from 'lucide-react';
import ParthBanner from '../components/ParthBanner';
import { useBounties } from '../hooks/useBounties';
import { useGifts } from '../hooks/useGifts';
import DecorationSVG from '../components/DecorationSVG';
import './DashboardPage.css';

export default function DashboardPage() {
  const { habits, todayLogs, loading, completeHabit, fetchHabits } = useHabits();
  const { streaks, updateStreak } = useStreaks();
  const { coins } = useGame();
  const { growBuilding } = useCity();
  const { getCoinReward } = useCoins();
  const { addCoins, fetchGameData } = useGame(); // Need fetchGameData to refresh decorations after opening gift
  const { bounties, tigerTokens, calculateProgress, claimBounty } = useBounties(habits, todayLogs);
  const { unreadGifts, openGift } = useGifts();
  
  const [openingGift, setOpeningGift] = useState(null);

  useEffect(() => {
    registerServiceWorker();
    setTimeout(() => {
      requestNotificationPermission();
    }, 3000);
    if (habits.length > 0) {
      scheduleHabitReminders(habits);
    }
  }, [habits]);

  const completedToday = Object.values(todayLogs).filter(l => l.completed).length;
  const bestStreak = Object.values(streaks).reduce(
    (max, s) => Math.max(max, s.current_streak || 0), 0
  );

  const dailyHabits = habits.filter(h => h.frequency === 'daily');
  const weeklyHabits = habits.filter(h => h.frequency === 'weekly');
  const monthlyHabits = habits.filter(h => h.frequency === 'monthly');

  const handleComplete = async (habit) => {
    try {
      const result = await completeHabit(habit.id);

      if (result.completed) {
        // Award coins
        const reward = getCoinReward(habit.difficulty);
        await addCoins(reward, `Completed: ${habit.name}`);

        // Update streak
        await updateStreak(habit.id, true);

        // Grow building
        await growBuilding(habit.id, habit.frequency);
      } else {
        await updateStreak(habit.id, false);
      }
    } catch (err) {
      console.error('Error completing habit:', err);
    }
  };

  const handleOpenGift = async (giftId) => {
    setOpeningGift(giftId);
    await openGift(giftId);
    // Give enough time to show an animation before it disappears from the array
    setTimeout(() => {
      setOpeningGift(null);
      fetchGameData(); // Refresh UI to make sure UserDecorations is updated on City Page
    }, 1500);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <img src="/parth.png" alt="Parth" style={{ width: '120px', height: '120px', objectFit: 'contain', animation: 'float 2s ease-in-out infinite' }} />
        <p>Loading your habitropolis...</p>
      </div>
    );
  }

  const renderHabitSection = (title, habitList) => {
    if (habitList.length === 0) return null;
    return (
      <div className="habits-section">
        <h2 className="section-title">{title}</h2>
        <div className="habits-grid">
          {habitList.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              todayLog={todayLogs[habit.id]}
              streak={streaks[habit.id]}
              onComplete={() => handleComplete(habit)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-page">
      <ParthBanner show={true} />
      <QuoteBanner />

      {/* Gifts Mailbox */}
      {unreadGifts?.length > 0 && (
        <div className="gifts-mailbox-section">
          {unreadGifts.map(gift => (
            <div key={gift.id} className="gift-inbox-card glass-sm">
              <div className="gift-inbox-content">
                <div className="gift-inbox-icon">
                  {openingGift === gift.id ? <MailOpen size={30} className="text-promote" /> : <Gift size={30} className="text-gold pulse-anim" />}
                </div>
                <div className="gift-inbox-text">
                  <h3>Special Delivery!</h3>
                  <p>You received a gift from <strong>{gift.sender?.display_name || 'Mayor'}</strong>!</p>
                  {openingGift === gift.id && (
                     <div className="gift-reveal fadeIn">
                       <DecorationSVG type={gift.item_id} />
                       <span className="text-promote font-bold mt-2 d-block">Item added to your inventory!</span>
                     </div>
                  )}
                </div>
              </div>
              <button 
                className="btn btn-primary btn-icon"
                onClick={() => handleOpenGift(gift.id)}
                disabled={openingGift === gift.id}
              >
                {openingGift === gift.id ? 'Opening...' : 'Open Gift'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Parth Motivator */}
      {habits.length > 0 && (
        <div className="parth-motivator glass-sm">
          <img
            src={completedToday === habits.length ? '/parth.png' : completedToday > 0 ? '/parth-waving.png' : '/parth-construction.png'}
            alt="Parth"
            className="parth-motivator-img"
          />
          <div className="parth-motivator-text">
            <div className="parth-quote">
              {completedToday === habits.length
                ? "All habits done! You're a legend today! 🏆"
                : completedToday > habits.length / 2
                ? `Almost there! Just ${habits.length - completedToday} more to go! 💪`
                : completedToday > 0
                ? `Good start! ${completedToday} down, ${habits.length - completedToday} to go! 🔥`
                : "Hey Mayor! Your city needs you — let's crush some habits! 🐯"}
            </div>
            <div className="parth-name">— Parth 🐯</div>
          </div>
        </div>
      )}

      {/* Daily Bounties */}
      <div className="daily-bounties-section">
        <div className="bounties-header">
          <h2>🎯 Parth's Daily Requests</h2>
          <div className="tiger-tokens-badge glass-sm">
            🐯 {tigerTokens} Tokens
          </div>
        </div>
        
        <div className="bounties-grid">
          {bounties?.map(bounty => {
            const progress = calculateProgress(bounty);
            const isReadyToClaim = progress >= bounty.target && !bounty.is_claimed;
            
            return (
              <div key={bounty.id} className={`bounty-card glass-sm ${bounty.is_claimed ? 'claimed' : isReadyToClaim ? 'ready' : ''}`}>
                <div className="bounty-icon-wrapper">
                  {bounty.is_claimed ? <CheckCircle2 size={24} className="claimed-icon" /> : <Gift size={24} />}
                </div>
                <div className="bounty-info">
                  <h3 className="bounty-title">{bounty.title}</h3>
                  <p className="bounty-desc">{bounty.desc}</p>
                  
                  {!bounty.is_claimed && (
                    <div className="bounty-progress">
                      <div className="bounty-progress-bar">
                        <div 
                          className="bounty-progress-fill" 
                          style={{ width: `${Math.min(100, (progress / bounty.target) * 100)}%` }}
                        />
                      </div>
                      <span className="bounty-progress-text">{progress}/{bounty.target}</span>
                    </div>
                  )}
                </div>
                
                <div className="bounty-action">
                  {bounty.is_claimed ? (
                    <span className="bounty-status-text text-muted">Claimed</span>
                  ) : isReadyToClaim ? (
                    <button 
                      className="btn btn-primary btn-sm claim-btn"
                      onClick={() => claimBounty(bounty.id)}
                    >
                      Claim {bounty.reward} 🐯
                    </button>
                  ) : (
                    <div className="bounty-reward-box">
                      <span className="reward-val">{bounty.reward}</span>
                      <span className="reward-icon">🐯</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dashboard-stats tour-dashboard-stats">
        <div className="stat-card glass-sm">
          <Target size={22} className="stat-icon" />
          <div>
            <div className="stat-value">{habits.length}</div>
            <div className="stat-label">Habits</div>
          </div>
        </div>
        <div className="stat-card glass-sm">
          <div className="stat-icon check-icon">✅</div>
          <div>
            <div className="stat-value">{completedToday}/{habits.length}</div>
            <div className="stat-label">Today</div>
          </div>
        </div>
        <div className="stat-card glass-sm">
          <Flame size={22} className="stat-icon fire" />
          <div>
            <div className="stat-value">{bestStreak}</div>
            <div className="stat-label">Best Streak</div>
          </div>
        </div>
        <div className="stat-card glass-sm">
          <Coins size={22} className="stat-icon coin" />
          <div>
            <div className="stat-value">{coins}</div>
            <div className="stat-label">Coins</div>
          </div>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="empty-state glass">
          <img src="/parth-waving.png" alt="Parth" style={{ width: '140px', height: '140px', objectFit: 'contain', marginBottom: '1rem' }} />
          <h3>Welcome to Habitropolis!</h3>
          <p>I'm <strong>Parth</strong>, your city-building buddy! Click <strong>"NEW HABIT"</strong> in the quote above to start building your city of good habits.</p>
        </div>
      ) : (
        <>
          {renderHabitSection('📅 Daily Habits', dailyHabits)}
          {renderHabitSection('📆 Weekly Habits', weeklyHabits)}
          {renderHabitSection('🗓️ Monthly Habits', monthlyHabits)}
        </>
      )}
    </div>
  );
}