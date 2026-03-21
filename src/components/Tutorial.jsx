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
      content: 'Welcome to Habitropolis! Let me show you how to build your perfect city.',
      placement: 'center',
    },
    {
      target: '.tour-new-habit',
      content: 'Start by creating a Habit here. You can set Goals, Timers, or even Bad Habit Stoppers!',
      placement: 'bottom',
    },
    {
      target: '.tour-dashboard-stats',
      content: 'Your Dashboard tracks how many habits you complete, your active streaks, and the coins you earn.',
      placement: 'bottom',
    },
    {
      target: '.tour-city-link',
      content: 'As you complete habits, you earn buildings! Click here to visit your City.',
      placement: 'right',
    },
    {
      target: '.town-builder-viewport', // will attach if they happen to navigate there, but standard works on dom presence
      content: 'Here, you can drag your unplaced buildings onto the isometric grid. Buildings grow taller as your streaks get longer!',
      placement: 'center',
    },
    {
      target: '.tour-shop-link',
      content: 'Got coins? Head to the Shop to buy Custom Decorations or Streak Shields to protect you on a bad day.',
      placement: 'right',
    },
    {
      target: '.tour-leaderboard-link',
      content: 'Finally, check out the Leaderboard! Earn Weekly XP to promote through 28 crazy Leagues.',
      placement: 'right',
    }
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
