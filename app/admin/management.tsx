'use client';

import { useEffect, useState } from 'react';

type Tab = 'overview' | 'users' | 'professionals' | 'reviews' | 'categories' | 'settings';
type User = { id: string; name: string; email: string; role: 'CLIENT'|'PROFESSIONAL'|'ADMIN'; isActive: boolean; createdAt: string };
type Professional = { id: string; slug: string; city: string; isPublished: boolean; isVerified: boolean; createdAt: string; user: { id: string; name: string; email: string }; categories: { category: { name: string } }[] };
type Review = { id: string; rating: number; comment: string; status: 'PENDING'|'PUBLISHED'|'HIDDEN'; createdAt: string; author: { name: string; email: string }; professional: { id: string; user: { name: string } } };
type Category = { id: string; name: string; slug: string; groupName: string; _count: { professionals: number; services: number } };
type Settings = { siteName: string; supportEmail: string; defaultCity: string; siteDescription: string };
type Data = { users: User[]; professionals: Professional[]; reviews: Review[]; categories: Category[]; settings: Settings; stats: { userCount: number; professionalCount: number; reviewCount: number; pendingCount: number } };

const initialSettings: Settings = { siteName: 'Resolve Aqui', supportEmail: 'contato@resolveaqui.com.br', defaultCity: 'Foz do Iguaçu, PR', siteDescription: 'Encontre profissionais locais e entre em contato diretamente.' };
const btn = (kind: 'primary'|'danger'|'muted' = 'muted'): React.CSSProperties => ({ border: kind === 'danger' ? '1px solid #fecaca' : '1px solid #e2e8f0', borderRadius: 8, padding: '8px 11px', fontSize: 12, fontWeight: 700, background: kind === 'primary' ? '#172554' : 'white', color: kind === 'primary' ? 'white' : kind === 'danger' ? '#b91c1c' : '#334155', cursor: 'pointer' });
const panel: React.CSSProperties = { background: 'white', border: '1px solid #e2e8f0', borderRadius: 14, padding: 22, marginBottom: 18 };
const input: React.CSSProperties = { display: 'block', width: '100%', border: '1px solid #cbd5e1', borderRadius: 8, padding: 11, marginTop: 6, color: '#172554', background: 'white' };

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
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/overview', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error?.message || 'Falha ao carregar dados.');
      setData(result); setSettings(result.settings || initialSettings);
    } catch (e) { setError(e instanceof Error ? e.message : 'Falha ao carregar dados.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function action(key: string, url: string, method = 'DELETE', body?: unknown) {
    if (method === 'DELETE' && !window.confirm('Tem certeza? Esta ação pode remover dados relacionados e não pode ser desfeita.')) return;
    setBusy(key); setMessage(''); setError('');
    try {
      const response = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error?.message || 'A operação não foi concluída.');
      setMessage(result?.message || 'Alteração salva.');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir a operação.'); }
    finally { setBusy(null); }
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
    { id: 'overview', label: 'Visão geral', icon: '▦' }, { id: 'users', label: 'Usuários', icon: '♙' },
    { id: 'professionals', label: 'Profissionais', icon: '⌂' }, { id: 'reviews', label: 'Comentários', icon: '☆' },
    { id: 'categories', label: 'Categorias', icon: '▤' }, { id: 'settings', label: 'Informações do sistema', icon: '⚙' },
  ];
  const role = (value: string) => ({ ADMIN: 'Administrador', PROFESSIONAL: 'Profissional', CLIENT: 'Cliente' }[value] || value);
  const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  const filteredUsers = (data?.users || []).filter(u => (u.name + ' ' + u.email).toLowerCase().includes(userSearch.toLowerCase()));
  const filteredCategories = (data?.categories || []).filter(c => (c.name + ' ' + c.groupName).toLowerCase().includes(categorySearch.toLowerCase()));

  return <main style={{ minHeight: '100vh', background: '#f8fafc', color: '#172554', fontFamily: 'Arial,sans-serif' }}>
    <header style={{ background: '#172554', color: 'white', padding: '22px max(20px, calc((100vw - 1280px) / 2))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
      <div><div style={{ color: '#fdba74', fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>RESOLVE AQUI</div><h1 style={{ margin: '7px 0 4px', fontSize: 27 }}>Administração do sistema</h1><div style={{ color: '#cbd5e1', fontSize: 13 }}>Olá, {adminName}. Gerencie os dados da plataforma.</div></div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><a href="/" style={{ color: '#fdba74', fontSize: 13 }}>Voltar ao site ↗</a><button style={{ ...btn('muted'), color: '#172554' }} onClick={() => void load()}>Atualizar dados</button></div>
    </header>
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: 20, display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)', gap: 20 }}>
      <aside style={{ ...panel, height: 'fit-content', padding: 10, position: 'sticky', top: 16 }}>
        {nav.map(item => <button key={item.id} onClick={() => { setTab(item.id); setMessage(''); setError(''); }} style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', textAlign: 'left', padding: '12px 10px', border: 0, borderRadius: 8, marginBottom: 4, background: tab === item.id ? '#fff7ed' : 'white', color: tab === item.id ? '#c2410c' : '#475569', fontWeight: tab === item.id ? 800 : 600, cursor: 'pointer' }}><span style={{ width: 22, textAlign: 'center' }}>{item.icon}</span>{item.label}</button>)}
      </aside>
      <section style={{ minWidth: 0 }}>
        {message && <p role="status" style={{ ...panel, borderColor: '#bbf7d0', color: '#166534', marginBottom: 12 }}>{message}</p>}
        {error && <p role="alert" style={{ ...panel, borderColor: '#fecaca', color: '#b91c1c', marginBottom: 12 }}>{error}</p>}
        {loading && <div style={panel}>Carregando dados do banco...</div>}
        {!loading && data && tab === 'overview' && <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: 12, marginBottom: 18 }}>
            {[['Usuários',data.stats.userCount],['Profissionais',data.stats.professionalCount],['Comentários',data.stats.reviewCount],['Pendentes',data.stats.pendingCount],['Categorias',data.categories.length]].map(([label,value]) => <article key={String(label)} style={{ ...panel, margin: 0 }}><div style={{ color: '#64748b', fontSize: 13 }}>{label}</div><div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{value}</div></article>)}
          </div>
          <div style={panel}><h2 style={{ margin: '0 0 8px', fontSize: 20 }}>Resumo administrativo</h2><p style={{ color: '#64748b', lineHeight: 1.7, fontSize: 14 }}>O painel permite administrar usuários, remover perfis profissionais e comentários, moderar avaliações, manter as categorias do catálogo e atualizar informações básicas do Resolve Aqui. As alterações são verificadas no servidor e persistidas no PostgreSQL.</p><p style={{ color: '#64748b', fontSize: 13, marginBottom: 0 }}>Registros exibidos por lista: até 200 por seção. Totalizadores representam o banco inteiro.</p></div>
          <div style={panel}><h2 style={{ margin: '0 0 14px', fontSize: 18 }}>Últimos usuários cadastrados</h2>{data.users.slice(0,6).map(u=><div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}><div><b>{u.name}</b><div style={{ color: '#64748b', fontSize: 12 }}>{u.email}</div></div><span style={{ color: '#64748b', fontSize: 12 }}>{role(u.role)} · {date(u.createdAt)}</span></div>)}</div>
        </>}
        {!loading && data && tab === 'users' && <div style={panel}><h2 style={{ marginTop: 0 }}>Usuários cadastrados</h2><p style={{ color: '#64748b', fontSize: 13 }}>A exclusão de um usuário também remove seus dados vinculados conforme as regras do banco. Contas ADMIN são protegidas.</p><input style={{ ...input, margin: '14px 0' }} placeholder="Buscar por nome ou e-mail..." value={userSearch} onChange={e => setUserSearch(e.target.value)}/><div style={{ overflowX: 'auto' }}><table style={{ width: '100%', minWidth: 650, borderCollapse: 'collapse', fontSize: 13 }}><thead><tr>{['Nome','E-mail','Tipo','Status','Cadastro','Ação'].map(h=><th key={h} style={{ textAlign: 'left', padding: 10, background: '#f8fafc' }}>{h}</th>)}</tr></thead><tbody>{filteredUsers.map(u=><tr key={u.id}>{[u.name,u.email,role(u.role),u.isActive?'Ativa':'Bloqueada',date(u.createdAt)].map((v,i)=><td key={i} style={{ padding: 10, borderBottom: '1px solid #f1f5f9' }}>{v}</td>)}<td style={{ padding: 10, borderBottom: '1px solid #f1f5f9' }}>{u.role === 'ADMIN' ? <span style={{ color: '#64748b' }}>Protegido</span> : <button disabled={busy===u.id} style={btn('danger')} onClick={() => void action(u.id, '/api/admin/users/'+encodeURIComponent(u.id))}>{busy===u.id?'Excluindo…':'Excluir usuário'}</button>}</td></tr>)}</tbody></table></div>{filteredUsers.length===0&&<p>Nenhum usuário encontrado.</p>}</div>}
        {!loading && data && tab === 'professionals' && <div style={panel}><h2 style={{ marginTop: 0 }}>Perfis profissionais</h2><p style={{ color: '#64748b', fontSize: 13 }}>Perfis novos ficam ocultos até você publicar. Excluir um perfil mantém a conta do usuário e a transforma em conta de cliente.</p>{data.professionals.map(p=><article key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}><div><b>{p.user.name}</b><div style={{ color: '#64748b', fontSize: 12 }}>{p.user.email} · {p.city}</div><div style={{ color: '#64748b', fontSize: 12, marginTop: 5 }}>{p.categories.map(c=>c.category.name).join(', ') || 'Sem categoria'} · {p.isPublished?'Publicado':'Aguardando publicação'}{p.isVerified?' · Verificado':''}</div></div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><button disabled={busy===p.id} style={btn('primary')} onClick={() => void action(p.id, '/api/admin/professionals/'+encodeURIComponent(p.id), 'PATCH', { isPublished: !p.isPublished })}>{p.isPublished?'Ocultar do site':'Publicar no site'}</button><button disabled={busy===p.id} style={btn()} onClick={() => void action(p.id, '/api/admin/professionals/'+encodeURIComponent(p.id), 'PATCH', { isVerified: !p.isVerified })}>{p.isVerified?'Remover verificação':'Marcar como verificado'}</button><button disabled={busy===p.id} style={btn('danger')} onClick={() => void action(p.id, '/api/admin/professionals/'+encodeURIComponent(p.id))}>{busy===p.id?'Aguarde…':'Excluir perfil'}</button></div></article>)}{data.professionals.length===0&&<p>Nenhum perfil profissional cadastrado.</p>}</div>}
        {!loading && data && tab === 'reviews' && <div style={panel}><h2 style={{ marginTop: 0 }}>Comentários e avaliações</h2><p style={{ color: '#64748b', fontSize: 13 }}>Publique, oculte ou exclua avaliações. A exclusão é permanente.</p>{data.reviews.map(r=><article key={r.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginTop: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}><b>{r.professional.user.name} · {'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</b><span style={{ color: '#64748b', fontSize: 12 }}>{r.status} · {date(r.createdAt)}</span></div><p style={{ margin: '10px 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{r.comment}</p><div style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>Por {r.author.name} ({r.author.email})</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{r.status!=='PUBLISHED'&&<button disabled={busy===r.id} style={btn('primary')} onClick={() => void action(r.id,'/api/admin/reviews/'+encodeURIComponent(r.id),'PATCH',{status:'PUBLISHED'})}>Publicar</button>}{r.status!=='HIDDEN'&&<button disabled={busy===r.id} style={btn()} onClick={() => void action(r.id,'/api/admin/reviews/'+encodeURIComponent(r.id),'PATCH',{status:'HIDDEN'})}>Ocultar</button>}<button disabled={busy===r.id} style={btn('danger')} onClick={() => void action(r.id,'/api/admin/reviews/'+encodeURIComponent(r.id)+'/delete')}>Excluir comentário</button></div></article>)}{data.reviews.length===0&&<p>Nenhuma avaliação cadastrada.</p>}</div>}
        {!loading && data && tab === 'categories' && <div style={panel}><h2 style={{ marginTop: 0 }}>Categorias de serviços</h2><form onSubmit={addCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, alignItems: 'end', padding: 14, borderRadius: 10, background: '#f8fafc', marginBottom: 20 }}><label style={{ fontSize: 12, fontWeight: 700 }}>Nome da categoria<input required minLength={2} maxLength={100} style={input} value={categoryName} onChange={e=>setCategoryName(e.target.value)} placeholder="Ex.: Instalador solar"/></label><label style={{ fontSize: 12, fontWeight: 700 }}>Grupo<select style={input} value={groupName} onChange={e=>setGroupName(e.target.value)}>{['Reparos e manutenção residencial','Limpeza e serviços domésticos','Tecnologia e informática','Automotivo','Beleza e cuidados pessoais','Eventos e outros serviços','Outros serviços'].map(g=><option key={g}>{g}</option>)}</select></label><button disabled={busy==='new-category'} style={{ ...btn('primary'), minHeight: 40 }}>{busy==='new-category'?'Salvando…':'Adicionar categoria'}</button></form><input style={{ ...input, marginBottom: 14 }} placeholder="Filtrar categorias..." value={categorySearch} onChange={e=>setCategorySearch(e.target.value)}/>{filteredCategories.map(c=><div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}><div><b>{c.name}</b><div style={{ color: '#64748b', fontSize: 12 }}>{c.groupName} · {c._count.professionals} vínculos profissionais · {c._count.services} serviços</div></div><button disabled={busy===c.id} style={btn('danger')} onClick={() => void action(c.id,'/api/admin/categories/'+encodeURIComponent(c.id))}>Excluir categoria</button></div>)}</div>}
        {!loading && data && tab === 'settings' && <div style={panel}><h2 style={{ marginTop: 0 }}>Informações essenciais</h2><p style={{ color: '#64748b', fontSize: 13 }}>Esses dados ficam salvos no PostgreSQL. Atualizar esta tela não muda automaticamente textos que ainda estejam fixos no código da interface.</p><form onSubmit={saveSettings} style={{ display: 'grid', gap: 16, maxWidth: 720 }}><label style={{ fontSize: 13, fontWeight: 700 }}>Nome do sistema<input style={input} required minLength={2} maxLength={100} value={settings.siteName} onChange={e=>setSettings({...settings,siteName:e.target.value})}/></label><label style={{ fontSize: 13, fontWeight: 700 }}>E-mail de suporte<input style={input} required type="email" maxLength={254} value={settings.supportEmail} onChange={e=>setSettings({...settings,supportEmail:e.target.value})}/></label><label style={{ fontSize: 13, fontWeight: 700 }}>Cidade padrão<input style={input} required minLength={2} maxLength={100} value={settings.defaultCity} onChange={e=>setSettings({...settings,defaultCity:e.target.value})}/></label><label style={{ fontSize: 13, fontWeight: 700 }}>Descrição da plataforma<textarea style={{ ...input, minHeight: 100 }} required minLength={2} maxLength={300} value={settings.siteDescription} onChange={e=>setSettings({...settings,siteDescription:e.target.value})}/></label><button disabled={busy==='settings'} style={{ ...btn('primary'), justifySelf: 'start', minHeight: 42 }}>{busy==='settings'?'Salvando…':'Salvar informações'}</button></form></div>}
      </section>
    </div>
    <footer style={{ maxWidth: 1280, margin: '0 auto', padding: '0 20px 24px', color: '#94a3b8', fontSize: 12 }}>Painel restrito a administradores. As operações administrativas são verificadas no servidor.</footer>
  </main>;
}
