import { useState, useRef, useEffect } from 'react';
import { login } from '../lib/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const userRef = useRef(null);

  useEffect(() => { userRef.current?.focus(); }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username || !password) { setError('Username और Password डालो'); return; }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      refreshUser();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Animated background blobs */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />
      <div className="login-blob login-blob-3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">🌿</div>
          <div>
            <div className="login-shop-name">POORVA SHOP</div>
            <div className="login-shop-sub">दुकान मैनेजर</div>
          </div>
        </div>

        <div className="login-divider" />

        <h2 className="login-title">Welcome Back 👋</h2>
        <p className="login-subtitle">अपने account में login करें</p>

        <form onSubmit={handleLogin} className="login-form">
          {/* Username */}
          <div className="login-field">
            <label className="login-label">Username</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">👤</span>
              <input
                ref={userRef}
                type="text"
                className="login-input"
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-input-wrap">
              <span className="login-input-icon">🔒</span>
              <input
                type={showPass ? 'text' : 'password'}
                className="login-input"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="login-error">
              ❌ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <><div className="spinner" style={{ width:18, height:18 }} />&nbsp;Logging in...</>
            ) : (
              '🚀 Login करो'
            )}
          </button>
        </form>

        {/* Demo credentials */}
        <div className="login-demo">
          <div className="login-demo-title">🧪 Demo Credentials (पहले login के लिए)</div>
          <div className="login-demo-row"><span>Username</span><span>admin</span></div>
          <div className="login-demo-row"><span>Password</span><span>Admin@123</span></div>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:6 }}>
            ⚠️ Login के बाद Admin Panel से password बदलें
          </div>
        </div>

        <div className="login-footer">
          <span>🔐</span>
          <span>Only authorized staff can access this system</span>
        </div>
      </div>
    </div>
  );
}
