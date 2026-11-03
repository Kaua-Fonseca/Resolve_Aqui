'use client';

import { btn, panel, input } from './shared';
import type { Settings } from './types';

export function SettingsTab({
  busy,
  settings,
  setSettings,
  saveSettings,
}: {
  busy: string | null;
  settings: Settings;
  setSettings: (settings: Settings) => void;
  saveSettings: (e: React.FormEvent) => void | Promise<void>;
}) {
  return (
    <div style={panel}>
      <h2 style={{ marginTop: 0 }}>Informações essenciais</h2>
      <p style={{ color: '#64748b', fontSize: 13 }}>
        Esses dados ficam salvos no PostgreSQL. Atualizar esta tela não muda automaticamente textos que ainda
        estejam fixos no código da interface.
      </p>
      <form onSubmit={saveSettings} style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
        <label style={{ fontSize: 13, fontWeight: 700 }}>
          Nome do sistema
          <input
            style={input}
            required
            minLength={2}
            maxLength={100}
            value={settings.siteName}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
          />
        </label>
        <label style={{ fontSize: 13, fontWeight: 700 }}>
          E-mail de suporte
          <input
            style={input}
            required
            type="email"
            maxLength={254}
            value={settings.supportEmail}
            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
          />
        </label>
        <label style={{ fontSize: 13, fontWeight: 700 }}>
          Cidade padrão
          <input
            style={input}
            required
            minLength={2}
            maxLength={100}
            value={settings.defaultCity}
            onChange={(e) => setSettings({ ...settings, defaultCity: e.target.value })}
          />
        </label>
        <label style={{ fontSize: 13, fontWeight: 700 }}>
          Descrição da plataforma
          <textarea
            style={{ ...input, minHeight: 100 }}
            required
            minLength={2}
            maxLength={300}
            value={settings.siteDescription}
            onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
          />
        </label>
        <button
          disabled={busy === 'settings'}
          style={{ ...btn('primary'), justifySelf: 'start', minHeight: 42 }}
        >
          {busy === 'settings' ? 'Salvando…' : 'Salvar informações'}
        </button>
      </form>
    </div>
  );
}
