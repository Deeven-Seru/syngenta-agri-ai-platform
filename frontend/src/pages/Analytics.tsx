import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { api } from '../api';
import { 
  IconBarChart, IconMap, IconGlobe, IconTarget,
  IconArrowUp,
} from '../icons';

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
            ₹{(p.value / 1e7).toFixed(1)} Cr
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [products, setProducts]   = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([api.getTopProducts(), api.getDistrictHeatmap()])
      .then(([p, d]) => {
        setProducts(p.data || []);
        setDistricts(d.districts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span>Loading warehouse analytics</span>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Market Intelligence</h1>
          <p className="page-sub">POS transactions · Inventory snapshots · Rabi 2025–26</p>
        </div>
      </div>

      <div className="page-body">
        <div className="card mb-6">
          <div className="card-head">
            <div className="card-label">
              <IconBarChart size={13} />
              Top Products by Revenue (POS Data)
            </div>
          </div>
          <div style={{ padding: '24px 20px 16px' }}>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={products} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="product" tick={{ fontSize: 10.5, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tickFormatter={(v: number) => `₹${(v / 1e7).toFixed(0)}Cr`} 
                    tick={{ fontSize: 10.5, fill: 'var(--text-3)' }} 
                    axisLine={false} tickLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                  <Bar dataKey="total_revenue" name="Revenue" fill="var(--accent-hi)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-label">
              <IconMap size={13} />
              Regional Market Coverage
            </div>
            <span className="badge badge-muted">Top 20 Districts</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>District</th>
                <th>State</th>
                <th>Growers</th>
                <th>Smartphone Coverage</th>
                <th>Primary Crops</th>
                <th>Platform Penetration</th>
              </tr>
            </thead>
            <tbody>
              {districts.slice(0, 20).map((d: any, i: number) => (
                <tr key={i}>
                  <td className="font-600">{d.district}</td>
                  <td className="text-3 text-sm">{d.state}</td>
                  <td className="font-mono">{d.grower_count.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={d.smartphone_pct > 70 ? 'text-green font-600' : 'text-amber font-600'}>
                        {d.smartphone_pct}%
                      </span>
                      {d.smartphone_pct > 80 && <IconGlobe size={11} className="text-green" />}
                    </div>
                  </td>
                  <td className="text-3" style={{ fontSize: 11 }}>{(d.crops || []).slice(0, 2).join(', ')}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="prog-bar" style={{ width: 80 }}>
                        <div className="prog-fill" style={{ width: `${Math.min((d.grower_count / 50) * 100, 100)}%` }} />
                      </div>
                      <span className="text-3 font-mono" style={{ fontSize: 10 }}>
                        {Math.min((d.grower_count / 50) * 100, 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
