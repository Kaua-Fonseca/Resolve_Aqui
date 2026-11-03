import type { Settings } from './types';

export const initialSettings: Settings = {
  siteName: 'Resolve Aqui',
  supportEmail: 'contato@resolveaqui.com.br',
  defaultCity: 'Foz do Iguaçu, PR',
  siteDescription: 'Encontre profissionais locais e entre em contato diretamente.',
};

export const btn = (kind: 'primary' | 'danger' | 'muted' = 'muted'): React.CSSProperties => ({
  border: kind === 'danger' ? '1px solid #fecaca' : '1px solid #e2e8f0',
  borderRadius: 8,
  padding: '8px 11px',
  fontSize: 12,
  fontWeight: 700,
  background: kind === 'primary' ? '#172554' : 'white',
  color: kind === 'primary' ? 'white' : kind === 'danger' ? '#b91c1c' : '#334155',
  cursor: 'pointer',
});

export const panel: React.CSSProperties = {
  background: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 22,
  marginBottom: 18,
};

export const input: React.CSSProperties = {
  display: 'block',
  width: '100%',
  border: '1px solid #cbd5e1',
  borderRadius: 8,
  padding: 11,
  marginTop: 6,
  color: '#172554',
  background: 'white',
};

export const role = (value: string) =>
  ({ ADMIN: 'Administrador', PROFESSIONAL: 'Profissional', CLIENT: 'Cliente' })[value] || value;

export const date = (value: string) =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
