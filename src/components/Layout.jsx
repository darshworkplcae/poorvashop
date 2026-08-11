import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/',          icon: '📊', label: 'Dashboard',   labelHi: 'डैशबोर्ड' },
  { to: '/billing',   icon: '🧾', label: 'New Bill',    labelHi: 'बिल बनाओ' },
  { to: '/history',   icon: '📋', label: 'Bill History',labelHi: 'पुराने बिल' },
  { to: '/reports',   icon: '📈', label: 'Reports',     labelHi: 'रिपोर्ट' },
  { to: '/products',  icon: '🥦', label: 'Products',    labelHi: 'सामान' },
  { to: '/stock',     icon: '🚛', label: 'Farmer Stock',labelHi: 'किसान माल' },
  { to: '/settings',  icon: '⚙️', label: 'Settings',   labelHi: 'सेटिंग्स' },
];

export default function Layout({ children }) {
  const { scaleConnected, toasts } = useApp();
  const location = useLocation();

  return (
    <div className="app-shell animated-bg">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🛒</div>
          <div className="sidebar-logo-text">
            <h2>POORVA SHOP</h2>
            <span>दुकान मैनेजर</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">मुख्य मेनू</div>
          {navItems.slice(0, 4).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-link-icon">{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {item.labelHi}
                </div>
              </div>
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: 8 }}>मैनेजमेंट</div>
          {navItems.slice(4).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-link-icon">{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {item.labelHi}
                </div>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="connection-badge">
            <div className={`connection-dot${scaleConnected ? ' connected' : ''}`} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: scaleConnected ? 'var(--green)' : 'var(--red)' }}>
                {scaleConnected ? 'Scale जुड़ा है ✓' : 'Scale नहीं जुड़ा'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                {scaleConnected ? 'Auto-read ON' : 'Connecting...'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        {children}
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
