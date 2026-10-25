'use client';

import { useState } from 'react';

export function AdminReviewActions({ reviewId }: { reviewId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function updateStatus(status: 'PUBLISHED' | 'HIDDEN') {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(result?.error?.message || 'Não foi possível atualizar a avaliação.');
        return;
      }
      window.location.reload();
    } catch {
      setMessage('Falha de conexão. Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" disabled={busy} onClick={() => updateStatus('PUBLISHED')} style={{ border: 0, borderRadius: 8, padding: '10px 14px', background: '#172554', color: 'white', fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.65 : 1 }}>
          Publicar avaliação
        </button>
        <button type="button" disabled={busy} onClick={() => updateStatus('HIDDEN')} style={{ border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', background: 'white', color: '#b91c1c', fontWeight: 700, cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.65 : 1 }}>
          Ocultar avaliação
        </button>
      </div>
      {message && <p role="alert" style={{ color: '#b91c1c', fontSize: 12, margin: '8px 0 0' }}>{message}</p>}
    </div>
  );
}
