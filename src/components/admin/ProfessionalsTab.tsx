'use client';

import { btn, panel } from './shared';
import type { Data } from './types';

export function ProfessionalsTab({
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
      <h2 style={{ marginTop: 0 }}>Perfis profissionais</h2>
      <p style={{ color: '#64748b', fontSize: 13 }}>
        Perfis novos ficam ocultos até você publicar. Excluir um perfil mantém a conta do usuário e a
        transforma em conta de cliente.
      </p>
      {data.professionals.map((p) => (
        <article
          key={p.id}
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 14,
            marginTop: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <b>{p.user.name}</b>
            <div style={{ color: '#64748b', fontSize: 12 }}>
              {p.user.email} · {p.city}
            </div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 5 }}>
              {p.categories.map((c) => c.category.name).join(', ') || 'Sem categoria'} ·{' '}
              {p.isPublished ? 'Publicado' : 'Aguardando publicação'}
              {p.isVerified ? ' · Verificado' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              disabled={busy === p.id}
              style={btn('primary')}
              onClick={() =>
                void action(p.id, '/api/admin/professionals/' + encodeURIComponent(p.id), 'PATCH', {
                  isPublished: !p.isPublished,
                })
              }
            >
              {p.isPublished ? 'Ocultar do site' : 'Publicar no site'}
            </button>
            <button
              disabled={busy === p.id}
              style={btn()}
              onClick={() =>
                void action(p.id, '/api/admin/professionals/' + encodeURIComponent(p.id), 'PATCH', {
                  isVerified: !p.isVerified,
                })
              }
            >
              {p.isVerified ? 'Remover verificação' : 'Marcar como verificado'}
            </button>
            <button
              disabled={busy === p.id}
              style={btn('danger')}
              onClick={() => void action(p.id, '/api/admin/professionals/' + encodeURIComponent(p.id))}
            >
              {busy === p.id ? 'Aguarde…' : 'Excluir perfil'}
            </button>
          </div>
        </article>
      ))}
      {data.professionals.length === 0 && <p>Nenhum perfil profissional cadastrado.</p>}
    </div>
  );
}
