import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import { api } from '../api';
import {
  IconUsers, IconActivity, IconTarget, IconZap,
  IconBarChart, IconGlobe, IconTrendUp, IconArrowUp,
} from '../icons';

const COLORS = ['#52b788','#40916c','#74c69d','#b7e4c7','#b5833a','#5a9cbd'];

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
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getEngagementByCrop(),
      api.getEngagementByLanguage(),
      api.getFunnel(),
    ]).then(([ov, crop, lang, fn]) => {
      setOverview(ov);
      setByCrop(crop.data || []);
      setByLang(lang.data || []);
      setFunnel(fn.data || []);
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
      Icon: IconUsers,
      value: (overview?.growers?.total || 0).toLocaleString(),
      label: 'Total Farmers',
      sub: `${overview?.growers?.smartphone_pct ?? 0}% on WhatsApp`,
      subClass: '',
    },
    {
      accent: 'amber',
      Icon: IconActivity,
      value: `${overview?.whatsapp?.open_rate ?? 0}%`,
      label: 'WhatsApp Open Rate',
      sub: `${(overview?.whatsapp?.total_messages||0).toLocaleString()} msgs sent`,
      subClass: 'amber',
    },
    {
      accent: 'green',
      Icon: IconTarget,
      value: `${overview?.whatsapp?.click_rate ?? 0}%`,
      label: 'Campaign Click Rate',
      sub: '3x lift with AI targeting',
      subClass: '',
    },
    {
      accent: 'blue',
      Icon: IconZap,
      value: overview?.campaigns?.total ?? 0,
      label: 'AI Campaigns Created',
      sub: 'This session',
      subClass: 'muted',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaign Intelligence</h1>
          <p className="page-sub">Rabi Season 2025–26 · Real-time AI marketing analytics</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="badge badge-green">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green-hi)', display: 'inline-block' }} />
            Live
          </span>
          <span className="badge badge-muted">
            {(overview?.growers?.total || 0).toLocaleString()} Farmers
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
                WhatsApp Engagement by Crop
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
                    <Bar dataKey="open_rate"  name="Open Rate"  fill="#52b788" radius={[3, 3, 0, 0]} maxBarSize={18} />
                    <Bar dataKey="click_rate" name="Click Rate" fill="#b5833a" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-label">
                <IconGlobe size={13} />
                Growers by Language
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
                Open Rate by Language
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
                Digital Campaign Funnel
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
      </div>
    </div>
  );
}
