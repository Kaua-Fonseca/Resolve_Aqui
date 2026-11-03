'use client';

import { panel, role, date } from './shared';
import type { Data } from './types';

export function OverviewTab({ data }: { data: Data }) {
  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        {[
          ['Usuários', data.stats.userCount],
          ['Profissionais', data.stats.professionalCount],
          ['Comentários', data.stats.reviewCount],
          ['Pendentes', data.stats.pendingCount],
          ['Categorias', data.categories.length],
        ].map(([label, value]) => (
          <article key={String(label)} style={{ ...panel, margin: 0 }}>
            <div style={{ color: '#64748b', fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{value}</div>
          </article>
        ))}
      </div>
      <div style={panel}>
        <h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Resumo administrativo</h2>
        <p style={{ color: '#64748b', lineHeight: 1.7, fontSize: 14 }}>
          O painel permite administrar usuários, remover perfis profissionais e comentários, moderar
          avaliações, manter as categorias do catálogo e atualizar informações básicas do Resolve Aqui. As
          alterações são verificadas no servidor e persistidas no PostgreSQL.
        </p>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 0 }}>
          Registros exibidos por lista: até 200 por seção. Totalizadores representam o banco inteiro.
        </p>
      </div>
      <div style={panel}>
        <h2 style={{ margin: '0 0 14px', fontSize: 18 }}>Últimos usuários cadastrados</h2>
        {data.users.slice(0, 6).map((u) => (
          <div
            key={u.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid #f1f5f9',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <b>{u.name}</b>
              <div style={{ color: '#64748b', fontSize: 12 }}>{u.email}</div>
            </div>
            <span style={{ color: '#64748b', fontSize: 12 }}>
              {role(u.role)} · {date(u.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
