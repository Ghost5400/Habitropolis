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
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await signUp(email, password, displayName);
      
      if (signUpError) throw signUpError;

      // If email confirmation is disabled, user is auto-logged in → go to dashboard
      if (data?.user?.identities?.length > 0) {
        navigate('/dashboard');
      } else if (data?.user && !data.session) {
        // Email confirmation is enabled — show message
        setError('Check your email for a confirmation link, then log in!');
      } else {
        // Auto logged in
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.message || 'Signup failed';
      if (msg.includes('rate limit') || msg.includes('email')) {
        setError('Too many signups right now. Please wait a minute and try again.');
      } else if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('This email is already registered. Try logging in instead!');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

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