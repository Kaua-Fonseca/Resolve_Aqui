'use client';

import { useEffect, useState } from 'react';
import { btn, panel, initialSettings } from '@/components/admin/shared';
import type { Tab, Settings, Data } from '@/components/admin/types';
import { OverviewTab } from '@/components/admin/OverviewTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { ProfessionalsTab } from '@/components/admin/ProfessionalsTab';
import { ReviewsTab } from '@/components/admin/ReviewsTab';
import { CategoriesTab } from '@/components/admin/CategoriesTab';
import { SettingsTab } from '@/components/admin/SettingsTab';

export function AdminManagement({ adminName }: { adminName: string }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [groupName, setGroupName] = useState('Reparos e manutenção residencial');
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [userSearch, setUserSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/overview', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || 'Falha ao carregar dados.');
      setData(result);
      setSettings(result.settings || initialSettings);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function action(key: string, url: string, method = 'DELETE', body?: unknown) {
    if (
      method === 'DELETE' &&
      !window.confirm('Tem certeza? Esta ação pode remover dados relacionados e não pode ser desfeita.')
    )
      return;
    setBusy(key);
    setMessage('');
    setError('');
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error?.message || 'A operação não foi concluída.');
      setMessage(result?.message || 'Alteração salva.');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir a operação.');
    } finally {
      setBusy(null);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    await action('new-category', '/api/admin/categories', 'POST', { name: categoryName, groupName });
    setCategoryName('');
  }
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    await action('settings', '/api/admin/settings', 'PUT', settings);
  }

  const nav: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Visão geral', icon: '▦' },
    { id: 'users', label: 'Usuários', icon: '♙' },
    { id: 'professionals', label: 'Profissionais', icon: '⌂' },
    { id: 'reviews', label: 'Comentários', icon: '☆' },
    { id: 'categories', label: 'Categorias', icon: '▤' },
    { id: 'settings', label: 'Informações do sistema', icon: '⚙' },
  ];
  const filteredUsers = (data?.users || []).filter((u) =>
    (u.name + ' ' + u.email).toLowerCase().includes(userSearch.toLowerCase()),
  );
  const filteredCategories = (data?.categories || []).filter((c) =>
    (c.name + ' ' + c.groupName).toLowerCase().includes(categorySearch.toLowerCase()),
  );

  return (
    <main
      style={{ minHeight: '100vh', background: '#f8fafc', color: '#172554', fontFamily: 'Arial,sans-serif' }}
    >
      <header
        style={{
          background: '#172554',
          color: 'white',
          padding: '22px max(20px, calc((100vw - 1280px) / 2))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ color: '#fdba74', fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>
            RESOLVE AQUI
          </div>
          <h1 style={{ margin: '7px 0 4px', fontSize: 27 }}>Administração do sistema</h1>
          <div style={{ color: '#cbd5e1', fontSize: 13 }}>
            Olá, {adminName}. Gerencie os dados da plataforma.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="/" style={{ color: '#fdba74', fontSize: 13 }}>
            Voltar ao site ↗
          </a>
          <button style={{ ...btn('muted'), color: '#172554' }} onClick={() => void load()}>
            Atualizar dados
          </button>
        </div>
      </header>
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: 20,
          display: 'grid',
          gridTemplateColumns: '220px minmax(0,1fr)',
          gap: 20,
        }}
      >
        <aside style={{ ...panel, height: 'fit-content', padding: 10, position: 'sticky', top: 16 }}>
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setMessage('');
                setError('');
              }}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                padding: '12px 10px',
                border: 0,
                borderRadius: 8,
                marginBottom: 4,
                background: tab === item.id ? '#fff7ed' : 'white',
                color: tab === item.id ? '#c2410c' : '#475569',
                fontWeight: tab === item.id ? 800 : 600,
                cursor: 'pointer',
              }}
            >
              <span style={{ width: 22, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>
        <section style={{ minWidth: 0 }}>
          {message && (
            <p role="status" style={{ ...panel, borderColor: '#bbf7d0', color: '#166534', marginBottom: 12 }}>
              {message}
            </p>
          )}
          {error && (
            <p role="alert" style={{ ...panel, borderColor: '#fecaca', color: '#b91c1c', marginBottom: 12 }}>
              {error}
            </p>
          )}
          {loading && <div style={panel}>Carregando dados do banco...</div>}
          {!loading && data && tab === 'overview' && <OverviewTab data={data} />}
          {!loading && data && tab === 'users' && (
            <UsersTab
              busy={busy}
              action={action}
              filteredUsers={filteredUsers}
              userSearch={userSearch}
              setUserSearch={setUserSearch}
            />
          )}
          {!loading && data && tab === 'professionals' && (
            <ProfessionalsTab data={data} busy={busy} action={action} />
          )}
          {!loading && data && tab === 'reviews' && <ReviewsTab data={data} busy={busy} action={action} />}
          {!loading && data && tab === 'categories' && (
            <CategoriesTab
              busy={busy}
              action={action}
              filteredCategories={filteredCategories}
              categorySearch={categorySearch}
              setCategorySearch={setCategorySearch}
              categoryName={categoryName}
              setCategoryName={setCategoryName}
              groupName={groupName}
              setGroupName={setGroupName}
              addCategory={addCategory}
            />
          )}
          {!loading && data && tab === 'settings' && (
            <SettingsTab
              busy={busy}
              settings={settings}
              setSettings={setSettings}
              saveSettings={saveSettings}
            />
          )}
        </section>
      </div>
      <footer
        style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px 24px', color: '#94a3b8', fontSize: 12 }}
      >
        Painel restrito a administradores. As operações administrativas são verificadas no servidor.
      </footer>
    </main>
  );
}
