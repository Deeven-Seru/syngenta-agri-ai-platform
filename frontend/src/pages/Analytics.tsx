import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../api';

export default function Analytics() {
  const [products, setProducts] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80%', gap: 12 }}>
      <div className="loading-spinner" />
      <span className="text-muted">Loading analytics...</span>
    </div>
  );

  const T = ({ active, payload, label }: any) => active && payload?.length ? (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>₹{(p.value / 1e7).toFixed(1)} Cr</p>)}
    </div>
  ) : null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📈 Sales & Inventory Analytics</h1>
        <p className="page-subtitle">235,042 POS transactions · 310,544 inventory snapshots · Rabi 2025–26</p>
      </div>
      <div className="page-body">
        <div className="card mb-6">
          <div className="card-title">💰 Top Products by Revenue (POS Data)</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={products} margin={{ top: 4, right: 8, left: 20, bottom: 4 }}>
                <XAxis dataKey="product" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tickFormatter={(v: number) => `₹${(v / 1e7).toFixed(0)}Cr`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip content={<T />} />
                <Bar dataKey="total_revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-title">🗺️ Grower Density by District</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>District</th>
                <th>State</th>
                <th>Growers</th>
                <th>Smartphone %</th>
                <th>Top Crops</th>
                <th>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {districts.slice(0, 20).map((d: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{d.district}</td>
                  <td className="text-sm">{d.state}</td>
                  <td>{d.grower_count}</td>
                  <td>
                    <span className={d.smartphone_pct > 70 ? 'text-green' : 'text-amber'} style={{ fontWeight: 600 }}>
                      {d.smartphone_pct}%
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(d.crops || []).slice(0, 2).join(', ')}</td>
                  <td>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${Math.min((d.grower_count / 50) * 100, 100)}%` }} />
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
