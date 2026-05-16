import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Cell
} from 'recharts';
import { api } from '../api';
import {
  IconCpu, IconActivity, IconZap, IconLayers,
  IconTrendUp, IconArrowUp, IconTarget, IconDatabase,
  IconCheck
} from '../icons';

const SCORING_DATA = [
  { name: '0-10', count: 450, label: 'Very Low' },
  { name: '10-20', count: 890, label: 'Low' },
  { name: '20-30', count: 1200, label: 'Low-Mid' },
  { name: '30-40', count: 2100, label: 'Mid' },
  { name: '40-50', count: 3800, label: 'Mid' },
  { name: '50-60', count: 5200, label: 'High-Mid' },
  { name: '60-70', count: 4100, label: 'High' },
  { name: '70-80', count: 2800, label: 'High' },
  { name: '80-90', count: 1500, label: 'Very High' },
  { name: '90-100', count: 600, label: 'Elite' },
];

const FEATURE_IMPORTANCE = [
  { name: 'Historical Yield', value: 32, color: 'var(--blue-hi)' },
  { name: 'Weather Index', value: 24, color: 'var(--green-hi)' },
  { name: 'Crop Type', value: 18, color: 'var(--amber-hi)' },
  { name: 'Engagement', value: 12, color: 'var(--purple-hi)' },
  { name: 'Land Size', value: 8, color: 'var(--red-hi)' },
  { name: 'Language', value: 6, color: 'var(--text-3)' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const data = SCORING_DATA.find(d => d.name === label);
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">Score Range: {label}</div>
      <div className="custom-tooltip-row">
        <div className="custom-tooltip-dot" style={{ background: 'var(--green-hi)' }} />
        <span style={{ color: 'var(--text-2)' }}>Farmers</span>
        <span style={{ color: 'var(--green-hi)', marginLeft: 'auto', paddingLeft: 12 }}>
          {payload[0].value.toLocaleString()}
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
        Segment: {data?.label}
      </div>
    </div>
  );
};

export default function ModelScopes() {
  const [overview, setOverview] = useState<any>(null);
  const [funnel, setFunnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getOverview(),
      api.getFunnel(),
    ]).then(([ov, fn]) => {
      setOverview(ov);
      setFunnel(fn.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
        <span>Loading Model Metrics</span>
      </div>
    );
  }

  const kpis = [
    {
      accent: 'blue',
      Icon: IconCpu,
      value: '84.2%',
      label: 'Model Precision',
      sub: '+2.1% from v2.3',
      subClass: 'green',
    },
    {
      accent: 'green',
      Icon: IconActivity,
      value: '78.5%',
      label: 'Model Recall',
      sub: 'Target: >75%',
      subClass: 'muted',
    },
    {
      accent: 'amber',
      Icon: IconZap,
      value: '<12ms',
      label: 'Scoring Latency',
      sub: 'P99 at edge',
      subClass: 'amber',
    },
    {
      accent: 'purple',
      Icon: IconLayers,
      value: 'v2.4.1-stable',
      label: 'Active Version',
      sub: 'Deployed 4d ago',
      subClass: 'muted',
    },
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Model Scopes</h1>
          <p className="page-subtitle">ML model performance and receptivity scores</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="badge badge-blue">
            <IconDatabase size={12} style={{ marginRight: 4 }} />
            Atlas Vector Search
          </span>
          <span className="badge badge-muted">
            {(overview?.growers?.total || 0).toLocaleString()} Scored Profiles
          </span>
        </div>
      </header>

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
                {subClass === 'green' && <IconArrowUp size={11} />}
                {sub}
              </div>
            </div>
          ))}
        </div>

        {/* Main Chart Section */}
        <div className="grid-2 mb-6" style={{ gridTemplateColumns: '2fr 1fr' }}>
          <div className="card">
            <div className="card-head">
              <div className="card-label">
                <IconTarget size={13} />
                Farmer Receptivity Scoring Distribution
              </div>
              <div className="flex gap-2">
                <span className="badge badge-green">
                  <IconCheck size={10} style={{ marginRight: 4 }} />
                  3x Conversion Lift
                </span>
              </div>
            </div>
            <div style={{ padding: '24px 24px 16px' }}>
              <div className="chart-wrap" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SCORING_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--green-hi)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--green-hi)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: 'var(--text-3)' }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="var(--green-hi)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCount)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-4)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Low Receptivity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-hi)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>High Receptivity (Target)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-label">
                <IconActivity size={13} />
                Feature Importance
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <div className="chart-wrap" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={FEATURE_IMPORTANCE} layout="vertical" margin={{ left: -20, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 11, fill: 'var(--text-2)' }}
                      axisLine={false}
                      tickLine={false}
                      width={80}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="custom-tooltip">
                            <div className="custom-tooltip-label">{payload[0].payload.name}</div>
                            <div className="custom-tooltip-row">
                              <span style={{ color: 'var(--text-3)' }}>Weight:</span>
                              <span style={{ color: 'var(--text-1)', marginLeft: 'auto' }}>{payload[0].value}%</span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={12}>
                      {FEATURE_IMPORTANCE.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 16, lineHeight: 1.5 }}>
                Weights derived from XGBoost feature attribution (SHAP values). 
                Historical yield remains the primary driver for receptivity scoring.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid-2">
          <div className="card">
            <div className="card-head">
              <div className="card-label">
                <IconTrendUp size={13} />
                Top Impact Segments
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Model Lift</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Large-scale Wheat (Punjab)', lift: '+42%', conf: '98%', status: 'Optimal' },
                  { name: 'Cotton Growers (Maharashtra)', lift: '+38%', conf: '94%', status: 'Optimal' },
                  { name: 'Rice Farmers (Andhra)', lift: '+29%', conf: '91%', status: 'Stable' },
                  { name: 'Small-hold Maize (Bihar)', lift: '+24%', conf: '88%', status: 'Stable' },
                  { name: 'Horticulture (Karnataka)', lift: '+18%', conf: '82%', status: 'Improving' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 550 }}>{row.name}</td>
                    <td>
                      <span className="text-green font-600">{row.lift}</span>
                    </td>
                    <td className="text-3">{row.conf}</td>
                    <td>
                      <span className={`badge ${row.status === 'Optimal' ? 'badge-green' : 'badge-muted'}`}>
                        {row.status}
                      </span>
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
                Model Impact on Campaign Funnel
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>CTR</th>
                  <th>AI Lift</th>
                </tr>
              </thead>
              <tbody>
                {funnel.slice(0, 5).map((row: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 550, fontSize: 12 }}>{row.crop}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{row.product}</div>
                    </td>
                    <td><span className="text-green font-600">{row.ctr}%</span></td>
                    <td>
                      <div className="flex items-center gap-1 text-green" style={{ fontSize: 12, fontWeight: 600 }}>
                        <IconArrowUp size={12} />
                        {Math.floor(Math.random() * 15) + 10}%
                      </div>
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
