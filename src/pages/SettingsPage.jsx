import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { Settings, User, Bell, Palette, LogOut } from 'lucide-react';
import { requestNotificationPermission } from '../lib/notifications';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { coins } = useGame();
  const [notifications, setNotifications] = useState(Notification.permission === 'granted');
  const [message, setMessage] = useState('');
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempAvatar, setTempAvatar] = useState('');
  const [tempBio, setTempBio] = useState('');

  const AVATARS = ['🦊', '🤖', '🐶', '🦁', '🐯', '🐼', '🐧', '🦉', '🚀', '⭐', '💎', '🎮'];

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

  const startEditing = () => {
    setTempName(profile?.display_name || user?.email?.split('@')[0] || '');
    setTempAvatar(profile?.avatar_url || '🤖');
    setTempBio(profile?.bio || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        display_name: tempName,
        avatar_url: tempAvatar,
        bio: tempBio,
      });
      setMessage('Profile updated! ✨');
      setIsEditingProfile(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to update profile.');
    }
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
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <h3>Mayor Profile</h3>
            {!isEditingProfile && (
              <button className="btn-secondary btn-sm" onClick={startEditing}>Edit Profile</button>
            )}
          </div>
        </div>
        
        {isEditingProfile ? (
          <div className="profile-edit-form">
            <div className="setting-col">
              <label>Avatar</label>
              <div className="avatar-picker">
                {AVATARS.map(emoji => (
                  <button 
                    key={emoji}
                    className={`avatar-choice ${tempAvatar === emoji || (tempAvatar.length > 5 && emoji === '🤖') ? 'selected' : ''}`}
                    onClick={() => setTempAvatar(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="setting-col">
              <label>Mayor Name</label>
              <input 
                type="text" 
                className="input" 
                value={tempName} 
                onChange={e => setTempName(e.target.value)} 
                maxLength={20}
              />
            </div>
            <div className="setting-col">
              <label>Bio <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>({tempBio.length}/150)</span></label>
              <textarea
                className="input"
                value={tempBio}
                onChange={e => setTempBio(e.target.value)}
                maxLength={150}
                rows={3}
                placeholder="Tell the world about your city..."
                style={{ resize: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div className="profile-edit-actions">
              <button className="btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveProfile} disabled={!tempName.trim()}>Save Changes</button>
            </div>
          </div>
        ) : (
          <>
            <div className="setting-row">
              <span className="setting-label">Mayor Name</span>
              <div className="current-avatar">
                <span className="avatar-emoji">{profile?.avatar_url?.length > 5 ? '👤' : (profile?.avatar_url || '🤖')}</span>
                <span className="setting-value">{profile?.display_name || user?.email}</span>
              </div>
            </div>
            {profile?.bio && (
              <div className="setting-row">
                <span className="setting-label">Bio</span>
                <span className="setting-value" style={{ fontSize: '0.85rem', maxWidth: '250px', textAlign: 'right' }}>{profile.bio}</span>
              </div>
            )}
            <div className="setting-row">
              <span className="setting-label">Account Email</span>
              <span className="setting-value text-muted">{user?.email}</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">Member since</span>
              <span className="setting-value">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
          </>
        )}
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
