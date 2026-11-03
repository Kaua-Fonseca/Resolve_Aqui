'use client';

import { btn, panel, date } from './shared';
import type { Data } from './types';

export function ReviewsTab({
  data,
  busy,
  action,
}: {
  data: Data;
  busy: string | null;
  action: (key: string, url: string, method?: string, body?: unknown) => Promise<void>;
}) {
  return (
    <div style={panel}>
      <h2 style={{ marginTop: 0 }}>Comentários e avaliações</h2>
      <p style={{ color: '#64748b', fontSize: 13 }}>
        Publique, oculte ou exclua avaliações. A exclusão é permanente.
      </p>
      {data.reviews.map((r) => (
        <article
          key={r.id}
          style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginTop: 10 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <b>
              {r.professional.user.name} · {'★'.repeat(r.rating)}
              {'☆'.repeat(5 - r.rating)}
            </b>
            <span style={{ color: '#64748b', fontSize: 12 }}>
              {r.status} · {date(r.createdAt)}
            </span>
          </div>
          <p style={{ margin: '10px 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{r.comment}</p>
          <div style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>
            Por {r.author.name} ({r.author.email})
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {r.status !== 'PUBLISHED' && (
              <button
                disabled={busy === r.id}
                style={btn('primary')}
                onClick={() =>
                  void action(r.id, '/api/admin/reviews/' + encodeURIComponent(r.id), 'PATCH', {
                    status: 'PUBLISHED',
                  })
                }
              >
                Publicar
              </button>
            )}
            {r.status !== 'HIDDEN' && (
              <button
                disabled={busy === r.id}
                style={btn()}
                onClick={() =>
                  void action(r.id, '/api/admin/reviews/' + encodeURIComponent(r.id), 'PATCH', {
                    status: 'HIDDEN',
                  })
                }
              >
                Ocultar
              </button>
            )}
            <button
              disabled={busy === r.id}
              style={btn('danger')}
              onClick={() => void action(r.id, '/api/admin/reviews/' + encodeURIComponent(r.id) + '/delete')}
            >
              Excluir comentário
            </button>
          </div>
        </article>
      ))}
      {data.reviews.length === 0 && <p>Nenhuma avaliação cadastrada.</p>}
    </div>
  );
}
