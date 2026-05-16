import { useState } from 'react';
import { api } from '../api';
import {
  IconTarget, IconFilter, IconCheck, IconZap,
  IconMessage, IconRefresh, IconSun, IconPlus,
} from '../icons';

const CROPS = ['wheat', 'chickpea', 'mustard', 'barley', 'potato', 'lentil', 'safflower', 'cumin'];
const PRODUCTS: Record<string, string[]> = {
  wheat:     ['Tilt 250 EC', 'Topik 15 WP', 'Axial 50 EC'],
  mustard:   ['Score 250 EC'],
  chickpea:  ['Amistar 250 SC', 'Actara 25 WG'],
  potato:    ['Kavach 75 WP'],
  barley:    ['Axial 50 EC', 'Tilt 250 EC'],
  lentil:    ['Alto 5 SC'],
  safflower: ['Alto 5 SC'],
  cumin:     ['Score 250 EC'],
};

export default function Campaigns() {
  const [form, setForm] = useState({
    campaign_name: '',
    campaign_crop: 'wheat',
    campaign_product: 'Tilt 250 EC',
    min_receptivity_tier: 'medium',
    device_filter: 'smartphone',
    max_targets: 500,
    min_farm_size: 0,
    target_language: '',
    offline_only: false,
  });
  const [creating, setCreating]         = useState(false);
  const [result, setResult]             = useState<any>(null);
  const [targets, setTargets]           = useState<any[]>([]);
  const [messages, setMessages]         = useState<any[]>([]);
  const [generatingContent, setGenContent] = useState(false);
  const [campaigns, setCampaigns]       = useState<any[]>([]);
  const [loadingList, setLoadingList]   = useState(false);
  const [activeTab, setActiveTab]       = useState<'create' | 'list'>('create');

  const loadCampaigns = async () => {
    setLoadingList(true);
    const data = await api.listCampaigns();
    setCampaigns(data.campaigns || []);
    setLoadingList(false);
  };

  const handleCreate = async () => {
    if (!form.campaign_name) return;
    setCreating(true);
    setResult(null); setTargets([]); setMessages([]);
    try {
      const res = await api.createCampaign(form);
      setResult(res);
      const tgts = await api.getCampaignTargets(res.campaign_id);
      setTargets(tgts.targets || []);
    } catch (e: any) { console.error(e); }
    setCreating(false);
  };

  const handleGenerateContent = async () => {
    if (!result) return;
    setGenContent(true);
    try {
      const data = await api.generateCampaignContent(result.campaign_id, 6);
      setMessages(data.messages || []);
    } catch (e: any) { console.error(e); }
    setGenContent(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaign Builder</h1>
          <p className="page-sub">XGBoost receptivity scoring · Gemini vernacular content · 6,000 farmers</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn btn-sm ${activeTab === 'create' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('create')}
          >
            <IconPlus size={13} /> New Campaign
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => { setActiveTab('list'); loadCampaigns(); }}
          >
            <IconFilter size={13} /> All Campaigns
          </button>
        </div>
      </div>

      <div className="page-body">
        {activeTab === 'list' ? (
          <div className="card">
            <div className="card-head">
              <div className="card-label"><IconTarget size={13} /> All Campaigns</div>
              <button className="btn btn-ghost btn-sm" onClick={loadCampaigns}>
                <IconRefresh size={13} /> Refresh
              </button>
            </div>
            {loadingList ? (
              <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
                <div className="spinner" />
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign ID</th>
                    <th>Name</th>
                    <th>Crop / Product</th>
                    <th>Targets</th>
                    <th>Est. Clicks</th>
                    <th>AI Lift</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c: any) => (
                    <tr key={c.id}>
                      <td className="font-mono text-3" style={{ fontSize: 11 }}>{c.id?.slice(0, 22)}&hellip;</td>
                      <td style={{ fontWeight: 550 }}>{c.name}</td>
                      <td>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{c.crop}</div>
                        <div className="text-3" style={{ fontSize: 11 }}>{c.product}</div>
                      </td>
                      <td className="font-mono">{c.total_targets}</td>
                      <td className="text-green font-600">{c.estimated_clicks}</td>
                      <td>
                        <span className={c.lift_factor >= 2 ? 'badge badge-green' : 'badge badge-amber'}>
                          {c.lift_factor}x
                        </span>
                      </td>
                      <td><span className="badge badge-blue">{c.status}</span></td>
                    </tr>
                  ))}
                  {!campaigns.length && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty-state">
                          <IconTarget size={28} />
                          <p>No campaigns yet. Create one above.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="grid-7-5">
            {/* Left — Form + Results */}
            <div className="flex flex-col gap-4">
              <div className="card">
                <div className="card-head">
                  <div className="card-label"><IconFilter size={13} /> Campaign Configuration</div>
                </div>
                <div style={{ padding: 20 }}>
                  <div className="form-group mb-4" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Campaign Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Wheat Fungicide Push — May 2026"
                      value={form.campaign_name}
                      onChange={e => setForm({ ...form, campaign_name: e.target.value })}
                    />
                  </div>

                  <div className="form-row mb-4">
                    <div className="form-group">
                      <label className="form-label">Target Crop</label>
                      <select
                        className="form-select"
                        value={form.campaign_crop}
                        onChange={e => {
                          const crop = e.target.value;
                          setForm({ ...form, campaign_crop: crop, campaign_product: (PRODUCTS[crop] || [])[0] || '' });
                        }}
                      >
                        {CROPS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Product</label>
                      <select
                        className="form-select"
                        value={form.campaign_product}
                        onChange={e => setForm({ ...form, campaign_product: e.target.value })}
                      >
                        {(PRODUCTS[form.campaign_crop] || []).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-row mb-4">
                    <div className="form-group">
                      <label className="form-label">Min Receptivity Tier</label>
                      <select
                        className="form-select"
                        value={form.min_receptivity_tier}
                        onChange={e => setForm({ ...form, min_receptivity_tier: e.target.value })}
                      >
                        <option value="high">High only</option>
                        <option value="medium">Medium + High</option>
                        <option value="low">All tiers</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Device Filter</label>
                      <select
                        className="form-select"
                        value={form.device_filter}
                        onChange={e => setForm({ ...form, device_filter: e.target.value })}
                      >
                        <option value="smartphone">Smartphone (WhatsApp)</option>
                        <option value="keypad">Keypad (SMS/IVR)</option>
                        <option value="all">All devices</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row mb-4">
                    <div className="form-group">
                      <label className="form-label">Min. Farm Size (Acres)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={form.min_farm_size}
                        onChange={e => setForm({ ...form, min_farm_size: parseFloat(e.target.value) })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Language</label>
                      <select
                        className="form-select"
                        value={form.target_language}
                        onChange={e => setForm({ ...form, target_language: e.target.value })}
                      >
                        <option value="">Any Language</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Punjabi">Punjabi</option>
                        <option value="Marathi">Marathi</option>
                        <option value="Gujarati">Gujarati</option>
                        <option value="Kannada">Kannada</option>
                        <option value="Bengali">Bengali</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.offline_only}
                        onChange={e => setForm({ ...form, offline_only: e.target.checked })}
                      />
                      <span className="form-label mb-0">Target non-offline attendees only</span>
                    </label>
                  </div>

                  <div className="form-group mb-4">
                    <label className="form-label">Max Targets</label>
                    <input
                      type="number"
                      className="form-input"
                      value={form.max_targets}
                      min={10} max={6000}
                      onChange={e => setForm({ ...form, max_targets: parseInt(e.target.value) })}
                    />
                  </div>

                  <button
                    className="btn btn-primary w-full"
                    style={{ justifyContent: 'center' }}
                    onClick={handleCreate}
                    disabled={creating || !form.campaign_name}
                  >
                    {creating ? (
                      <><div className="spinner" /> Scoring farmers with XGBoost&hellip;</>
                    ) : (
                      <><IconZap size={14} /> Create Campaign &amp; Score Farmers</>
                    )}
                  </button>
                </div>
              </div>

              {/* Score Result */}
              {result && (
                <div className="card" style={{ borderColor: 'var(--border-med)' }}>
                  <div className="card-head">
                    <div className="card-label">
                      <IconCheck size={13} style={{ color: 'var(--green-hi)' }} />
                      Campaign Scored
                    </div>
                    <span className="font-mono text-3" style={{ fontSize: 10 }}>{result.campaign_id}</span>
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                      {[
                        { label: 'Total Scored',    value: result.total_growers_scored, accent: false },
                        { label: 'High Tier',       value: result.high_tier,            accent: true  },
                        { label: 'Medium Tier',     value: result.medium_tier,          accent: false },
                        { label: 'Est. Clicks',     value: result.estimated_clicks,     accent: true  },
                        { label: 'Baseline Clicks', value: result.baseline_clicks,      accent: false },
                        { label: 'AI Lift',         value: `${result.lift_factor}x`,    accent: true  },
                      ].map(({ label, value, accent }) => (
                        <div key={label} style={{
                          background: 'var(--bg-surface)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          border: '1px solid var(--border)',
                        }}>
                          <div className="text-3" style={{ fontSize: 10.5, marginBottom: 4 }}>{label}</div>
                          <div style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: accent ? 'var(--green-hi)' : 'var(--text-1)',
                            fontVariantNumeric: 'tabular-nums',
                          }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <button
                      className="btn btn-primary w-full"
                      style={{ justifyContent: 'center' }}
                      onClick={handleGenerateContent}
                      disabled={generatingContent}
                    >
                      {generatingContent ? (
                        <><div className="spinner" /> Generating with Gemini&hellip;</>
                      ) : (
                        <><IconMessage size={14} /> Generate Vernacular Messages</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right — Targets + Messages */}
            <div className="flex flex-col gap-4">
              {targets.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div className="card-label"><IconTarget size={13} /> Top Scored Targets</div>
                    <span className="badge badge-muted">{targets.length} farmers</span>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>District</th>
                        <th>Language</th>
                        <th>Score</th>
                        <th>Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {targets.slice(0, 10).map((t: any) => (
                        <tr key={t.grower_id}>
                          <td className="text-3 font-600">{t.rank}</td>
                          <td style={{ fontSize: 12 }}>{t.district}</td>
                          <td><span className="badge badge-blue">{t.language}</span></td>
                          <td className="text-green font-600 font-mono">
                            {(t.receptivity_score * 100).toFixed(1)}%
                          </td>
                          <td>
                            <span className={
                              t.receptivity_tier === 'high'   ? 'tier-high' :
                              t.receptivity_tier === 'medium' ? 'tier-medium' : 'tier-low'
                            }>{t.receptivity_tier}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {messages.length > 0 && (
                <div className="card">
                  <div className="card-head">
                    <div className="card-label"><IconMessage size={13} /> AI-Generated Messages</div>
                    <span className="badge badge-green">{messages.length} languages</span>
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {messages.map((msg: any, i: number) => (
                      <div key={i} className="wa-preview">
                        <div className="flex justify-between items-center mb-2">
                          <div className="wa-lang-tag">
                            <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
                              <circle cx="4.5" cy="4.5" r="4.5"/>
                            </svg>
                            {msg.language}
                          </div>
                          <div className="flex gap-2 items-center">
                            {msg.campaign_timing === 'urgent' && (
                              <span className="badge badge-red">Urgent</span>
                            )}
                            <span className="text-3 font-mono" style={{ fontSize: 10 }}>
                              {msg.character_count} chars
                            </span>
                          </div>
                        </div>
                        <div className="wa-text">{msg.message_native}</div>
                        {msg.message_english && (
                          <div className="wa-translation">{msg.message_english}</div>
                        )}
                        {msg.weather_context && (
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <IconSun size={11} style={{ color: 'var(--amber-hi)' }} />
                            <span className="text-3" style={{ fontSize: 10.5 }}>{msg.weather_context}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!targets.length && !result && (
                <div className="card" style={{ minHeight: 240 }}>
                  <div className="empty-state">
                    <IconTarget size={32} />
                    <p>Configure and create a campaign<br/>to see scored targets here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
