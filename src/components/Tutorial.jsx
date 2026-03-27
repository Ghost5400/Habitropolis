import { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import { useAuth } from '../contexts/AuthContext';

export default function Tutorial() {
  const { user } = useAuth();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run if the user is logged in
    if (!user) return;
    
    // Check if they have completed or skipped the tutorial
    const hasCompleted = localStorage.getItem(`tutorial_completed_${user.id}`);
    if (!hasCompleted) {
      setRun(true);
    }
  }, [user]);

  const steps = [
    {
      target: 'body',
      content: 'Welcome to Habitropolis! 🏙️ Let me give you the grand tour of your new city.',
      placement: 'center',
    },
    {
      target: '.tour-new-habit',
      content: 'Start here! Create Habits — set Goals, use Timers, or add Bad Habit Stoppers to break the cycle.',
      placement: 'bottom',
    },
    {
      target: '.tour-dashboard-stats',
      content: 'Your Dashboard shows habits completed today, your best streak, and your coin balance. Complete daily bounties from Parth to earn Tiger Tokens! 🐯',
      placement: 'bottom',
    },
    {
      target: '.tour-city-link',
      content: 'Every habit you complete earns you a building! Drag them onto your isometric grid and watch your city grow. Buildings level-up as your streaks get longer!',
      placement: 'right',
    },
    {
      target: '.tour-parth-link',
      content: "Meet Parth — your city mascot! 🐯 Pet him, feed him, wash him, or make him dance. Keep him happy and he'll reward you!",
      placement: 'right',
    },
    {
      target: '.tour-shop-link',
      content: 'Spend coins on Decorations, Streak Shields, or try your luck with the Mystery Chest — 5% chance for a LEGENDARY drop! 🎁',
      placement: 'right',
    },
    {
      target: '.tour-leaderboard-link',
      content: 'Compete with other mayors! Earn Weekly XP and climb through 28 unique Leagues with promotions and demotions each week. 🏅',
      placement: 'right',
    },
    {
      target: '.tour-achievements-link',
      content: 'Unlock Achievements as you hit milestones — completing habits, building your city, and reaching new leagues! 🏆',
      placement: 'right',
    },
    {
      target: '.tour-stats-link',
      content: 'Dive into your Stats to see completion rates, streak histories, and detailed analytics on your progress. 📊',
      placement: 'right',
    },
    {
      target: '.tour-social-link',
      content: 'Visit other mayors\' cities, send them decoration gifts, and see who\'s been checking out your city! 👀',
      placement: 'right',
    },
    {
      target: '.tour-settings-link',
      content: 'Customize your profile, tweak your preferences, and send us feedback from Settings. That\'s the full tour — now go build your Habitropolis! 🚀',
      placement: 'right',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (user) {
         localStorage.setItem(`tutorial_completed_${user.id}`, 'true');
      }
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#6366f1',
          textColor: '#333',
          backgroundColor: '#fff',
        },
      }}
    />
  );
}
