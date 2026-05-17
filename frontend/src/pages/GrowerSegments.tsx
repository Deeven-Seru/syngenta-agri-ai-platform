import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { api } from '../api';
import {
  IconUsers, IconLayers, IconBarChart, IconGlobe,
  IconTarget, IconZap, IconTrendUp, IconArrowUp,
} from '../icons';

const COLORS = ['#52b788', '#40916c', '#74c69d', '#b7e4c7', '#b5833a', '#5a9cbd', '#2d6a4f', '#081c15'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <div className="custom-tooltip-label">{label || payload[0].name}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="custom-tooltip-row">
          <div className="custom-tooltip-dot" style={{ background: p.color || p.fill }} />
          <span style={{ color: 'var(--text-2)' }}>{p.name}</span>
          <span style={{ color: p.color || p.fill, marginLeft: 'auto', paddingLeft: 12 }}>
            {p.value.toLocaleString()}{p.name?.toLowerCase().includes('rate') ? '%' : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function GrowerSegments() {
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getGrowerSegments()
      .then(res => {
        setSegments(res.segments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span>Analyzing grower demographics...</span>
      </div>
    );
  }

  // Data processing for charts
  const cropData = Object.values(segments.reduce((acc: any, curr) => {
    if (!acc[curr.crop]) acc[curr.crop] = { name: curr.crop, value: 0 };
    acc[curr.crop].value += curr.count;
    return acc;
  }, {})).sort((a: any, b: any) => b.value - a.value);

  const langData = Object.values(segments.reduce((acc: any, curr) => {
    if (!acc[curr.language]) acc[curr.language] = { name: curr.language, value: 0 };
    acc[curr.language].value += curr.count;
    return acc;
  }, {})).sort((a: any, b: any) => b.value - a.value);

  const totalGrowers = segments.reduce((sum, s) => sum + s.count, 0);
  const avgScanRate = segments.reduce((sum, s) => sum + (s.product_scan_rate * s.count), 0) / totalGrowers;
  const avgFarmSize = segments.reduce((sum, s) => sum + (s.avg_farm_size * s.count), 0) / totalGrowers;

  const kpis = [
    {
      accent: 'green',
      Icon: IconUsers,
      value: totalGrowers.toLocaleString(),
      label: 'Total Segmented',
      sub: 'Across all regions',
    },
    {
      accent: 'amber',
      Icon: IconTarget,
      value: `${avgScanRate.toFixed(1)}%`,
      label: 'Avg Scan Rate',
      sub: 'Product engagement',
    },
    {
      accent: 'blue',
      Icon: IconLayers,
      value: segments.length,
      label: 'Micro-segments',
      sub: 'AI-identified cohorts',
    },
    {
      accent: 'green',
      Icon: IconTrendUp,
      value: `${avgFarmSize.toFixed(1)} ac`,
      label: 'Avg Farm Size',
      sub: 'Per grower segment',
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Grower Segments</h1>
          <p className="page-sub">Advanced audience segmentation and targeting</p>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-blue">
            <IconZap size={12} /> AI-Powered
          </span>
          <span className="badge badge-muted">
            {segments.length} Segments
          </span>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Row */}
        <div className="kpi-grid mb-6">
          {kpis.map(({ accent, Icon, value, label, sub }) => (
            <div key={label} className="kpi-card">
              <div className={`kpi-card-accent ${accent}`} />
              <div className={`kpi-icon ${accent}`}>
                <Icon size={16} />
              </div>
              <div className="kpi-value">{value}</div>
              <div className="kpi-label">{label}</div>
              <div className="kpi-sub">
                <IconArrowUp size={11} />
                {sub}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid-7-5 mb-6">
          <div className="card">
            <div className="card-head">
              <div className="card-label">
                <IconBarChart size={13} />
                Grower Distribution by Crop
              </div>
            </div>
            <div style={{ padding: '24px 20px 16px' }}>
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cropData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fontSize: 12, fill: 'var(--text-2)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                    <Bar dataKey="value" name="Growers" fill="var(--accent-hi)" radius={[0, 4, 4, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-label">
                <IconGlobe size={13} />
                Language Breakdown
              </div>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={langData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {langData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                {langData.slice(0, 5).map((entry: any, index) => (
                  <div key={entry.name} className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                      <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{entry.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>
                      {((entry.value / totalGrowers) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="card">
          <div className="card-head">
            <div className="card-label">
              <IconLayers size={13} />
              Detailed Segment Performance
            </div>
            <span className="badge badge-muted">Top 50 Segments</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Language</th>
                  <th>Device</th>
                  <th>Count</th>
                  <th>Avg Farm Size</th>
                  <th>Scan Rate</th>
                  <th>Offline Rate</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s, i) => (
                  <tr key={i}>
                    <td className="font-600">{s.crop}</td>
                    <td>{s.language}</td>
                    <td>
                      <span className={`badge ${s.device === 'Smartphone' ? 'badge-blue' : 'badge-muted'}`}>
                        {s.device}
                      </span>
                    </td>
                    <td className="font-mono">{s.count.toLocaleString()}</td>
                    <td>{s.avg_farm_size} ac</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={s.product_scan_rate > 15 ? 'text-green font-600' : 'text-amber font-600'}>
                          {s.product_scan_rate}%
                        </span>
                        <div className="prog-bar" style={{ width: 60 }}>
                          <div className="prog-fill" style={{ width: `${s.product_scan_rate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-3">{s.offline_rate}%</span>
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
