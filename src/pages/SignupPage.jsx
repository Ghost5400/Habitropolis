import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTotalUsers } from '../hooks/useTotalUsers';
import './LoginPage.css';

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();
  const { totalUsers, loading: usersLoading } = useTotalUsers();
  const navigate = useNavigate();

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Google Signup failed');
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
        <h2>Join Habitropolis</h2>
        <p className="text-muted">Create your account and start building!</p>

        {!usersLoading && totalUsers > 0 && (
          <div className="social-proof-banner">
            <span className="pulse-dot"></span>
            Join <span className="number-highlight">+{totalUsers}</span> mayors already building their cities!
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="text-center mt-4">
          <button
            onClick={handleGoogleSignUp}
            className="btn btn-primary w-full"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '3.5rem', fontSize: '1.1rem' }}
            disabled={loading}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '24px', height: '24px', background: 'white', borderRadius: '50%', padding: '2px' }} />
            {loading ? 'Creating account...' : 'Sign Up with Google'}
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-muted">
            Already have an account?{' '}
            <span className="text-primary cursor-pointer" onClick={() => navigate('/login')}>
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}