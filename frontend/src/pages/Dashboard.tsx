import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../api';
import {
  IconActivity, IconTarget, IconZap,
  IconBarChart, IconGlobe, IconTrendUp, IconArrowUp, IconUsers,
  IconX, IconCheck, IconCpu, IconRefresh, IconMessage,
} from '../icons';

const COLORS = ['var(--green)','var(--blue)','var(--amber)','var(--green-hi)','var(--teal)','var(--red)'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="custom-tooltip-row">
          <div className="custom-tooltip-dot" style={{ background: p.color }} />
          <span style={{ color: 'var(--text-2)' }}>{p.name}</span>
          <span style={{ color: p.color, marginLeft: 'auto', paddingLeft: 12 }}>
            {p.value}{p.name?.toLowerCase().includes('rate') ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [byCrop, setByCrop]     = useState<any[]>([]);
  const [byLang, setByLang]     = useState<any[]>([]);
  const [funnel, setFunnel]     = useState<any[]>([]);
  const [growers, setGrowers]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  const [selectedGrower, setSelectedGrower] = useState<any>(null);
  const [searchPhone, setSearchPhone] = useState('');
  const [filterCrop, setFilterCrop] = useState('');
  const [filterState, setFilterState] = useState('');
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagData, setDiagData] = useState<Record<string, any>>({});

  const runDiagScan = (phone: string) => {
    setDiagLoading(true);
    setTimeout(() => {
      const mockSoilTemp = (22 + Math.random() * 8).toFixed(1);
      const mockSoilMoisture = Math.floor(35 + Math.random() * 25);
      const npkRatio = `${Math.floor(10 + Math.random() * 5)}-${Math.floor(12 + Math.random() * 4)}-${Math.floor(8 + Math.random() * 6)}`;
      const forecastVal = (0.85 + Math.random() * 0.15).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 1 });
      const anomalies = ['None', 'Nitrogen Deficiency', 'High Salinity Detected', 'None', 'None'];
      const mockAnomaly = anomalies[Math.floor(Math.random() * anomalies.length)];

      setDiagData(prev => ({
        ...prev,
        [phone]: {
          temp: mockSoilTemp,
          moisture: mockSoilMoisture,
          npk: npkRatio,
          forecast: forecastVal,
          anomaly: mockAnomaly
        }
      }));
      setDiagLoading(false);
    }, 1200);
  };

  const filteredGrowers = growers.filter(g => {
    const phoneMatch = (g.phone || g.grower_id || '').toLowerCase().includes(searchPhone.toLowerCase());
    const cropMatch = filterCrop ? (g.primary_crop || '').toLowerCase() === filterCrop.toLowerCase() : true;
    const stateMatch = filterState ? (g.state || '').toLowerCase() === filterState.toLowerCase() : true;
    return phoneMatch && cropMatch && stateMatch;
  });

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getEngagementByCrop(),
      api.getEngagementByLanguage(),
      api.getFunnel(),
      api.getGrowers({ limit: '100' }),
    ]).then(([ov, crop, lang, fn, gr]) => {
      setOverview(ov);
      setByCrop(crop.data || []);
      setByLang(lang.data || []);
      setFunnel(fn.data || []);
      setGrowers(gr.growers || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
        <span>Loading from MongoDB Atlas</span>
      </div>
    );
  }

  const kpis = [
    {
      accent: 'green',
      Icon: IconTrendUp,
      value: (overview?.growers?.total || 0).toLocaleString(),
      label: 'Revenue Protected',
      sub: `Based on active growers`,
      subClass: '',
    },
    {
      accent: 'blue',
      Icon: IconActivity,
      value: `${overview?.whatsapp?.open_rate ?? 0}%`,
      label: 'Engagement Velocity',
      sub: `${(overview?.whatsapp?.total_messages||0).toLocaleString()} interactions/hr`,
      subClass: 'blue',
    },
    {
      accent: 'green',
      Icon: IconTarget,
      value: `${overview?.whatsapp?.click_rate ?? 0}%`,
      label: 'AI Confidence Index',
      sub: 'Model certainty nominal',
      subClass: '',
    },
    {
      accent: 'amber',
      Icon: IconZap,
      value: overview?.campaigns?.total ?? 0,
      label: 'Active Strategic Operations',
      sub: 'Resource allocation optimal',
      subClass: 'amber',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Command Center</h1>
          <p className="page-sub">Rabi Season 2025–26 · Strategic Intelligence & Revenue Protection</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="badge badge-green" style={{ border: '1px solid var(--accent-hi)', boxShadow: '0 0 10px var(--accent-dim)' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green-hi)', display: 'inline-block' }} />
            AI Operations Live
          </span>
          <span className="badge badge-blue">
            Threat Level: Low
          </span>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Row */}
        <div className="kpi-grid mb-6">
          {kpis.map(({ accent, Icon, value, label, sub, subClass }) => (
            <div key={label} className="kpi-card">
              <div className={`kpi-card-accent ${accent}`} />
              <div className={`kpi-icon ${accent}`}>
                <Icon size={16} />
              </div>
              <div className="kpi-value">{value}</div>
              <div className="kpi-label">{label}</div>
              <div className={`kpi-sub ${subClass}`}>
                <IconArrowUp size={11} />
                {sub}
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="grid-7-5 mb-4">
          <div className="card">
            <div className="card-head">
              <div className="card-label">
                <IconBarChart size={13} />
                Engagement Velocity by Sector
              </div>
            </div>
            <div style={{ padding: '16px 16px 12px' }}>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCrop} margin={{ top: 4, right: 4, left: -22, bottom: 4 }} barGap={3}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="crop" tick={{ fontSize: 10.5, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10.5, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="open_rate"  name="Open Rate"  fill="var(--green)" radius={[3, 3, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="click_rate" name="Click Rate" fill="var(--blue)" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-label">
                <IconGlobe size={13} />
                Geospatial Density Matrix
              </div>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {(overview?.language_breakdown || []).map((row: any, i: number) => {
                const max = Math.max(...(overview?.language_breakdown || []).map((r: any) => r.count));
                return (
                  <div key={row.language} style={{ marginBottom: 12 }}>
                    <div className="flex justify-between items-center mb-2">
                      <span style={{ fontSize: 12.5, color: 'var(--text-1)', fontWeight: 500 }}>{row.language}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                        {row.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="prog-bar">
                      <div
                        className="prog-fill"
                        style={{
                          width: `${(row.count / max) * 100}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid-2">
          <div className="card">
            <div className="card-head">
              <div className="card-label">
                <IconTrendUp size={13} />
                AI Confidence & Localization Heatline
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Language</th>
                  <th>Messages</th>
                  <th>Open Rate</th>
                  <th>Click Rate</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {byLang.map((row: any) => (
                  <tr key={row.language}>
                    <td style={{ fontWeight: 550 }}>{row.language}</td>
                    <td className="text-3">{row.total}</td>
                    <td>
                      <span className="text-green font-600">{row.open_rate}%</span>
                    </td>
                    <td className="text-2">{row.click_rate}%</td>
                    <td>
                      <div className="prog-bar" style={{ width: 72 }}>
                        <div className="prog-fill" style={{ width: `${Math.min((row.click_rate / 10) * 100, 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-label">
                <IconActivity size={13} />
                Strategic Resource Optimization Funnel
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Impressions</th>
                  <th>CTR</th>
                  <th>Lead CVR</th>
                </tr>
              </thead>
              <tbody>
                {funnel.slice(0, 8).map((row: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 550, fontSize: 12 }}>{row.crop}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{row.product}</div>
                    </td>
                    <td className="font-mono text-3" style={{ fontSize: 12 }}>{(row.impressions||0).toLocaleString()}</td>
                    <td><span className="text-green font-600">{row.ctr}%</span></td>
                    <td>
                      <span className={row.lead_cvr > 7 ? 'badge badge-green' : 'badge badge-amber'}>
                        {row.lead_cvr}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row 4: Registered Growers Directory */}
        <div className="card" style={{ marginTop: 24 }}>
          <div className="card-head">
            <div className="card-label">
              <IconUsers size={13} style={{ color: 'var(--teal)' }} />
              Active Registered Growers Directory
            </div>
            <span className="badge badge-muted">
              {filteredGrowers.length !== growers.length
                ? `${filteredGrowers.length} of ${growers.length} matching`
                : `${growers.length} active profiles`
              }
            </span>
          </div>

          {/* Search and Filters Bar */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', background: 'rgba(0,0,0,0.1)' }}>
            <style>{`
              .clickable-row {
                cursor: pointer;
              }
              .clickable-row:hover td {
                background: var(--bg-hover) !important;
              }
            `}</style>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Search Phone / ID</span>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 12px', fontSize: 12, height: 32, borderColor: 'var(--border)' }}
                placeholder="Type phone or ID..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
            </div>
            <div style={{ width: 140, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Filter Crop</span>
              <select
                className="form-select"
                style={{ padding: '0 10px', fontSize: 12, height: 32, borderColor: 'var(--border)', background: 'var(--bg-base)' }}
                value={filterCrop}
                onChange={(e) => setFilterCrop(e.target.value)}
              >
                <option value="">All Crops</option>
                {Array.from(new Set(growers.map(g => g.primary_crop).filter(Boolean))).map(crop => (
                  <option key={crop} value={crop}>{crop.charAt(0).toUpperCase() + crop.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={{ width: 140, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Filter State</span>
              <select
                className="form-select"
                style={{ padding: '0 10px', fontSize: 12, height: 32, borderColor: 'var(--border)', background: 'var(--bg-base)' }}
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
              >
                <option value="">All States</option>
                {Array.from(new Set(growers.map(g => g.state).filter(Boolean))).map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            {(searchPhone || filterCrop || filterState) && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ height: 32, padding: '0 12px', display: 'flex', alignItems: 'center' }}
                onClick={() => { setSearchPhone(''); setFilterCrop(''); setFilterState(''); }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Phone / Identifier</th>
                  <th>Crop Context</th>
                  <th>Vegetative Stage</th>
                  <th>Location</th>
                  <th>Tehsil</th>
                  <th>Language</th>
                  <th>Device</th>
                  <th>Offline Campaign</th>
                  <th>Scanned Product</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrowers.map((g: any) => (
                  <tr key={g.grower_id || g.phone} onClick={() => setSelectedGrower(g)} className="clickable-row">
                    <td style={{ fontWeight: 600, color: 'var(--text-1)' }} className="font-mono">
                      {g.phone || g.grower_id}
                    </td>
                    <td style={{ fontWeight: 550, textTransform: 'capitalize' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green-hi)' }} />
                        {g.primary_crop || 'Wheat'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>
                        {g.crop_calendar?.current_stage || g.current_stage || 'sowing'}
                      </span>
                    </td>
                    <td>
                      {g.district}, {g.state}
                    </td>
                    <td className="text-3">{g.tehsil || '-'}</td>
                    <td>
                      <span className="badge badge-muted">{g.language}</span>
                    </td>
                    <td className="text-3" style={{ textTransform: 'capitalize' }}>
                      {g.device_type}
                    </td>
                    <td>
                      {g.offline_campaign_attended ? (
                        <span className="badge badge-green">Attended</span>
                      ) : (
                        <span className="badge badge-muted" style={{ opacity: 0.6 }}>No</span>
                      )}
                    </td>
                    <td>
                      {g.product_name ? (
                        <span className="badge badge-amber">{g.product_name}</span>
                      ) : (
                        <span className="text-3">-</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ padding: '4px 8px', fontSize: 11, color: 'var(--accent-hi)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGrower(g);
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {!filteredGrowers.length && (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state" style={{ minHeight: 120 }}>
                        <IconUsers size={24} style={{ opacity: 0.5 }} />
                        <p>No active registered growers found matching criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Selected Grower Dossier Drawer */}
      {selectedGrower && (
        <>
          {/* Drawer Backdrop Overlay */}
          <div
            onClick={() => setSelectedGrower(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* Drawer Panel */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 460,
              background: 'var(--bg-panel)',
              borderLeft: '1px solid var(--border-med)',
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.7)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              animation: 'drawer-slide-in 0.3s cubic-bezier(0.25, 0, 0, 1) both',
            }}
          >
            <style>{`
              @keyframes drawer-slide-in {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid var(--border);
              }
              .detail-label {
                color: var(--text-3);
                font-weight: 500;
              }
              .detail-val {
                color: var(--text-1);
                font-weight: 600;
              }
              .timeline-step {
                display: flex;
                gap: 12px;
                position: relative;
                padding-bottom: 16px;
              }
              .timeline-step::before {
                content: '';
                position: absolute;
                left: 7px;
                top: 16px;
                bottom: 0;
                width: 2px;
                background: var(--border);
              }
              .timeline-step:last-child::before {
                display: none;
              }
              .timeline-dot {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--bg-surface);
                border: 2px solid var(--border-med);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1;
              }
              .timeline-dot.active {
                border-color: var(--accent);
                background: var(--accent-dim);
                box-shadow: 0 0 8px var(--accent);
              }
              .timeline-dot.completed {
                border-color: var(--teal);
                background: var(--teal);
              }
            `}</style>

            {/* Drawer Header */}
            <div
              className="card-head"
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-med)',
                background: 'rgba(0, 255, 102, 0.02)',
              }}
            >
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)' }} />
                  Grower Profile Dossier
                </h2>
                <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Tactical Data Sheet & RAG Grounding Context</p>
              </div>
              <button
                onClick={() => setSelectedGrower(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  padding: 6,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: '50%',
                  transition: 'background var(--t-fast)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <IconX size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
              }}
            >
              {/* Profile Card Summary */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(6,9,7,0.8), rgba(10,15,12,0.8))',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'rgba(0, 255, 102, 0.08)',
                  border: '1px solid var(--accent)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--accent-hi)',
                  boxShadow: '0 0 15px rgba(0, 255, 102, 0.15)',
                }}>
                  {selectedGrower.primary_crop ? selectedGrower.primary_crop[0].toUpperCase() : 'G'}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
                    +{selectedGrower.phone}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
                      {selectedGrower.primary_crop || 'Wheat'}
                    </span>
                    <span className="badge badge-blue">
                      {selectedGrower.crop_calendar?.current_stage || selectedGrower.current_stage || 'Sowing'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Demographics */}
              <div>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                  Demographics & Localization
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="detail-row">
                    <span className="detail-label">State</span>
                    <span className="detail-val">{selectedGrower.state}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">District</span>
                    <span className="detail-val">{selectedGrower.district}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Tehsil / Taluka</span>
                    <span className="detail-val">{selectedGrower.tehsil || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Preferred Language</span>
                    <span className="detail-val">{selectedGrower.language}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age / Gender</span>
                    <span className="detail-val">
                      {selectedGrower.grower_age ? `${selectedGrower.grower_age} yrs` : 'N/A'} · <span style={{ textTransform: 'capitalize' }}>{selectedGrower.gender || 'male'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Context and Tech */}
              <div>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                  Agricultural Context & Tech
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="detail-row">
                    <span className="detail-label">Farm Size</span>
                    <span className="detail-val">{selectedGrower.farm_size_acres ? `${selectedGrower.farm_size_acres} Acres` : 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Device Type</span>
                    <span className="detail-val" style={{ textTransform: 'capitalize' }}>{selectedGrower.device_type}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Offline Campaign</span>
                    <span className="detail-val">
                      {selectedGrower.offline_campaign_attended ? (
                        <span className="badge badge-green">Attended ({selectedGrower.campaign_attendance_date || 'Recent'})</span>
                      ) : (
                        <span className="badge badge-muted">Not Attended</span>
                      )}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Scanned Product</span>
                    <span className="detail-val">
                      {selectedGrower.product_name ? (
                        <span className="badge badge-amber">{selectedGrower.product_name}</span>
                      ) : (
                        <span className="text-3">No scans recorded</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline stages */}
              <div>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                  Crop Calendar & Lifecycle Stages
                </h3>
                <div style={{ paddingLeft: 4 }}>
                  {(() => {
                    const allStages = ['sowing', 'vegetative', 'flowering', 'maturity', 'harvesting'];
                    const currentStage = (selectedGrower.crop_calendar?.current_stage || selectedGrower.current_stage || 'sowing').toLowerCase();
                    const currentIndex = allStages.indexOf(currentStage);

                    return allStages.map((stage, idx) => {
                      const isCompleted = idx < currentIndex;
                      const isActive = idx === currentIndex;

                      return (
                        <div className="timeline-step" key={stage}>
                          <div className={`timeline-dot ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}>
                            {isCompleted && <IconCheck size={10} style={{ color: '#000' }} />}
                          </div>
                          <div style={{ marginTop: -1 }}>
                            <div style={{
                              fontSize: 12.5,
                              fontWeight: isActive ? 600 : 500,
                              color: isActive ? 'var(--accent-hi)' : isCompleted ? 'var(--text-2)' : 'var(--text-4)',
                              textTransform: 'capitalize',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}>
                              {stage}
                              {isActive && <span className="badge badge-green" style={{ fontSize: 9, padding: '0px 6px' }}>Active</span>}
                            </div>
                            <div style={{ fontSize: 10.5, color: isActive ? 'var(--text-2)' : 'var(--text-3)', marginTop: 2 }}>
                              {isActive
                                ? 'Current stage for crop cultivation. Diagnostics customized for this phase.'
                                : isCompleted
                                  ? 'Stage successfully monitored and completed.'
                                  : 'Upcoming stage in growth timeline.'
                              }
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* IoT Telemetry Simulation */}
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                padding: 16,
                background: 'rgba(0, 229, 255, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal-hi)', textTransform: 'uppercase', letterSpacing: 0.8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <IconCpu size={12} />
                    Simulated IoT Telemetry
                  </span>
                  <button
                    onClick={() => runDiagScan(selectedGrower.phone)}
                    disabled={diagLoading}
                    className="btn btn-ghost btn-sm"
                    style={{
                      fontSize: 10.5,
                      padding: '4px 8px',
                      borderColor: 'rgba(0, 229, 255, 0.2)',
                      color: 'var(--teal-hi)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginLeft: 'auto'
                    }}
                  >
                    <IconRefresh size={10} className={diagLoading ? 'spin' : ''} />
                    {diagData[selectedGrower.phone] ? 'Recalibrate' : 'Run Diagnostics'}
                  </button>
                </div>

                <style>{`
                  .spin {
                    animation: spin-anim 1s linear infinite;
                  }
                  @keyframes spin-anim {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                  .telemetry-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11.5px;
                    color: var(--text-2);
                  }
                  .telemetry-val {
                    font-family: var(--font-mono);
                    font-weight: 550;
                  }
                `}</style>

                {diagLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', justifyContent: 'center' }}>
                    <div className="spinner" style={{ borderColor: 'var(--border-med)', borderTopColor: 'var(--teal)', width: 14, height: 14 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Connecting to field sensors...</span>
                  </div>
                ) : diagData[selectedGrower.phone] ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                    <div className="telemetry-item">
                      <span>Soil Moisture</span>
                      <span className="telemetry-val" style={{ color: 'var(--teal-hi)' }}>{diagData[selectedGrower.phone].moisture}%</span>
                    </div>
                    <div className="telemetry-item">
                      <span>NPK Ratio (Nitrogen-Phosphorus-Potassium)</span>
                      <span className="telemetry-val" style={{ color: 'var(--text-1)' }}>{diagData[selectedGrower.phone].npk}</span>
                    </div>
                    <div className="telemetry-item">
                      <span>Soil Temperature</span>
                      <span className="telemetry-val" style={{ color: 'var(--text-1)' }}>{diagData[selectedGrower.phone].temp}°C</span>
                    </div>
                    <div className="telemetry-item">
                      <span>Yield Forecast Index</span>
                      <span className="telemetry-val" style={{ color: 'var(--green-hi)' }}>{diagData[selectedGrower.phone].forecast}</span>
                    </div>
                    <div className="telemetry-item" style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
                      <span>Anomaly Detection</span>
                      <span className={`badge ${diagData[selectedGrower.phone].anomaly === 'None' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 9 }}>
                        {diagData[selectedGrower.phone].anomaly}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0', border: '1px dashed var(--border)', borderRadius: 4 }}>
                    No telemetry scan cached. Trigger diagnostic above to ping IoT nodes.
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer actions */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-med)',
                background: 'var(--bg-panel)',
                display: 'flex',
                gap: 12,
              }}
            >
              <button
                onClick={() => {
                  const event = new CustomEvent('open-chatbot', { detail: { phone: selectedGrower.phone || selectedGrower.grower_id } });
                  window.dispatchEvent(event);
                  setSelectedGrower(null);
                }}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: 'rgba(0, 229, 255, 0.1)',
                  color: 'var(--teal-hi)',
                  boxShadow: 'inset 0 0 0 1px var(--teal-hi)',
                  textShadow: '0 0 5px var(--teal-hi)',
                }}
              >
                <IconMessage size={14} />
                Open Chatbot
              </button>

              <button
                onClick={() => setSelectedGrower(null)}
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
