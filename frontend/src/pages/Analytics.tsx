import { useEffect, useState, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import L from 'leaflet';
import { api } from '../api';
import { 
  IconBarChart, IconMap, IconGlobe, IconTarget,
  IconArrowUp, IconFilter, IconRefresh
} from '../icons';

// Sophisticated mapping of India districts to coordinates for the demo
const DISTRICT_COORDS: Record<string, [number, number]> = {
  'Ambala': [30.3782, 76.7767], 'Karnal': [29.6857, 76.9907], 'Bhatinda': [30.2110, 74.9455],
  'Patiala': [30.3398, 76.3869], 'Ludhiana': [30.9010, 75.8573], 'Nagpur': [21.1458, 79.0882],
  'Pune': [18.5204, 73.8567], 'Nashik': [19.9975, 73.7898], 'Ahmedabad': [23.0225, 72.5714],
  'Rajkot': [22.3039, 70.8022], 'Kurnool': [15.8281, 78.0373], 'Guntur': [16.3067, 80.4365],
  'Indore': [22.7196, 75.8577], 'Bhopal': [23.2599, 77.4126], 'Patna': [25.5941, 85.1376],
  'Meerut': [28.9845, 77.7064], 'Kanpur': [26.4499, 80.3319], 'Jaipur': [26.9124, 75.7873],
};

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
  const mapRef = useRef<L.Map | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.getTopProducts(), api.getDistrictHeatmap()])
      .then(([p, d]) => {
        setProducts(p.data || []);
        setDistricts(d.districts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || !districts.length || !mapContainer.current) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainer.current, {
        center: [22.9734, 78.6569], // Central India
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Dark Matter tiles - Sleek, monochromatic, sophisticated
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
    }

    // Add markers for districts
    districts.forEach(d => {
      const coords = DISTRICT_COORDS[d.district];
      if (coords && mapRef.current) {
        const radius = Math.sqrt(d.grower_count) * 2;
        L.circleMarker(coords, {
          radius: radius,
          fillColor: 'var(--green-hi)',
          fillOpacity: 0.5,
          color: 'var(--green-hi)',
          weight: 1,
        }).addTo(mapRef.current)
          .bindPopup(`
            <div class="map-popup">
              <strong>${d.district}</strong><br/>
              ${d.grower_count} Growers<br/>
              ${d.smartphone_pct}% SmartPhones
            </div>
          `);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading, districts]);

  if (loading) return (
    <div className="loading-page">
      <div className="spinner" />
      <span>Loading geospatial intelligence</span>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Market Intelligence</h1>
          <p className="page-sub">Geospatial distribution · POS snapshots · AI Engagement Heatmap</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>
          <IconRefresh size={13} /> Refresh Data
        </button>
      </div>

      <div className="page-body">
        <div className="grid-7-5 mb-6">
          <div className="card">
            <div className="card-head">
              <div className="card-label"><IconMap size={13} /> Geospatial Penetration Heatmap</div>
              <div className="badge badge-green">Live from MongoDB</div>
            </div>
            <div style={{ padding: 0, position: 'relative' }}>
              <div ref={mapContainer} style={{ height: 400, width: '100%', borderRadius: '0 0 12px 12px' }} />
              <div className="map-overlay-legend">
                <div className="text-3 mb-2" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legend</div>
                <div className="flex items-center gap-2 mb-1">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-hi)' }} />
                  <span style={{ fontSize: 11 }}>Active Target Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(45, 106, 79, 0.2)', border: '1px solid var(--green-hi)' }} />
                  <span style={{ fontSize: 11 }}>Emerging Market</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-label"><IconBarChart size={13} /> Sales by SKU</div>
            </div>
            <div style={{ padding: '24px 20px 16px' }}>
              <div style={{ height: 324 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={products} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="product" tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                    <YAxis 
                      tickFormatter={(v: number) => `₹${(v / 1e7).toFixed(0)}Cr`} 
                      tick={{ fontSize: 10, fill: 'var(--text-3)' }} 
                      axisLine={false} tickLine={false} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-hover)' }} />
                    <Bar dataKey="total_revenue" name="Revenue" fill="var(--accent-hi)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-label">
              <IconGlobe size={13} />
              Regional Market Coverage
            </div>
            <span className="badge badge-muted">District Ranking</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>District</th>
                <th>State</th>
                <th>Growers</th>
                <th>Smartphone %</th>
                <th>Market Share</th>
                <th>Engagement</th>
              </tr>
            </thead>
            <tbody>
              {districts.slice(0, 15).map((d: any, i: number) => (
                <tr key={i}>
                  <td className="font-600">{d.district}</td>
                  <td className="text-3" style={{ fontSize: 12 }}>{d.state}</td>
                  <td className="font-mono">{d.grower_count.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={d.smartphone_pct > 70 ? 'text-green font-600' : 'text-amber font-600'}>
                        {d.smartphone_pct}%
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="prog-bar" style={{ width: 100 }}>
                        <div className="prog-fill" style={{ width: `${Math.min((d.grower_count / 100) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={i < 5 ? 'badge badge-green' : 'badge badge-blue'}>
                      {i < 5 ? 'High' : 'Stable'}
                    </span>
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
