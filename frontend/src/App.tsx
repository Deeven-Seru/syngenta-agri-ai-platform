import { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import * as reactRouterDom from 'react-router-dom';
import { SessionAuth } from 'supertokens-auth-react/recipe/session';
import { getSuperTokensRoutesForReactRouterDom } from 'supertokens-auth-react/ui';
import { EmailPasswordPreBuiltUI } from 'supertokens-auth-react/recipe/emailpassword/prebuiltui';
import { signOut } from 'supertokens-auth-react/recipe/emailpassword';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';

import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import ContentGen from './pages/ContentGen';
import Analytics from './pages/Analytics';
import WeatherLive from './pages/WeatherLive';
import GrowerSegments from './pages/GrowerSegments';
import ModelScopes from './pages/ModelScopes';
import {
  IconGrid, IconTarget, IconEdit, IconBarChart,
  IconLeaf, IconDatabase, IconCpu, IconSun,
} from './icons';
import './index.css';

type Page = 'dashboard' | 'campaigns' | 'content' | 'analytics' | 'weather' | 'growers' | 'models';

interface TickerData {
  protected_revenue: string;
  engagement_pulse: string;
  ai_confidence: string;
  weather_threats: string | number;
}

const NAV: { id: Page; label: string; Icon: React.FC<any> }[] = [
  { id: 'dashboard', label: 'Overview',         Icon: IconGrid     },
  { id: 'campaigns', label: 'Campaigns',         Icon: IconTarget   },
  { id: 'content',   label: 'Content Generator', Icon: IconEdit     },
  { id: 'analytics', label: 'Analytics',         Icon: IconBarChart },
];

const SYS: { id: Page; label: string; Icon: React.FC<any> }[] = [
  { id: 'weather',  label: 'Weather Live',    Icon: IconSun      },
  { id: 'growers',  label: 'Grower Segments', Icon: IconDatabase },
  { id: 'models',   label: 'Model Scores',    Icon: IconCpu      },
];

function AppInner() {
  const [page, setPage] = useState<Page>('dashboard');
  const [isLight, setIsLight] = useState(false);
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const session = useSessionContext();
  const userEmail = !session.loading && session.doesSessionExist
    ? (session as any).accessTokenPayload?.email ?? 'User'
    : '';

  // Real-time ticker via WebSocket + REST fallback + auto-reconnect
  useEffect(() => {
    let ws: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout>;

    fetch('http://localhost:8080/api/ticker')
      .then(r => r.json())
      .then(setTicker)
      .catch(() => {});

    const connect = () => {
      ws = new WebSocket('ws://localhost:8080/api/ws/ticker');
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try { setTicker(JSON.parse(e.data)); } catch {}
      };
      ws.onclose = () => { retryTimer = setTimeout(connect, 5000); };
      ws.onerror = () => ws?.close();
    };

    connect();
    return () => { ws?.close(); clearTimeout(retryTimer); };
  }, []);

  useEffect(() => {
    if (isLight) document.documentElement.classList.add('light-theme');
    else document.documentElement.classList.remove('light-theme');
  }, [isLight]);

  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  const t = ticker;

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <Dashboard />;
      case 'campaigns':  return <Campaigns />;
      case 'content':    return <ContentGen />;
      case 'analytics':  return <Analytics />;
      case 'weather':    return <WeatherLive />;
      case 'growers':    return <GrowerSegments />;
      case 'models':     return <ModelScopes />;
      default:           return <Dashboard />;
    }
  };

  return (
    <Routes>
      {/* SuperTokens Pre-built UI routes (/auth, /auth/reset-password) */}
      {getSuperTokensRoutesForReactRouterDom(reactRouterDom, [EmailPasswordPreBuiltUI])}

      {/* Protected App Routes */}
      <Route path="/*" element={
        <SessionAuth>
          <div className="app-layout">
            {/* ── Sidebar ── */}
            <aside className="sidebar">
              <div className="sidebar-brand">
                <div className="brand-icon-wrap">
                  <IconLeaf size={16} />
                </div>
                <div>
                  <div className="brand-name">Agri-AI</div>
                  <div className="brand-sub">Syngenta India</div>
                </div>
              </div>

              <nav className="sidebar-nav">
                <div className="nav-group-label">Platform</div>
                {NAV.map(({ id, label, Icon }) => (
                  <div
                    key={id}
                    className={`nav-item ${page === id ? 'active' : ''}`}
                    onClick={() => setPage(id)}
                  >
                    <Icon size={15} />
                    {label}
                  </div>
                ))}

                <div className="nav-divider" />
                <div className="nav-group-label">System</div>
                {SYS.map(({ id, label, Icon }) => (
                  <div
                    key={id}
                    className={`nav-item ${page === id ? 'active' : ''}`}
                    onClick={() => setPage(id)}
                  >
                    <Icon size={15} />
                    {label}
                  </div>
                ))}
              </nav>

              {/* User info + Sign out */}
              <div className="sidebar-status">
                <div className="status-row">
                  <div className="status-dot pulse" />
                  MongoDB Atlas
                </div>
                <div className="status-row">
                  <div className="status-dot pulse" />
                  SuperTokens Auth
                </div>
                {userEmail && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Logged in as</div>
                    <div style={{ fontSize: 11, color: 'var(--text-2)', wordBreak: 'break-all' }}>{userEmail}</div>
                    <div
                      onClick={handleSignOut}
                      style={{ marginTop: 8, fontSize: 11, color: 'var(--red-hi)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                    >
                      Sign Out
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* ── Main ── */}
            <main className="main-content">
              {/* Executive Global Header */}
              <header className="global-header">
                <div className="global-header-ticker">
                  <div className="ticker-item">
                    <span className="ticker-label">PROTECTED REVENUE</span>{' '}
                    <span className={`ticker-value ${t ? 'up' : ''}`}>{t?.protected_revenue ?? '--'}</span>
                  </div>
                  <div className="ticker-item">
                    <span className="ticker-label">ENGAGEMENT PULSE</span>{' '}
                    <span className="ticker-value glow">{t?.engagement_pulse ?? '--'}</span>
                  </div>
                  <div className="ticker-item">
                    <span className="ticker-label">AI CONFIDENCE</span>{' '}
                    <span className={`ticker-value ${t ? 'up' : ''}`}>{t?.ai_confidence ?? '--'}</span>
                  </div>
                  <div className="ticker-item">
                    <span className="ticker-label">WEATHER THREATS</span>{' '}
                    <span className={`ticker-value ${Number(t?.weather_threats) > 0 ? 'down' : ''}`}>{t ? String(t.weather_threats) : '--'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div className="theme-toggle" onClick={() => setIsLight(!isLight)}>
                    {isLight ? <IconSun size={14} /> : <IconDatabase size={14} />} {isLight ? 'LIGHT' : 'DARK'}
                  </div>
                  <div className="live-indicator">
                    <div className="live-dot" />
                    AI SECURE LINK ACTIVE
                  </div>
                </div>
              </header>

              <div key={page} className="page-enter" style={{ height: 'calc(100% - 56px)', overflowY: 'auto' }}>
                {renderPage()}
              </div>
            </main>
          </div>
        </SessionAuth>
      } />
    </Routes>
  );
}

export default function App() {
  return <AppInner />;
}
