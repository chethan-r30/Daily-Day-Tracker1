import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const VIBE_COLORS = {
  positive: { bg: '#d1fae5', color: '#065f46', label: '✨ Positive' },
  negative: { bg: '#fee2e2', color: '#991b1b', label: '💀 Negative' },
  neutral:  { bg: '#f3f4f6', color: '#374151', label: '😐 Neutral' },
  hype:     { bg: '#fef9c3', color: '#854d0e', label: '🔥 Hype' },
  sarcastic:{ bg: '#ede9fe', color: '#5b21b6', label: '😏 Sarcastic' },
};

function SkeletonCard({ height = 160 }) {
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)', padding: '24px', height,
      animation: 'shimmer 1.5s ease-in-out infinite',
      backgroundImage: 'linear-gradient(90deg, var(--color-surface-offset) 25%, var(--color-surface-dynamic) 50%, var(--color-surface-offset) 75%)',
      backgroundSize: '200% 100%'
    }} />
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{
        background: copied ? '#d1fae5' : 'var(--color-surface-2)',
        border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
        padding: '4px 10px', fontSize: '12px', cursor: 'pointer',
        color: copied ? '#065f46' : 'var(--color-text-muted)',
        transition: 'all 0.2s', fontWeight: 500
      }}>
      {copied ? '✅ Copied!' : '📋 Copy'}
    </button>
  );
}

export default function WhatsNewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: res } = await api.get('/whatsnew');
        setData(res);
      } catch (err) {
        setError('Failed to load today\'s content. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="container" style={{ paddingTop: '8px', paddingBottom: '40px' }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">✨ What's New Today</h1>
        <p className="page-subtitle">{today} — Fresh content every day to grow your mind.</p>
      </div>

      {/* Shimmer loading */}
      {loading && (
        <>
          <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
          <div style={{ display: 'grid', gap: '20px' }}>
            <SkeletonCard height={120} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <SkeletonCard height={200} />
              <SkeletonCard height={200} />
              <SkeletonCard height={200} />
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 'var(--radius-lg)', padding: '20px', color: '#991b1b', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>😕</div>
          <div style={{ fontWeight: 600 }}>{error}</div>
          <button className="btn btn-primary" style={{ marginTop: '12px' }} onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}

      {data && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ===== THOUGHT FOR THE DAY ===== */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #0c4e54 100%)',
            borderRadius: 'var(--radius-lg)', padding: '32px',
            boxShadow: '0 8px 32px rgba(1,105,111,0.25)', position: 'relative', overflow: 'hidden'
          }}>
            {/* Decorative quote mark */}
            <div style={{ position: 'absolute', top: '-10px', left: '20px', fontSize: '120px', color: 'rgba(255,255,255,0.08)', fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</div>
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>💭</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Thought for the Day
                </span>
              </div>
              <p style={{ fontSize: '20px', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', lineHeight: 1.6, marginBottom: '16px', maxWidth: '700px' }}>
                "{data.thought.text}"
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>
                  — {data.thought.author}
                </span>
                <CopyButton text={`"${data.thought.text}" — ${data.thought.author}`} />
              </div>
            </div>
          </div>

          {/* ===== 3 CARDS ROW ===== */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

            {/* VOCAB CARD */}
            <div className="card" style={{ borderTop: '3px solid var(--color-primary)', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>📖</span>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Word of the Day</div>
                  </div>
                </div>
                <span style={{
                  background: 'var(--color-primary-highlight)', color: 'var(--color-primary)',
                  fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', textTransform: 'capitalize'
                }}>{data.vocab.partOfSpeech}</span>
              </div>

              {/* Word */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
                  {data.vocab.word}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                  {data.vocab.meaning}
                </div>
              </div>

              <div className="divider" />

              {/* Example */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  📝 Example
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-bg)', padding: '10px 12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-primary)', lineHeight: 1.6 }}>
                  "{data.vocab.example}"
                </div>
              </div>

              {/* When to use */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  🎯 When to Use
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.7 }}>
                  {data.vocab.whenToUse}
                </div>
              </div>

              <CopyButton text={`Word: ${data.vocab.word}\nMeaning: ${data.vocab.meaning}\nExample: "${data.vocab.example}"`} />
            </div>

            {/* IDIOM CARD */}
            <div className="card" style={{ borderTop: '3px solid #d19900' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>🗣️</span>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Idiom of the Day
                </div>
              </div>

              {/* Idiom phrase */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 800, color: '#b07a00', lineHeight: 1.2, marginBottom: '8px' }}>
                  "{data.idiom.phrase}"
                </div>
                <div style={{ display: 'inline-block', background: '#fef9c3', color: '#854d0e', padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
                  Meaning: {data.idiom.meaning}
                </div>
              </div>

              <div className="divider" />

              {/* Example */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  📝 Example
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-bg)', padding: '10px 12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #d19900', lineHeight: 1.6 }}>
                  "{data.idiom.example}"
                </div>
              </div>

              {/* Origin */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  🏛️ Origin
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  {data.idiom.origin}
                </div>
              </div>

              <CopyButton text={`Idiom: "${data.idiom.phrase}"\nMeaning: ${data.idiom.meaning}\nExample: "${data.idiom.example}"`} />
            </div>

            {/* GEN Z CARD */}
            <div className="card" style={{ borderTop: '3px solid #7a39bb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>⚡</span>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Gen Z Word
                  </div>
                </div>
                {data.genZ.vibe && VIBE_COLORS[data.genZ.vibe] && (
                  <span style={{
                    background: VIBE_COLORS[data.genZ.vibe].bg,
                    color: VIBE_COLORS[data.genZ.vibe].color,
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px'
                  }}>
                    {VIBE_COLORS[data.genZ.vibe].label}
                  </span>
                )}
              </div>

              {/* Gen Z word */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 800, color: '#7a39bb', lineHeight: 1 }}>
                  {data.genZ.word}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '6px', fontStyle: 'italic' }}>
                  {data.genZ.meaning}
                </div>
              </div>

              <div className="divider" />

              {/* Example */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  💬 How to Use It
                </div>
                <div style={{ fontSize: '14px', color: 'var(--color-text)', background: 'var(--color-bg)', padding: '10px 12px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid #7a39bb', lineHeight: 1.6 }}>
                  "{data.genZ.example}"
                </div>
              </div>

              {/* Usage tip */}
              <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 'var(--radius-md)', padding: '10px 12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: '#5b21b6', fontWeight: 600 }}>
                  💡 Use this around friends, social media, or casual chats — it signals you're in touch with current trends!
                </div>
              </div>

              <CopyButton text={`Gen Z word: "${data.genZ.word}"\nMeaning: ${data.genZ.meaning}\nExample: "${data.genZ.example}"`} />
            </div>
          </div>

          {/* Bottom refresh note */}
          <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
            🔄 Content refreshes automatically every day at midnight &nbsp;|&nbsp; Come back tomorrow for new words!
          </div>
        </div>
      )}
    </div>
  );
}