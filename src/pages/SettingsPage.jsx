import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Settings, User, Bell, Palette, LogOut } from 'lucide-react';
import { requestNotificationPermission } from '../lib/notifications';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { coins } = useGame();
  const [notifications, setNotifications] = useState(Notification.permission === 'granted');
  const [message, setMessage] = useState('');

  const handleNotificationToggle = async () => {
    if (!notifications) {
      const granted = await requestNotificationPermission();
      setNotifications(granted);
      setMessage(granted ? 'Notifications enabled! 🔔' : 'Permission denied');
    } else {
      setMessage('To disable notifications, use your browser settings.');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <Settings size={32} className="settings-icon" />
        <h1>Settings</h1>
      </div>

      {message && <div className="settings-toast glass-sm">{message}</div>}

      <div className="settings-section glass">
        <div className="section-header">
          <User size={20} />
          <h3>Profile</h3>
        </div>
        <div className="setting-row">
          <span className="setting-label">Email</span>
          <span className="setting-value">{user?.email}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">Member since</span>
          <span className="setting-value">
            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
          </span>
        </div>
        <div className="setting-row">
          <span className="setting-label">Coins</span>
          <span className="setting-value">🪙 {coins.toLocaleString()}</span>
        </div>
      </div>

      <div className="settings-section glass">
        <div className="section-header">
          <Bell size={20} />
          <h3>Notifications</h3>
        </div>
        <div className="setting-row clickable" onClick={handleNotificationToggle}>
          <span className="setting-label">Push Notifications</span>
          <div className={`toggle ${notifications ? 'active' : ''}`}>
            <div className="toggle-thumb" />
          </div>
        </div>
        <p className="setting-hint">Get reminders for your habits and streak alerts.</p>
      </div>

      <div className="settings-section glass">
        <div className="section-header">
          <Palette size={20} />
          <h3>Appearance</h3>
        </div>
        <div className="setting-row">
          <span className="setting-label">Theme</span>
          <span className="setting-value">Dark (Default)</span>
        </div>
      </div>

      <button className="btn btn-danger logout-settings-btn" onClick={handleSignOut}>
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
}
