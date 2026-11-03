'use client';

import { btn, panel, input, role, date } from './shared';
import type { User } from './types';

export function UsersTab({
  busy,
  action,
  filteredUsers,
  userSearch,
  setUserSearch,
}: {
  busy: string | null;
  action: (key: string, url: string, method?: string, body?: unknown) => Promise<void>;
  filteredUsers: User[];
  userSearch: string;
  setUserSearch: (value: string) => void;
}) {
  return (
    <div style={panel}>
      <h2 style={{ marginTop: 0 }}>Usuários cadastrados</h2>
      <p style={{ color: '#64748b', fontSize: 13 }}>
        A exclusão de um usuário também remove seus dados vinculados conforme as regras do banco. Contas ADMIN
        são protegidas.
      </p>
      <input
        style={{ ...input, margin: '14px 0' }}
        placeholder="Buscar por nome ou e-mail..."
        value={userSearch}
        onChange={(e) => setUserSearch(e.target.value)}
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 650, borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Nome', 'E-mail', 'Tipo', 'Status', 'Cadastro', 'Ação'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: 10, background: '#f8fafc' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                {[u.name, u.email, role(u.role), u.isActive ? 'Ativa' : 'Bloqueada', date(u.createdAt)].map(
                  (v, i) => (
                    <td key={i} style={{ padding: 10, borderBottom: '1px solid #f1f5f9' }}>
                      {v}
                    </td>
                  ),
                )}
                <td style={{ padding: 10, borderBottom: '1px solid #f1f5f9' }}>
                  {u.role === 'ADMIN' ? (
                    <span style={{ color: '#64748b' }}>Protegido</span>
                  ) : (
                    <button
                      disabled={busy === u.id}
                      style={btn('danger')}
                      onClick={() => void action(u.id, '/api/admin/users/' + encodeURIComponent(u.id))}
                    >
                      {busy === u.id ? 'Excluindo…' : 'Excluir usuário'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredUsers.length === 0 && <p>Nenhum usuário encontrado.</p>}
    </div>
  );
}
