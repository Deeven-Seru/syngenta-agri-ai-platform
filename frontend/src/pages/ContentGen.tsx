import { useState } from 'react';
import { api } from '../api';
import {
  IconEdit, IconGlobe, IconCheck, IconX,
  IconSun, IconLeaf, IconRefresh, IconMessage,
} from '../icons';

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
    catch (e: any) { console.error(e); }
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
    } catch (e: any) { console.error(e); }
    setBatchLoading(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vernacular Content</h1>
          <p className="page-sub">Gemini 1.5 Flash · 6 Indian languages · Context-aware engine</p>
        </div>
      </div>

      <div className="page-body">
        <div className="grid-7-5 mb-6">
          <div className="card">
            <div className="card-head">
              <div className="card-label"><IconEdit size={13} /> Message Configuration</div>
            </div>
            <div style={{ padding: 20 }}>
              <div className="form-row mb-4">
                <div className="form-group">
                  <label className="form-label">Primary Language</label>
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
              </div>

              <div className="form-row mb-4">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input className="form-input" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Crop Stage</label>
                  <select className="form-select" value={form.crop_stage} onChange={e => setForm({ ...form, crop_stage: e.target.value })}>
                    {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label">Weather Context & Conditions</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="e.g. high humidity 85%, fungal risk elevated, forecasted rain in 48h"
                  value={form.weather_context} 
                  onChange={e => setForm({ ...form, weather_context: e.target.value })} 
                />
              </div>

              <div className="flex gap-3">
                <button className="btn btn-primary" onClick={handleGenerate} disabled={loading} style={{ flex: 1, justifyContent: 'center' }}>
                  {loading ? <><div className="spinner" /> Generating&hellip;</> : <><IconMessage size={14} /> Generate Single</>}
                </button>
                <button className="btn btn-ghost" onClick={handleGenerateAll} disabled={batchLoading} style={{ flex: 1, justifyContent: 'center' }}>
                  {batchLoading ? <><div className="spinner" /> Generating&hellip;</> : <><IconGlobe size={14} /> Batch All Languages</>}
                </button>
              </div>
            </div>
          </div>

          <div>
            {result ? (
              <div className="card" style={{ height: '100%' }}>
                <div className="card-head">
                  <div className="wa-lang-tag" style={{ marginBottom: 0 }}>
                    <IconLeaf size={11} /> {result.language}
                  </div>
                  <span className={result.whatsapp_ready ? 'badge badge-green' : 'badge badge-amber'}>
                    {result.whatsapp_ready ? 'WhatsApp Optimized' : 'Review Length'}
                  </span>
                </div>
                <div style={{ padding: 20 }}>
                  <div className="wa-preview mb-4">
                    <div className="wa-text" style={{ fontSize: 15 }}>{result.message_native}</div>
                    {result.message_english && (
                      <div className="wa-translation">{result.message_english}</div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center text-3" style={{ fontSize: 11 }}>
                    <div className="flex items-center gap-2">
                      <IconSun size={12} />
                      {form.crop} &middot; {form.crop_stage}
                    </div>
                    <div className="font-mono">{result.character_count} characters</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ height: '100%', minHeight: 280 }}>
                <div className="empty-state">
                  <IconEdit size={32} />
                  <p>Configure and generate to preview<br/>personalized vernacular messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {batchResults.length > 0 && (
          <div className="card">
            <div className="card-head">
              <div className="card-label"><IconGlobe size={13} /> Multilingual Batch Preview</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setBatchResults([])}>
                <IconX size={13} /> Clear
              </button>
            </div>
            <div style={{ padding: 20 }}>
              <div className="grid-3" style={{ gap: 20 }}>
                {batchResults.map((msg: any) => (
                  <div key={msg.language} className="wa-preview" style={{ padding: 14 }}>
                    <div className="wa-lang-tag">{msg.language}</div>
                    {msg.error ? (
                      <div className="text-red text-xs">Generation failed. Retry.</div>
                    ) : (
                      <>
                        <div className="wa-text" style={{ fontSize: 13, minHeight: 60 }}>{msg.message_native}</div>
                        <div className="wa-translation" style={{ fontSize: 11, marginTop: 8 }}>{msg.message_english}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
