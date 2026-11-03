'use client';

import { btn, panel, input } from './shared';
import type { Category } from './types';

export function CategoriesTab({
  busy,
  action,
  filteredCategories,
  categorySearch,
  setCategorySearch,
  categoryName,
  setCategoryName,
  groupName,
  setGroupName,
  addCategory,
}: {
  busy: string | null;
  action: (key: string, url: string, method?: string, body?: unknown) => Promise<void>;
  filteredCategories: Category[];
  categorySearch: string;
  setCategorySearch: (value: string) => void;
  categoryName: string;
  setCategoryName: (value: string) => void;
  groupName: string;
  setGroupName: (value: string) => void;
  addCategory: (e: React.FormEvent) => void | Promise<void>;
}) {
  return (
    <div style={panel}>
      <h2 style={{ marginTop: 0 }}>Categorias de serviços</h2>
      <form
        onSubmit={addCategory}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
          gap: 12,
          alignItems: 'end',
          padding: 14,
          borderRadius: 10,
          background: '#f8fafc',
          marginBottom: 20,
        }}
      >
        <label style={{ fontSize: 12, fontWeight: 700 }}>
          Nome da categoria
          <input
            required
            minLength={2}
            maxLength={100}
            style={input}
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Ex.: Instalador solar"
          />
        </label>
        <label style={{ fontSize: 12, fontWeight: 700 }}>
          Grupo
          <select style={input} value={groupName} onChange={(e) => setGroupName(e.target.value)}>
            {[
              'Reparos e manutenção residencial',
              'Limpeza e serviços domésticos',
              'Tecnologia e informática',
              'Automotivo',
              'Beleza e cuidados pessoais',
              'Eventos e outros serviços',
              'Outros serviços',
            ].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <button disabled={busy === 'new-category'} style={{ ...btn('primary'), minHeight: 40 }}>
          {busy === 'new-category' ? 'Salvando…' : 'Adicionar categoria'}
        </button>
      </form>
      <input
        style={{ ...input, marginBottom: 14 }}
        placeholder="Filtrar categorias..."
        value={categorySearch}
        onChange={(e) => setCategorySearch(e.target.value)}
      />
      {filteredCategories.map((c) => (
        <div
          key={c.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid #f1f5f9',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <b>{c.name}</b>
            <div style={{ color: '#64748b', fontSize: 12 }}>
              {c.groupName} · {c._count.professionals} vínculos profissionais · {c._count.services} serviços
            </div>
          </div>
          <button
            disabled={busy === c.id}
            style={btn('danger')}
            onClick={() => void action(c.id, '/api/admin/categories/' + encodeURIComponent(c.id))}
          >
            Excluir categoria
          </button>
        </div>
      ))}
    </div>
  );
}
