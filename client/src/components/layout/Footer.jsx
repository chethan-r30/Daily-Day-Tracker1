import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)',
      padding: '20px 0', marginTop: '40px'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
          Made with <span style={{ color: '#e11d48', fontSize: '16px' }}>♥</span> by <strong style={{ color: 'var(--color-text)' }}>Chethan</strong>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
          <span>© {new Date().getFullYear()} DailyTracker</span>
          <span>|</span>
          <span>Privacy Policy</span>
          <span>|</span>
          <span>Terms of Service</span>
          <span>|</span>
          <span>All rights reserved</span>
        </div>
      </div>
    </footer>
  );
}
