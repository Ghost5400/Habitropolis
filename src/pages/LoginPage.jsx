import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTotalUsers } from '../hooks/useTotalUsers';
import { Quote } from 'lucide-react';
import './LoginPage.css';

const MOTIVATIONAL_QUOTES = [
  "A man who fears pain more than failure will taste both.",
  "Your city isn't built in a day, but it is built every day.",
  "Discipline is the bridge between goals and accomplishment.",
  "Success is the sum of small efforts repeated daily.",
  "We are what we repeatedly do. Excellence is not a habit.",
  "First we make our habits, then our habits make us.",
  "The secret of your future is hidden in your daily routine.",
  "Don't stop when you're tired. Stop when you're done."
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();
  const { totalUsers, loading: usersLoading } = useTotalUsers();
  const navigate = useNavigate();

  // Pick a random quote on mount
  const quote = useMemo(() => {
    return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container glass auth-shimmer">
      <div className="auth-box">
        <div className="auth-mascot">
          <img src="/parth-flyingkiss.png" alt="Parth the Tiger" className="mascot-img mascot-enhanced" />
        </div>
        
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p className="text-muted">Return to your Habitropolis</p>
        </div>

        {!usersLoading && totalUsers > 0 && (
          <div className="social-proof-banner">
            <span className="pulse-dot"></span>
            Join <span className="number-highlight">+{totalUsers}</span> mayors already building!
          </div>
        )}

        <div className="auth-quote glass-sm">
          <Quote size={18} className="quote-icon" />
          <p className="quote-text">"{quote}"</p>
        </div>

        <div className="auth-features">
          <span className="feature-pill" style={{ '--delay': '0.1s' }}>🏙️ Build City</span>
          <span className="feature-pill" style={{ '--delay': '0.2s' }}>🐯 Raise Parth</span>
          <span className="feature-pill" style={{ '--delay': '0.3s' }}>⚔️ Leagues</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="text-center mt-6">
          <button
            onClick={handleGoogleSignIn}
            className="btn btn-primary w-full google-btn"
            disabled={loading}
          >
            <div className="google-icon-wrapper">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
            </div>
            {loading ? 'Welcome back...' : 'Continue with Google'}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-muted">
            New to the city?{' '}
            <span className="text-primary-link font-semibold" onClick={() => navigate('/signup')}>
              Start Building
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}