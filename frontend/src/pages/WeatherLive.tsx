import { useEffect, useState } from 'react';
import { api } from '../api';
import {
  IconCloud, IconAlertTriangle, IconActivity, IconMap,
  IconArrowUp, IconSun, IconRefresh
} from '../icons';

export default function WeatherLive() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.getIndiaSummary()
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !summary) {
    return (
      <div className="loading-page">
        <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />
        <span>Fetching live weather data...</span>
      </div>
    );
  }

  const kpis = [
    {
      accent: 'blue',
      Icon: IconMap,
      value: summary?.total_districts || 0,
      label: 'Total Districts',
      sub: 'Monitored across India',
      subClass: 'muted',
    },
    {
      accent: 'red',
      Icon: IconAlertTriangle,
      value: summary?.urgent_campaign_districts?.length || 0,
      label: 'Urgent Districts',
      sub: 'Immediate action required',
      subClass: 'red',
    },
    {
      accent: 'amber',
      Icon: IconActivity,
      value: summary?.delay_campaign_districts?.length || 0,
      label: 'Delay Districts',
      sub: 'Adverse weather expected',
      subClass: 'amber',
    },
    {
      accent: 'green',
      Icon: IconSun,
      value: (summary?.total_districts || 0) - (summary?.urgent_campaign_districts?.length || 0) - (summary?.delay_campaign_districts?.length || 0),
      label: 'Optimal Districts',
      sub: 'Ideal for application',
      subClass: '',
    },
  ];

  const districts = summary?.districts || {};
  const districtNames = Object.keys(districts).sort();

  const formatTemp = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(1)}°` : 'N/A';

  const formatHumidity = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? `${value}%` : 'N/A';

  return (
    <div className="page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Weather Live</h1>
          <p className="page-sub">Real-time hyper-local weather monitoring & campaign timing</p>
        </div>
        <div className="flex gap-2 items-center">
          <button className="btn btn-ghost btn-sm" onClick={fetchData} disabled={loading}>
            <IconRefresh size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <span className="badge badge-green">
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green-hi)', display: 'inline-block' }} />
            Live
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
                {subClass !== 'muted' && <IconArrowUp size={11} />}
                {sub}
              </div>
            </div>
          ))}
        </div>

        {/* District Details Table */}
        <div className="card">
          <div className="card-head">
            <div className="card-label">
              <IconCloud size={13} />
              District Weather & Risk Analysis
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>District</th>
                <th>Temp (°C)</th>
                <th>Humidity (%)</th>
                <th>Risks</th>
                <th>Campaign Timing</th>
              </tr>
            </thead>
            <tbody>
              {districtNames.map(name => {
                const d = districts[name];
                const timing = d?.campaign_timing ?? (d?.error ? 'unavailable' : 'optimal');
                const timingClass = timing === 'urgent' ? 'badge-red' :
                                   timing === 'delay' ? 'badge-amber' :
                                   timing === 'unavailable' ? 'badge-muted' : 'badge-green';
                const risks = Array.isArray(d?.risks) ? d.risks : [];
                
                return (
                  <tr key={name}>
                    <td style={{ fontWeight: 550 }}>{name}</td>
                    <td className="font-mono text-2">{formatTemp(d?.temperature_c)}</td>
                    <td className="font-mono text-2">{formatHumidity(d?.humidity_pct)}</td>
                    <td>
                      <div className="flex gap-1 flex-wrap">
                        {risks.length > 0 ? risks.map((r: string) => (
                          <span key={r} className="badge badge-muted" style={{ fontSize: '9px' }}>{r}</span>
                        )) : d?.error ? (
                          <span className="text-3" style={{ fontSize: '11px' }}>Weather unavailable</span>
                        ) : <span className="text-3" style={{ fontSize: '11px' }}>No risks</span>}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${timingClass}`} style={{ textTransform: 'capitalize' }}>
                        {timing}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
