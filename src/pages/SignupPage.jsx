import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import './LoginPage.css';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signUp(email, password, displayName);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container glass">
        <div className="auth-box" style={{ textAlign: 'center' }}>
          <h2>Check Your Email! 📧</h2>
          <p className="text-muted" style={{ marginTop: '1rem' }}>
            We sent a confirmation link to <strong>{email}</strong>.
            Click it to activate your account.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1.5rem' }}
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container glass">
      <div className="auth-box">
        <h2>Join Habitropolis</h2>
        <p className="text-muted">Create your account and start building!</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="form-label">Display Name</label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="input"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input"
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

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