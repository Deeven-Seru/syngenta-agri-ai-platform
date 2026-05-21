const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  // Analytics
  getOverview: () => apiFetch('/api/analytics/overview'),
  getEngagementByCrop: () => apiFetch('/api/analytics/engagement-by-crop'),
  getEngagementByLanguage: () => apiFetch('/api/analytics/engagement-by-language'),
  getFunnel: () => apiFetch('/api/analytics/funnel'),
  getTopProducts: () => apiFetch('/api/analytics/top-products'),
  getDistrictHeatmap: () => apiFetch('/api/analytics/district-heatmap'),
  getMapData: () => apiFetch('/api/analytics/map-data'),

  // Growers
  getGrowers: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/api/growers${qs}`);
  },
  getGrowerSegments: () => apiFetch('/api/growers/segments'),

  // Campaigns
  listCampaigns: () => apiFetch('/api/campaigns'),
  createCampaign: (data: object) => apiFetch('/api/campaigns/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getCampaign: (id: string) => apiFetch(`/api/campaigns/${id}`),
  getCampaignTargets: (id: string) => apiFetch(`/api/campaigns/${id}/targets`),
  generateCampaignContent: (id: string, sampleSize = 6) =>
    apiFetch(`/api/campaigns/${id}/generate-content?sample_size=${sampleSize}`, { method: 'POST' }),

  // Weather
  getDistrictWeather: (district: string) => apiFetch(`/api/weather/district/${district}`),
  getIndiaSummary: () => apiFetch('/api/weather/india/summary'),

  // Content
  generateContent: (data: object) => apiFetch('/api/content/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // New features added for Grower registration, Campaign launches, and Chatbot
  createGrower: (data: object) => apiFetch('/api/growers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  launchCampaign: (id: string) => apiFetch(`/api/campaigns/${id}/launch`, {
    method: 'POST',
  }),
  sendChatMessage: (phone_number: string, message: string) => apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ phone_number, message }),
  }),
};

