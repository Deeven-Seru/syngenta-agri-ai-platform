import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/maplibre';
import { api } from '../api';
import { 
  IconBarChart, IconMap, IconGlobe,
  IconRefresh
} from '../icons';

// Sophisticated mapping of India districts to coordinates
const DISTRICT_COORDS: Record<string, [number, number]> = {
  'Ambala': [76.7767, 30.3782], 'Karnal': [76.9907, 29.6857], 'Bhatinda': [74.9455, 30.2110],
  'Patiala': [76.3869, 30.3398], 'Ludhiana': [75.8573, 30.9010], 'Nagpur': [79.0882, 21.1458],
  'Pune': [73.8567, 18.5204], 'Nashik': [73.7898, 19.9975], 'Ahmedabad': [72.5714, 23.0225],
  'Rajkot': [70.8022, 22.3039], 'Kurnool': [78.0373, 15.8281], 'Guntur': [80.4365, 16.3067],
  'Indore': [75.8577, 22.7196], 'Bhopal': [77.4126, 23.2599], 'Patna': [85.1376, 25.5941],
  'Meerut': [77.7064, 28.9845], 'Kanpur': [80.3319, 26.4499], 'Jaipur': [75.7873, 26.9124],
};

const INITIAL_VIEW_STATE = {
  longitude: 78.9629,
  latitude: 20.5937,
  zoom: 4,
  pitch: 45,
  bearing: 0
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
  const [mapData, setMapData]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([api.getTopProducts(), api.getDistrictHeatmap(), api.getMapData()])
      .then(([p, d, m]) => {
        setProducts(p.data || []);
        setDistricts(d.districts || []);
        
        // Process data for Deck.gl
        const points = (m.data || []).map((item: any) => {
            const coords = DISTRICT_COORDS[item.district];
            if (!coords) return null;
            // Create multiple points based on 'count' to show density in HexagonLayer
            return {
                COORDINATES: coords,
                weight: item.farm_size,
                district: item.district
            };
        }).filter(Boolean);
        
        setMapData(points);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const weightStats = mapData.reduce(
    (acc, d: any) => {
      const w = Number(d.weight) || 0;
      if (w < acc.min) acc.min = w;
      if (w > acc.max) acc.max = w;
      return acc;
    },
    { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }
  );

  const layers = [
    new HeatmapLayer({
      id: 'heat-intensity',
      data: mapData,
      getPosition: (d: any) => d.COORDINATES,
      getWeight: (d: any) => {
        const w = Number(d.weight) || 0;
        if (weightStats.max === weightStats.min) return w > 0 ? 1 : 0;
        return (w - weightStats.min) / (weightStats.max - weightStats.min);
      },
      radiusPixels: 60,
      intensity: 1.6,
      threshold: 0.05,
      colorRange: [
        [43, 30, 61],
        [84, 39, 136],
        [143, 49, 168],
        [200, 69, 124],
        [242, 109, 74],
        [254, 187, 79]
      ]
    })
  ];

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
              <div className="card-label">
                <IconMap size={13} />
                2D Intensity Heatmap (Deck.gl + Carto)
              </div>
              <div className="badge badge-blue">2D Intensity Live</div>
            </div>
            <div style={{ padding: 0, position: 'relative', height: 400, overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
                <DeckGL
                    initialViewState={INITIAL_VIEW_STATE}
                    controller={true}
                    layers={layers}
                    getTooltip={({ object }) => {
                        if (!object) return null;
                        if (object.position) return 'Intensity heat zone';
                        return 'Intensity heat zone';
                    }}
                >
                    <Map 
                        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                    />
                </DeckGL>
              <div className="map-overlay-legend" style={{ zIndex: 10 }}>
                <div className="text-3 mb-2" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legend</div>
                <div className="flex items-center gap-2 mb-1">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f26d4a' }} />
                  <span style={{ fontSize: 11 }}>Intensity Zone</span>
                </div>
                <div className="text-3 mt-2" style={{ fontSize: 9 }}>Hotter color = higher activity</div>
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
