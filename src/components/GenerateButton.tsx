'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GenerateButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [directive, setDirective] = useState('');
  const router = useRouter();

  const handlePublish = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ directive: directive.trim() })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate article.');
      }
      
      // Clear input and refresh
      setDirective('');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem', width: '100%', maxWidth: '400px' }}>
      
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label htmlFor="directive" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          OPTIONAL: EDITORIAL DIRECTIVE
        </label>
        <input 
          id="directive"
          type="text" 
          value={directive}
          onChange={(e) => setDirective(e.target.value)}
          placeholder="e.g. 'INVESTIGATE RENEWABLE ENERGY MARKETS'"
          style={{
            padding: '1rem',
            background: 'var(--bg-color)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-color)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            borderRadius: '4px',
            outline: 'none',
            letterSpacing: '0.05em'
          }}
          disabled={loading}
        />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          Leave blank to let the pipeline autonomously pull global viral trends.
        </span>
      </div>

      <button 
        onClick={handlePublish}
        disabled={loading}
        style={{ 
          width: '100%',
          padding: '1rem', 
          background: loading ? 'var(--border-color)' : 'var(--text-color)', 
          color: loading ? 'var(--text-secondary)' : 'var(--bg-color)', 
          border: 'none', 
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontSize: '0.875rem',
          transition: 'all 0.3s ease',
          boxShadow: loading ? 'none' : '0 4px 14px 0 rgba(0,0,0,0.1)',
          marginTop: '0.5rem'
        }}
        onMouseOver={(e) => {
          if(!loading) e.currentTarget.style.opacity = '0.8';
        }}
        onMouseOut={(e) => {
          if(!loading) e.currentTarget.style.opacity = '1';
        }}
      >
        {loading ? 'Synthesizing Report...' : 'Force Publish'}
      </button>

      {error && (
        <div style={{ color: 'var(--accent-color)', fontSize: '0.875rem', textAlign: 'center', marginTop: '0.5rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
