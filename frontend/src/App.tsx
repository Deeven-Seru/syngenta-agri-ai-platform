import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import ContentGen from './pages/ContentGen';
import Analytics from './pages/Analytics';
import {
  IconGrid, IconTarget, IconEdit, IconBarChart,
  IconLeaf, IconDatabase, IconCpu, IconSun,
} from './icons';
import './index.css';

type Page = 'dashboard' | 'campaigns' | 'content' | 'analytics';

const NAV: { id: Page; label: string; Icon: React.FC<any> }[] = [
  { id: 'dashboard',  label: 'Overview',           Icon: IconGrid     },
  { id: 'campaigns',  label: 'Campaigns',           Icon: IconTarget   },
  { id: 'content',    label: 'Content Generator',   Icon: IconEdit     },
  { id: 'analytics',  label: 'Analytics',           Icon: IconBarChart },
];

const SYS = [
  { label: 'Weather Live',     Icon: IconSun      },
  { label: 'Grower Segments',  Icon: IconDatabase },
  { label: 'Model Scores',     Icon: IconCpu      },
];

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (isLight) document.documentElement.classList.add('light-theme');
    else document.documentElement.classList.remove('light-theme');
  }, [isLight]);

  return (
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
          {SYS.map(({ label, Icon }) => (
            <div key={label} className="nav-item" style={{ opacity: 0.55, cursor: 'default' }}>
              <Icon size={15} />
              {label}
            </div>
          ))}
        </nav>

        {/* Connection status */}
        <div className="sidebar-status">
          <div className="status-row">
            <div className="status-dot pulse" />
            MongoDB Atlas
          </div>
          <div className="status-row">
            <div className="status-dot" />
            Meteoblue Live
          </div>
          <div className="status-row">
            <div className="status-dot" />
            Gemini 2.5 Flash
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        {/* Executive Global Header */}
        <header className="global-header">
          <div className="global-header-ticker">
            <div className="ticker-item"><span className="ticker-label">PROTECTED REVENUE</span> <span className="ticker-value">--</span></div>
            <div className="ticker-item"><span className="ticker-label">ENGAGEMENT PULSE</span> <span className="ticker-value">--</span></div>
            <div className="ticker-item"><span className="ticker-label">AI CONFIDENCE</span> <span className="ticker-value">--</span></div>
            <div className="ticker-item"><span className="ticker-label">WEATHER THREATS</span> <span className="ticker-value">--</span></div>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button className="theme-toggle" onClick={() => setIsLight(!isLight)} aria-label="Toggle theme">
              {isLight ? <IconSun size={14} /> : <IconDatabase size={14} />} {isLight ? 'LIGHT' : 'DARK'}
            </button>
            <div className="live-indicator">
              <div className="live-dot" />
              AI SECURE LINK ACTIVE
            </div>
          </div>
        </header>

        <div key={page} className="page-enter" style={{ height: 'calc(100% - 56px)', overflowY: 'auto' }}>
          {page === 'dashboard'  && <Dashboard />}
          {page === 'campaigns'  && <Campaigns />}
          {page === 'content'    && <ContentGen />}
          {page === 'analytics'  && <Analytics />}
        </div>
      </main>
    </div>
  );
}
