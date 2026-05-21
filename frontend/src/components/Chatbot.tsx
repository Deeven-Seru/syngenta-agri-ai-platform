import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { IconMessage, IconX, IconSend } from '../icons';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [growers, setGrowers] = useState<any[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string>('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    { sender: 'assistant', text: 'Hello! I am your Syngenta India Agri-AI assistant. Please select a farmer context from the dropdown above, and ask me any agricultural query.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch growers to populate context selector
  useEffect(() => {
    if (isOpen && growers.length === 0) {
      api.getGrowers({ limit: '100' })
        .then(res => {
          if (res && res.growers) {
            setGrowers(res.growers);
            if (res.growers.length > 0) {
              // Prefer phone field, fallback to grower_id or _id
              setSelectedPhone(res.growers[0].phone || res.growers[0].grower_id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedPhone) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setLoading(true);

    api.sendChatMessage(selectedPhone, userText)
      .then(res => {
        setMessages(prev => [...prev, { sender: 'assistant', text: res.response }]);
        setLoading(false);
      })
      .catch(err => {
        setMessages(prev => [...prev, { sender: 'assistant', text: `Error: ${err.message || 'Failed to get AI response.'}` }]);
        setLoading(false);
      });
  };

  const activeGrower = growers.find(g => (g.phone || g.grower_id) === selectedPhone);

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10000 }}>
      {/* Floating Toggle Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(0, 229, 255, 0.15)',
            border: '1px solid var(--teal)',
            color: 'var(--teal-hi)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            boxShadow: '0 8px 32px var(--teal-glow)',
            transition: 'transform 0.2s ease, background 0.2s ease',
            outline: 'none',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; e.currentTarget.style.background = 'rgba(0, 229, 255, 0.25)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(0, 229, 255, 0.15)'; }}
        >
          <IconMessage size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="card"
          style={{
            width: 380,
            height: 480,
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--teal-strong, rgba(0, 229, 255, 0.3))',
            boxShadow: '0 12px 40px rgba(0, 229, 255, 0.15)',
            background: 'var(--bg-panel)',
            animation: 'chatbot-slide-up 0.25s cubic-bezier(0.25, 0, 0, 1) both',
          }}
        >
          {/* Style injection for chatbot animations */}
          <style>{`
            @keyframes chatbot-slide-up {
              from { opacity: 0; transform: translateY(12px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Chat Header */}
          <div
            className="card-head"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(0, 229, 255, 0.03)',
            }}
          >
            <div className="card-label" style={{ color: 'var(--teal-hi)' }}>
              <IconMessage size={16} />
              Syngenta Agri-AI Chat
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                padding: 4,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IconX size={16} />
            </button>
          </div>

          {/* Context/Grower Selector */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 9, color: 'var(--teal-hi)', letterSpacing: 0.6 }}>Active Grower Context</label>
              <select
                className="form-select"
                style={{
                  padding: '5px 9px',
                  fontSize: 11.5,
                  borderColor: 'rgba(0, 229, 255, 0.2)',
                  background: 'var(--bg-base)',
                }}
                value={selectedPhone}
                onChange={(e) => setSelectedPhone(e.target.value)}
              >
                {growers.length === 0 ? (
                  <option value="">No growers registered</option>
                ) : (
                  growers.map((g) => {
                    const identifier = g.phone || g.grower_id || g._id;
                    const label = `${identifier} - ${g.primary_crop || 'No Crop'} (${g.district || 'Unknown'}, ${g.language || 'Hindi'})`;
                    return (
                      <option key={identifier} value={identifier}>
                        {label}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
            {activeGrower && (
              <div style={{ fontSize: 9.5, color: 'var(--text-3)', marginTop: 4, fontStyle: 'italic', display: 'flex', gap: 6 }}>
                <span>Crop: {activeGrower.primary_crop || 'unknown'} ({activeGrower.crop_calendar?.current_stage || 'sowing'})</span>
                <span>•</span>
                <span>District: {activeGrower.district || 'unknown'}</span>
              </div>
            )}
          </div>

          {/* Message List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.sender === 'user' ? 'var(--teal-dim)' : 'var(--bg-surface)',
                  border: m.sender === 'user' ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid var(--border)',
                  borderRadius: m.sender === 'user' ? '8px 8px 0 8px' : '8px 8px 8px 0',
                  padding: '8px 12px',
                  fontSize: 12.5,
                  color: m.sender === 'user' ? 'var(--teal-hi)' : 'var(--text-2)',
                  wordBreak: 'break-word',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px 8px 8px 0',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div className="spinner" style={{ borderColor: 'var(--border-med)', borderTopColor: 'var(--teal)' }} />
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Grounding facts...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSend}
            style={{
              padding: 10,
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 8,
              background: 'var(--bg-surface)',
            }}
          >
            <input
              type="text"
              className="form-input"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderColor: 'var(--border)',
                background: 'var(--bg-base)',
              }}
              placeholder="Ask an agricultural question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || !selectedPhone}
            />
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{
                background: 'rgba(0, 229, 255, 0.1)',
                color: 'var(--teal-hi)',
                boxShadow: 'inset 0 0 0 1px var(--teal-hi)',
                padding: '0 12px',
                height: 32,
              }}
              disabled={loading || !input.trim() || !selectedPhone}
            >
              <IconSend size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
