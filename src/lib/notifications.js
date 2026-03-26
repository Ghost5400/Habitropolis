export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const sendNotification = (title, options = {}) => {
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(title, {
    icon: '/logo.png',
    badge: '/logo.png',
    ...options,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return notification;
};

export const scheduleHabitReminders = (habits) => {
  if (Notification.permission !== 'granted') return;

  // Clear existing timers
  if (window._habitReminderTimers) {
    window._habitReminderTimers.forEach(id => clearTimeout(id));
  }
  window._habitReminderTimers = [];

  // Schedule evening reminder at 8 PM if habits are incomplete
  const now = new Date();
  const evening = new Date(now);
  evening.setHours(20, 0, 0, 0);

  if (evening > now) {
    const delay = evening.getTime() - now.getTime();
    const timerId = setTimeout(() => {
      const incompleteCount = habits.length; // You'd check todayLogs for actual incomplete count
      if (incompleteCount > 0) {
        sendNotification('⏰ Habit Reminder', {
          body: `You have ${incompleteCount} habit${incompleteCount > 1 ? 's' : ''} left to complete today!`,
          tag: 'habit-reminder',
        });
      }
    }, delay);
    window._habitReminderTimers.push(timerId);
  }

  // Mid-day check at 2 PM
  const midday = new Date(now);
  midday.setHours(14, 0, 0, 0);

  if (midday > now) {
    const delay = midday.getTime() - now.getTime();
    const timerId = setTimeout(() => {
      sendNotification('🎯 Midday Check-in', {
        body: 'How are your habits going today? Keep that streak alive!',
        tag: 'midday-checkin',
      });
    }, delay);
    window._habitReminderTimers.push(timerId);
  }
};

export const notifyStreakAtRisk = (habitName, currentStreak) => {
  sendNotification('⚠️ Streak At Risk!', {
    body: `Your ${currentStreak}-day streak for "${habitName}" is about to break! Complete it now or use a shield.`,
    tag: `streak-risk-${habitName}`,
    requireInteraction: true,
  });
};

export const notifyAchievementUnlocked = (achievementName, coins) => {
  sendNotification('🏆 Achievement Unlocked!', {
    body: `${achievementName} — You earned ${coins} coins!`,
    tag: `achievement-${achievementName}`,
  });
};

// Unregister service worker for future web push support in dev mode to avoid cache issues
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    if (import.meta.env.DEV) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let r of registrations) {
        await r.unregister();
      }
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration.scope);
      return registration;
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  }
};
