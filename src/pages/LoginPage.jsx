import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTotalUsers } from '../hooks/useTotalUsers';
import './LoginPage.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();
  const { totalUsers, loading: usersLoading } = useTotalUsers();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // AuthContext handles the redirect if needed, or navigate dynamically
    } catch (err) {
      setError(err.message || 'Google Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container glass">
      <div className="auth-box">
        <div className="auth-mascot">
          <img src="/parth-flyingkiss.png" alt="Parth the Tiger" className="mascot-img" />
        </div>
        <h2>Welcome Back</h2>
        <p className="text-muted">Sign in to your Habitropolis</p>

        {!usersLoading && totalUsers > 0 && (
          <div className="social-proof-banner">
            <span className="pulse-dot"></span>
            Join <span className="number-highlight">+{totalUsers}</span> mayors already building their cities!
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="text-center mt-4">
          <button
            onClick={handleGoogleSignIn}
            className="btn btn-primary w-full"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.5rem', fontSize: '1.1rem' }}
            disabled={loading}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '24px', height: '24px', background: 'white', borderRadius: '50%', padding: '2px' }} />
            {loading ? 'Signing in...' : 'Sign In with Google'}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-muted">
            Don't have an account?{' '}
            <span className="text-primary cursor-pointer" onClick={() => navigate('/signup')}>
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}