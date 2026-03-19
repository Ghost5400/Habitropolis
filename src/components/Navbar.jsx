import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGame } from '../contexts/GameContext';
import { LayoutDashboard, Target, Building2, ShoppingBag, Trophy, BarChart3, Settings, LogOut, Coins, Volume2, VolumeX, Music } from 'lucide-react';
import soundManager from '../lib/SoundManager';
import './Navbar.css';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { coins } = useGame();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [isAmbientOn, setIsAmbientOn] = useState(soundManager.isAmbientPlaying);

  const handleSignOut = async () => {
    soundManager.stopAmbient();
    await signOut();
    navigate('/login');
  };

  const handleNavClick = () => {
    soundManager.playNav();
  };

  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleAmbient = () => {
    if (isAmbientOn) {
      soundManager.stopAmbient();
      setIsAmbientOn(false);
    } else {
      soundManager.startAmbient();
      setIsAmbientOn(true);
    }
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/habits', icon: Target, label: 'Habits' },
    { to: '/city', icon: Building2, label: 'City' },
    { to: '/shop', icon: ShoppingBag, label: 'Shop' },
    { to: '/achievements', icon: Trophy, label: 'Achievements' },
    { to: '/stats', icon: BarChart3, label: 'Stats' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="navbar glass">
      <div className="navbar-brand">
        <Building2 size={28} className="brand-icon" />
        <span className="brand-text">Habitropolis</span>
      </div>

      <div className="navbar-links">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={handleNavClick}
          >
            <Icon size={20} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </div>

      <div className="navbar-footer">
        <div className="coin-display">
          <Coins size={18} className="coin-icon" />
          <span className="coin-count">{coins.toLocaleString()}</span>
        </div>

        {/* Sound controls */}
        <div className="sound-controls">
          <button
            className={`sound-btn ${isAmbientOn ? 'active' : ''}`}
            onClick={handleToggleAmbient}
            title={isAmbientOn ? 'Stop ambient music' : 'Play ambient music'}
          >
            <Music size={18} />
          </button>
          <button
            className={`sound-btn ${isMuted ? 'muted' : ''}`}
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="user-email">{user?.email?.split('@')[0]}</span>
        </div>

        <button className="nav-link logout-btn" onClick={handleSignOut}>
          <LogOut size={20} />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </nav>
  );
}