import { useState } from 'react';
import { api } from '../api';

const LANGUAGES = ['Hindi', 'Punjabi', 'Marathi', 'Gujarati', 'Kannada', 'Bengali'];
const CROPS = ['wheat', 'chickpea', 'mustard', 'barley', 'potato', 'lentil', 'safflower', 'cumin'];
const PRODUCTS: Record<string, string> = {
  wheat: 'Tilt 250 EC', mustard: 'Score 250 EC', chickpea: 'Amistar 250 SC',
  potato: 'Kavach 75 WP', barley: 'Axial 50 EC', lentil: 'Alto 5 SC',
  safflower: 'Alto 5 SC', cumin: 'Score 250 EC',
};
const STAGES = ['sowing', 'germination', 'vegetative', 'flowering', 'pod_filling', 'maturity', 'pre_harvest'];

export default function ContentGen() {
  const [form, setForm] = useState({
    language: 'Hindi', crop: 'wheat', product: 'Tilt 250 EC',
    crop_stage: 'flowering', weather_context: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [batchResults, setBatchResults] = useState<any[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true); setResult(null);
    try { setResult(await api.generateContent(form)); }
    catch (e: any) { alert('Error: ' + e.message); }
    setLoading(false);
  };

  const handleGenerateAll = async () => {
    setBatchLoading(true); setBatchResults([]);
    try {
      const results = await Promise.all(
        LANGUAGES.map(lang =>
          api.generateContent({ ...form, language: lang })
            .then((d: any) => ({ ...d, language: lang }))
            .catch(() => ({ language: lang, error: true }))
        )
      );
      setBatchResults(results);
    } catch (e: any) { alert('Error: ' + e.message); }
    setBatchLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">✍️ Vernacular Content Generator</h1>
        <p className="page-subtitle">Gemini 1.5 Flash · 6 Indian languages · Weather-context-aware messaging</p>
      </div>
      <div className="page-body">
        <div className="grid-7-5">
          <div className="card">
            <div className="card-title">Message Configuration</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Farmer Language</label>
                <select className="form-select" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Crop</label>
                <select className="form-select" value={form.crop} onChange={e => {
                  const c = e.target.value;
                  setForm({ ...form, crop: c, product: PRODUCTS[c] || '' });
                }}>
                  {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Product</label>
                <input className="form-input" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Crop Stage</label>
                <select className="form-select" value={form.crop_stage} onChange={e => setForm({ ...form, crop_stage: e.target.value })}>
                  {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Weather Context (optional)</label>
                <input className="form-input" placeholder="e.g. high humidity 85%, fungal risk elevated"
                  value={form.weather_context} onChange={e => setForm({ ...form, weather_context: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                {loading ? <><div className="loading-spinner" /> Generating...</> : '✨ Generate Single Message'}
              </button>
              <button className="btn btn-secondary" onClick={handleGenerateAll} disabled={batchLoading} style={{ flex: 1, justifyContent: 'center' }}>
                {batchLoading ? <><div className="loading-spinner" /> Generating all 6...</> : '🌐 Generate All 6 Languages'}
              </button>
            </div>
          </div>

          <div>
            {result ? (
              <div className="card" style={{ height: '100%' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="whatsapp-lang-badge">{result.language}</div>
                  <span className={result.whatsapp_ready ? 'badge badge-green' : 'badge badge-amber'}>
                    {result.whatsapp_ready ? '✓ WhatsApp Ready' : '⚠ Too Long'}
                  </span>
                </div>
                <div className="whatsapp-message" style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 12 }}>
                  {result.message_native}
                </div>
                <div style={{ background: 'var(--bg-surface)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
                  📝 {result.message_english}
                </div>
                <div className="flex justify-between text-sm">
                  <span>{result.character_count} characters</span>
                  <span>{form.crop} · {form.crop_stage}</span>
                </div>
              </div>
            ) : (
              <div className="card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-dim)', minHeight: 200 }}>
                <span style={{ fontSize: 32 }}>✍️</span>
                <span style={{ fontSize: 13 }}>Configure and generate a message</span>
              </div>
            )}
          </div>
        </div>

        {batchResults.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-title">🌐 All 6 Languages — Same Campaign</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {batchResults.map((msg: any) => (
                <div key={msg.language}>
                  <div className="whatsapp-lang-badge" style={{ marginBottom: 8 }}>{msg.language}</div>
                  {msg.error ? (
                    <div style={{ color: 'var(--red-400)', fontSize: 12 }}>Generation failed</div>
                  ) : (
                    <>
                      <div className="whatsapp-message" style={{ fontSize: 13 }}>{msg.message_native}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, fontStyle: 'italic' }}>{msg.message_english}</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
