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
import RegisterGrower from './pages/RegisterGrower';
import Chatbot from './components/Chatbot';
import {
  IconGrid, IconTarget, IconEdit, IconBarChart,
  IconLeaf, IconDatabase, IconCpu, IconSun, IconPlus,
} from './icons';
import './index.css';

// ─── Types ───────────────────────────────────────────────────────────────────
type Page = 'dashboard' | 'campaigns' | 'content' | 'analytics' | 'weather' | 'growers' | 'models' | 'register_grower';

interface TickerData {
  protected_revenue: string;
  engagement_pulse: string;
  ai_confidence: string;
  weather_threats: string | number;
}

// ─── Nav config ──────────────────────────────────────────────────────────────
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
  { id: 'register_grower', label: 'Register Grower', Icon: IconPlus },
];

// ─── Main Dashboard Layout (only rendered when authenticated) ─────────────────
function DashboardLayout() {
  const [page, setPage] = useState<Page>('dashboard');
  const [isLight, setIsLight] = useState(false);
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sessionCtx = useSessionContext() as any;
  const userEmail = !sessionCtx.loading && sessionCtx.doesSessionExist
    ? sessionCtx.accessTokenPayload?.email ?? ''
    : '';

  // ── Real-time ticker via WebSocket + REST fallback + auto-reconnect ──────
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
      ws.onmessage = (e) => { try { setTicker(JSON.parse(e.data)); } catch {} };
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
    window.location.href = '/syngenta-agri-ai-platform/auth';
  };

  const t = ticker;

  const renderPage = () => {
    switch (page) {
      case 'dashboard':        return <Dashboard />;
      case 'campaigns':        return <Campaigns />;
      case 'content':          return <ContentGen />;
      case 'analytics':        return <Analytics />;
      case 'weather':          return <WeatherLive />;
      case 'growers':          return <GrowerSegments />;
      case 'models':           return <ModelScopes />;
      case 'register_grower':  return <RegisterGrower />;
      default:                 return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-wrap"><IconLeaf size={16} /></div>
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
              <Icon size={15} />{label}
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
              <Icon size={15} />{label}
            </div>
          ))}
        </nav>

        {/* User info + Sign out */}
        <div className="sidebar-status">
          <div className="status-row">
            <div className="status-dot pulse" />MongoDB Atlas
          </div>
          <div className="status-row">
            <div className="status-dot pulse" />SuperTokens Auth
          </div>
          {userEmail && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                Logged in as
              </div>
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

      {/* ── Main Content ──────────────────────────────────────── */}
      <main className="main-content">
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
              <span className={`ticker-value ${Number(t?.weather_threats) > 0 ? 'down' : ''}`}>
                {t ? String(t.weather_threats) : '--'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="theme-toggle" onClick={() => setIsLight(!isLight)}>
              {isLight ? <IconSun size={14} /> : <IconDatabase size={14} />} {isLight ? 'LIGHT' : 'DARK'}
            </div>
            <div className="live-indicator">
              <div className="live-dot" />AI SECURE LINK ACTIVE
            </div>
          </div>
        </header>

        <div key={page} className="page-enter" style={{ height: 'calc(100% - 56px)', overflowY: 'auto' }}>
          {renderPage()}
        </div>
      </main>

      <Chatbot />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
// Architecture (loop-proof):
//   /auth/*   → Public SuperTokens auth pages — NO SessionAuth wrapper
//   /*        → Protected dashboard — wrapped in SessionAuth
//
// With BrowserRouter basename="/syngenta-agri-ai-platform":
//   React Router strips the base, so paths are relative (/auth, /, etc.)
//   SuperTokens websiteBasePath="/auth" matches exactly
//   SessionAuth redirects to /auth (relative), never to /auth/auth/...
export default function App() {
  return (
    <Routes>
      {/* ① Public auth routes — MUST come before the protected /* route.
           SuperTokens generates <Route path="/auth"> and <Route path="/auth/*">
           These are more specific than /* so React Router v6 ranks them higher.
           SessionAuth is intentionally NOT applied here. */}
      {getSuperTokensRoutesForReactRouterDom(reactRouterDom, [EmailPasswordPreBuiltUI])}

      {/* ② Protected dashboard — SessionAuth handles redirect to /auth if no session.
           redirectToPath will be the current path (e.g. "/") NOT "/auth/..." 
           because we're already inside the basename-stripped router context. */}
      <Route
        path="/*"
        element={
          <SessionAuth>
            <DashboardLayout />
          </SessionAuth>
        }
      />
    </Routes>
  );
}
