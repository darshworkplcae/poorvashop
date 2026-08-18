import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useApp }  from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/',         icon: '📊', label: 'Dashboard',    labelHi: 'डैशबोर्ड' },
  { to: '/billing',  icon: '🧾', label: 'New Bill',     labelHi: 'बिल बनाओ' },
  { to: '/history',  icon: '📋', label: 'Bill History', labelHi: 'पुराने बिल' },
  { to: '/reports',  icon: '📈', label: 'Reports',      labelHi: 'रिपोर्ट' },
];

const mgmtItems = [
  { to: '/products', icon: '🥦', label: 'Products',     labelHi: 'सामान' },
  { to: '/stock',    icon: '🚛', label: 'Farmer Stock', labelHi: 'किसान माल' },
  { to: '/settings', icon: '⚙️', label: 'Settings',    labelHi: 'सेटिंग्स' },
];

function NavItem({ item, onClose }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      onClick={onClose}
    >
      <span className="nav-link-icon">{item.icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
          {item.labelHi}
        </div>
      </div>
    </NavLink>
  );
}

export default function Layout() {
  const { scaleConnected, toasts } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function closeSidebar() { setSidebarOpen(false); }

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="app-shell animated-bg">

      {/* ── Mobile Top Bar ── */}
      <div className="mobile-header">
        <button
          className="mobile-hamburger"
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Open menu"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span className="mobile-logo-text">🌿 POORVA SHOP</span>
        {user && (
          <span style={{ marginLeft:'auto', fontSize:20 }}>{user.avatar}</span>
        )}
      </div>

      {/* ── Sidebar Overlay (mobile tap-to-close) ── */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={closeSidebar}
      />

      {/* ── Sidebar ── */}
      <aside className={`sidebar${sidebarOpen ? ' mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🌿</div>
          <div className="sidebar-logo-text">
            <h2>POORVA SHOP</h2>
            <span>दुकान मैनेजर</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">मुख्य मेनू</div>
          {navItems.map(item => (
            <NavItem key={item.to} item={item} onClose={closeSidebar} />
          ))}

          <div className="nav-section-label" style={{ marginTop: 8 }}>मैनेजमेंट</div>
          {mgmtItems.map(item => (
            <NavItem key={item.to} item={item} onClose={closeSidebar} />
          ))}

          {/* Admin link — only for admins */}
          {user?.role === 'admin' && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>Admin</div>
              <NavItem
                item={{ to: '/admin', icon: '⚙️', label: 'Admin Panel', labelHi: 'एडमिन' }}
                onClose={closeSidebar}
              />
            </>
          )}
        </nav>

        {/* ── Sidebar Footer ── */}
        <div className="sidebar-footer">
          {/* User card */}
          {user && (
            <div className="user-card">
              <div className="user-avatar">{user.avatar}</div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">
                  {user.role === 'admin' ? '👑 Admin' : '👤 Employee'}
                </div>
              </div>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
              >
                🚪
              </button>
            </div>
          )}

          {/* Scale status */}
          <div className="connection-badge">
            <div className={`connection-dot${scaleConnected ? ' connected' : ''}`} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: scaleConnected ? 'var(--green)' : 'var(--red)' }}>
                {scaleConnected ? '⚖️ Scale जुड़ा ✓' : '⚖️ Scale नहीं जुड़ा'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                {scaleConnected ? 'Auto-read ON • COM3' : 'Bridge चलाओ → START.bat'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Toast Notifications ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
