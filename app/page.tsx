'use client';

import { useEffect, useRef, useState } from 'react'

type Page = 'home' | 'search' | 'profile' | 'login' | 'signup' | 'dashboard' | 'favorites'
type Role = 'CLIENT' | 'PROFESSIONAL' | 'ADMIN'
type AuthUser = { id: string; name: string; email: string; phone?: string | null; role: Role }
type Category = { name: string; slug?: string; isPrimary?: boolean }
type Pro = {
  id: string; slug: string; name: string; headline?: string | null; description?: string | null
  city: string; state?: string; neighborhoods?: string[]; whatsapp?: string | null; yearsExperience?: number | null
  isVerified?: boolean; categories: Category[]; averageRating?: number | null; reviewCount?: number
  avatarId?: string | null; workImages?: string[]
}

const heroPhoto = 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1400&q=85'
const categoryIcons: Record<string, string> = { Eletricista: '⚡', Encanador: '◉', Pintor: '▰', Diarista: '✦', 'Montador de móveis': '⌑', 'Técnico de informática': '⌘', Mecânico: '⚙', 'Instalação de câmeras de segurança': '◫' }

async function api(url: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: any }> {
  try {
    const response = await fetch(url, { credentials: 'same-origin', ...init })
    const data = await response.json().catch(() => ({}))
    return { ok: response.ok, status: response.status, data }
  } catch {
    return { ok: false, status: 0, data: { error: { message: 'Não foi possível conectar ao servidor.' } } }
  }
}

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(x => x[0]?.toUpperCase()).join('')
const fmtRating = (v?: number | null) => v == null ? '—' : v.toFixed(1).replace('.', ',')
const mainCategory = (p: Pro) => (p.categories.find(c => c.isPrimary) || p.categories[0])?.name || 'Profissional'
const whatsappUrl = (number: string | null | undefined, name: string) => {
  const digits = (number || '').replace(/\D/g, '')
  if (!digits) return ''
  const full = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${full}?text=${encodeURIComponent(`Olá, ${name}! Encontrei seu perfil no Resolve Aqui e gostaria de solicitar um orçamento.`)}`
}

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t) }, [value, delay])
  return debounced
}

const normalize = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

function Avatar({ id, name }: { id?: string | null; name: string }) {
  return id ? <img src={`/api/images/${id}`} alt={name}/> : <div className="avatar-fallback" aria-hidden>{initials(name)}</div>
}

// Campo de cidade: o usuário digita livremente, mas vê sugestões com as cidades que já têm profissionais.
function CityPicker({ value, onChange, placeholder = 'Sua cidade', required }: { value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  const [open, setOpen] = useState(false)
  const [cities, setCities] = useState<{ name: string; state: string; count: number }[]>([])
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => { api('/api/cities').then(r => { if (r.ok && Array.isArray(r.data.cities)) setCities(r.data.cities) }) }, [])
  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const q = normalize(value)
  const exact = cities.some(c => normalize(c.name) === q)
  const options = !q || exact ? cities : cities.filter(c => normalize(c.name).includes(q))
  return <div className="category-picker" ref={box}>
    <input value={value} required={required} minLength={required ? 2 : undefined} maxLength={100} onChange={e => { onChange(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} placeholder={placeholder} autoComplete="off" role="combobox" aria-expanded={open}/>
    {open && <div className="picker-menu"><div className="picker-options">
      {options.length ? <div className="picker-group"><b>Cidades com profissionais</b>{options.map(c => <button type="button" key={c.name} className={normalize(c.name) === q ? 'selected' : ''} onClick={() => { onChange(c.name); setOpen(false) }}><span>{c.name}{c.state ? `, ${c.state}` : ''}</span><small>{c.count} profissiona{c.count === 1 ? 'l' : 'is'}</small></button>)}</div>
        : <p>{cities.length ? 'Nenhuma cidade sugerida com esse nome.' : 'Ainda não há cidades com profissionais publicados.'}</p>}
    </div></div>}
  </div>
}

// Reduz a imagem no navegador antes do envio (rápido e economiza banco/banda).
async function compressImage(file: File, maxSize: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('blob')), 'image/jpeg', 0.85))
}

async function uploadImage(file: File, kind: 'AVATAR' | 'WORK') {
  let blob: Blob = file
  try { blob = await compressImage(file, kind === 'AVATAR' ? 700 : 1600) }
  catch { if (file.size > 3 * 1024 * 1024) return { ok: false, message: 'Imagem muito grande. Use uma foto de até 3 MB.' } }
  const form = new FormData()
  form.append('file', blob, 'foto.jpg'); form.append('kind', kind)
  const r = await api('/api/account/professional/images', { method: 'POST', body: form })
  return { ok: r.ok, message: r.ok ? '' : (r.data?.error?.message || 'Não foi possível enviar a imagem.') }
}

function CategoryPicker({ selected, onChange, multiple = false, placeholder = 'Selecione uma categoria', error }: { selected:string[]; onChange:(items:string[])=>void; multiple?:boolean; placeholder?:string; error?:string }) {
  const [open,setOpen]=useState(false)
  const [query,setQuery]=useState('')
  const [groups,setGroups]=useState<{group:string;items:string[]}[]>([])
  useEffect(()=>{fetch('/api/categories').then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(Array.isArray(data.categories)){const grouped=new Map<string,string[]>();for(const c of data.categories){const key=c.groupName||'Outros serviços';grouped.set(key,[...(grouped.get(key)||[]),c.name])}setGroups(Array.from(grouped.entries()).map(([group,items])=>({group,items})))}}).catch(()=>{} )},[])
  const toggle=(item:string)=>{
    if(multiple) onChange(selected.includes(item)?selected.filter(x=>x!==item):[...selected,item])
    else { onChange([item]); setOpen(false) }
  }
  const visible=groups.map(g=>({...g,items:g.items.filter(x=>x.toLowerCase().includes(query.toLowerCase()))})).filter(g=>g.items.length)
  return <div className="category-picker">
    <button type="button" className={`picker-trigger ${error?'has-error':''}`} onClick={()=>setOpen(!open)}>
      <span>{selected.length ? (multiple ? `${selected.length} categoria${selected.length>1?'s':''} selecionada${selected.length>1?'s':''}` : selected[0]) : placeholder}</span>
      <span className="picker-chevron">⌄</span>
    </button>
    {selected.length>0&&multiple&&<div className="selected-tags">{selected.map(item=><span key={item}>{item}<button type="button" onClick={()=>toggle(item)} aria-label={`Remover ${item}`}>×</button></span>)}</div>}
    {open&&<div className="picker-menu">
      <div className="picker-search"><Icon name="search" size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar categoria pelo nome..." autoFocus/></div>
      <div className="picker-options">{visible.length?visible.map(group=><div className="picker-group" key={group.group}><b>{group.group}</b>{group.items.map(item=><button type="button" className={selected.includes(item)?'selected':''} key={item} onClick={()=>toggle(item)}><span>{item}</span>{selected.includes(item)&&<Icon name="check" size={15}/>}</button>)}</div>):<p>Nenhuma categoria encontrada.</p>}</div>
    </div>}
    {error&&<span className="field-error">{error}</span>}
  </div>
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    star: <path d="m12 2 3 6 6.6 1-4.8 4.6 1.2 6.5-6-3.1-6 3.1 1.2-6.5L2.4 9 9 8Z"/>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    whatsapp: <><path d="M20 11.5a8 8 0 0 1-11.8 7L3 20l1.5-5A8 8 0 1 1 20 11.5Z"/><path d="M8.5 8c.5 3 2.5 5 5.5 5.5"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>
}

function Button({ children, variant = 'primary', onClick, className = '', disabled, type }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'whatsapp'; onClick?: () => void; className?: string; disabled?: boolean; type?: 'button' | 'submit' }) {
  return <button type={type} disabled={disabled} className={`btn btn-${variant} ${className}`} onClick={onClick}>{children}</button>
}
function Logo({ onClick }: { onClick: () => void }) {
  return <button className="logo" onClick={onClick} aria-label="Ir para o início"><span className="logo-mark"><Icon name="check" size={19}/></span><span>Resolve <b>Aqui</b></span></button>
}

function Header({ go, user, logout }: { go: (p: Page) => void; user: AuthUser | null; logout: () => void }) {
  const [open, setOpen] = useState(false)
  return <header className="header"><div className="container header-inner">
    <Logo onClick={() => go('home')}/>
    <nav className={open ? 'nav open' : 'nav'}>
      <button onClick={() => go('home')}>Início</button>
      <button onClick={() => go('search')}>Encontrar profissionais</button>
      <button onClick={() => { go('home'); setTimeout(() => document.querySelector('#categorias')?.scrollIntoView({behavior:'smooth'}), 50) }}>Categorias</button>
      <button onClick={() => { go('home'); setTimeout(() => document.querySelector('#como')?.scrollIntoView({behavior:'smooth'}), 50) }}>Como funciona</button>
    </nav>
    <div className="header-actions">{user ? <>
      {user.role === 'ADMIN' && <a className="btn btn-secondary" href="/admin">Painel admin</a>}
      {user.role === 'PROFESSIONAL' && <Button variant="secondary" onClick={() => go('dashboard')}>Meu painel</Button>}
      {user.role !== 'ADMIN' && <Button variant="ghost" onClick={() => go('favorites')}><Icon name="heart" size={17}/> Meus favoritos</Button>}
      <Button onClick={logout}>Sair</Button>
    </> : <><Button variant="ghost" onClick={() => go('login')}>Entrar</Button><Button onClick={() => go('signup')}>Criar conta</Button></>}</div>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menu"><Icon name={open ? 'close' : 'menu'}/></button>
  </div></header>
}
function SearchBar({ onSearch, compact = false, category, onCategoryChange, city, onCityChange }: { onSearch: () => void; compact?: boolean; category:string; onCategoryChange:(value:string)=>void; city:string; onCityChange:(value:string)=>void }) {
  return <div className={`searchbar ${compact ? 'compact' : ''}`}>
    <label className="search-category"><span>Serviço</span><div><Icon name="search"/><CategoryPicker selected={category?[category]:[]} onChange={v=>onCategoryChange(v[0]||'')} placeholder="Qual serviço você precisa?"/></div></label>
    <label><span>Localização</span><div><Icon name="pin"/><CityPicker value={city} onChange={onCityChange} placeholder="Sua cidade"/></div></label>
    <Button onClick={onSearch}><Icon name="search" size={18}/> Encontrar profissionais</Button>
  </div>
}
function Rating({ value = '—', count }: { value?: string; count?: number }) {
  if (count === 0) return <span className="rating"><span>Sem avaliações ainda</span></span>
  return <span className="rating"><Icon name="star" size={16}/><b>{value}</b>{count !== undefined && <span>({count} avaliações)</span>}</span>
}
function ProCard({ pro, open, saved, toggle }: { pro: Pro; open: (slug: string) => void; saved?: boolean; toggle?: () => void }) {
  return <article className="pro-card">
    <div className="pro-photo"><Avatar id={pro.avatarId} name={pro.name}/>{toggle && <button className={saved ? 'favorite saved' : 'favorite'} onClick={toggle} aria-label={saved ? 'Remover dos favoritos' : 'Favoritar'}><Icon name="heart" size={19}/></button>}</div>
    <div className="pro-body"><div className="pro-title"><h3>{pro.name}</h3>{pro.isVerified && <span className="verified"><Icon name="check" size={12}/> Verificado</span>}</div>
      <p className="role">{pro.headline || mainCategory(pro)}</p><p className="location"><Icon name="pin" size={16}/>{[pro.neighborhoods?.[0], pro.city].filter(Boolean).join(' • ')}</p>
      <div className="pro-footer"><Rating value={fmtRating(pro.averageRating)} count={pro.reviewCount}/><Button variant="secondary" onClick={() => open(pro.slug)}>Ver perfil <Icon name="arrow" size={16}/></Button></div>
    </div>
  </article>
}
function Home({ go, open, category, setCategory, city, setCity, favoriteIds, toggleFavorite }: { go: (p: Page) => void; open: (slug: string) => void; category:string; setCategory:(v:string)=>void; city:string; setCity:(v:string)=>void; favoriteIds:string[]; toggleFavorite:(id:string)=>void }) {
  const [featured, setFeatured] = useState<string[]>([])
  const [top, setTop] = useState<Pro[]>([])
  const [loadingTop, setLoadingTop] = useState(true)
  useEffect(() => {
    api('/api/categories').then(r => { if (r.ok && Array.isArray(r.data.categories)) setFeatured(r.data.categories.map((c: { name: string }) => c.name)) })
    api('/api/professionals?limit=12').then(r => {
      if (r.ok && Array.isArray(r.data.data)) setTop([...(r.data.data as Pro[])].sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)).slice(0, 3))
    }).finally(() => setLoadingTop(false))
  }, [])
  const quick = Object.keys(categoryIcons).filter(n => featured.includes(n)).concat(featured.filter(n => !(n in categoryIcons))).slice(0, 8)
  return <>
    <section className="hero"><div className="container hero-grid">
      <div className="hero-copy"><span className="eyebrow"><span>●</span> Profissionais perto de você</span><h1>Precisou de um serviço? <em>Resolve Aqui!</em></h1>
        <p>Encontre profissionais da sua região, compare avaliações e solicite seu orçamento sem complicação.</p><SearchBar category={category} onCategoryChange={setCategory} city={city} onCityChange={setCity} onSearch={() => go('search')}/>
        <div className="trust-row"><span><Icon name="check"/> Avaliações moderadas</span><span><Icon name="check"/> Contato direto</span><span><Icon name="check"/> Sem custo</span></div>
      </div>
      <div className="hero-visual"><div className="orange-shape"/><img src={heroPhoto} alt="Profissional eletricista trabalhando com segurança"/></div>
    </div></section>

    <section className="section categories" id="categorias"><div className="container"><div className="section-head"><div><span className="overline">SERVIÇOS MAIS BUSCADOS</span><h2>O que você precisa resolver?</h2><p>Encontre o profissional certo para cada necessidade.</p></div><button className="text-link" onClick={() => { setCategory(''); go('search') }}>Ver todos os profissionais <Icon name="arrow" size={17}/></button></div>
      <div className="category-grid">{quick.map(name => <button className="category-card" key={name} onClick={() => {setCategory(name);go('search')}}><span>{categoryIcons[name] || '✦'}</span><b>{name}</b><Icon name="chevron" size={16}/></button>)}</div>
    </div></section>

    <section className="section professionals"><div className="container"><div className="section-head"><div><span className="overline">DESTAQUES DA REGIÃO</span><h2>Profissionais em destaque</h2><p>Perfis aprovados e publicados na plataforma.</p></div><Button variant="secondary" onClick={() => { setCategory(''); go('search') }}>Ver todos <Icon name="arrow" size={17}/></Button></div>
      {loadingTop ? <p>Carregando profissionais...</p> : top.length ? <div className="pro-grid">{top.map(p => <ProCard key={p.id} pro={p} open={open} saved={favoriteIds.includes(p.id)} toggle={() => toggleFavorite(p.id)}/>)}</div> : <div className="empty"><h2>Ainda não há profissionais publicados</h2><p>Seja o primeiro a divulgar seus serviços em Foz do Iguaçu.</p><Button onClick={() => go('signup')}>Cadastre-se como profissional</Button></div>}
    </div></section>

    <section className="section how" id="como"><div className="container"><div className="center-head"><span className="overline">SIMPLES, RÁPIDO E SEGURO</span><h2>Como funciona?</h2><p>Do problema resolvido ao profissional ideal em poucos passos.</p></div>
      <div className="steps">{[['search','Encontre um profissional','Busque pelo serviço e localização que você precisa.'],['star','Confira as avaliações','Compare perfis, experiências e opiniões de clientes.'],['whatsapp','Entre em contato','Converse diretamente pelo WhatsApp e peça seu orçamento.']].map((x,i)=><div className="step" key={x[1]}><span className="step-num">0{i+1}</span><div className="step-icon"><Icon name={x[0]} size={28}/></div><h3>{x[1]}</h3><p>{x[2]}</p></div>)}</div>
    </div></section>

    <section className="pro-cta"><div className="container cta-inner"><div><span className="cta-label">PARA PROFISSIONAIS</span><h2>Você trabalha por conta própria?<br/>Encontre novos clientes!</h2><p>Crie seu perfil gratuitamente, mostre seu trabalho e conecte-se com pessoas da sua região.</p><Button onClick={() => go('signup')}>Cadastre-se como profissional <Icon name="arrow" size={18}/></Button></div><div className="cta-stats"><div><b>100%</b><span>gratuito para começar</span></div></div></div></section>
  </>
}
function SearchPage({ go, open, favoriteIds, toggleFavorite, category, setCategory, city, setCity }: { go:(p:Page)=>void; open:(slug:string)=>void; favoriteIds:string[]; toggleFavorite:(id:string)=>void; category:string; setCategory:(v:string)=>void; city:string; setCity:(v:string)=>void }) {
  const [list, setList] = useState<Pro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [minRating, setMinRating] = useState(false)
  const [sort, setSort] = useState<'rating' | 'reviews' | 'recent'>('rating')
  const dCity = useDebounced(city)
  const dNeighborhood = useDebounced(neighborhood)
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError('')
    const params = new URLSearchParams({ limit: '50' })
    if (category) params.set('category', category)
    if (dCity.trim()) params.set('city', dCity.trim())
    if (dNeighborhood.trim()) params.set('neighborhood', dNeighborhood.trim())
    api(`/api/professionals?${params}`).then(r => {
      if (cancelled) return
      if (!r.ok) { setError(r.data?.error?.message || 'Não foi possível buscar profissionais.'); setList([]) }
      else setList(r.data.data || [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [category, dCity, dNeighborhood])
  const shown = list.filter(p => !minRating || (p.averageRating ?? 0) >= 4.5).sort((a, b) =>
    sort === 'rating' ? (b.averageRating ?? 0) - (a.averageRating ?? 0) : sort === 'reviews' ? (b.reviewCount ?? 0) - (a.reviewCount ?? 0) : 0)
  const clear = () => { setCategory(''); setNeighborhood(''); setMinRating(false) }
  return <main className="search-page"><div className="search-top"><div className="container"><SearchBar compact category={category} onCategoryChange={setCategory} city={city} onCityChange={setCity} onSearch={() => {}}/></div></div>
    <div className="container results-layout"><aside className="filters"><div className="filter-title"><h3>Filtros</h3><button onClick={clear}>Limpar</button></div>
      <div className="filter-group"><b>Categoria</b><CategoryPicker selected={category?[category]:[]} onChange={v=>setCategory(v[0]||'')} placeholder="Todas as categorias"/></div>
      <div className="filter-group"><b>Bairro</b><input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} placeholder="Ex.: Centro" style={{border:'1px solid #cbd5e1',borderRadius:8,padding:10}}/></div>
      <div className="filter-group"><b>Avaliação mínima</b><label><input type="checkbox" checked={minRating} onChange={e=>setMinRating(e.target.checked)}/>4,5 ou mais</label></div>
    </aside>
      <section className="results"><div className="results-head"><div><span className="breadcrumb">Início / {category || 'Todos os serviços'}</span><h1>{category || 'Profissionais'} em {city || 'sua região'}</h1><p>{loading ? 'Buscando...' : `${shown.length} profissiona${shown.length === 1 ? 'l encontrado' : 'is encontrados'}`}</p></div><select aria-label="Ordenar" value={sort} onChange={e=>setSort(e.target.value as 'rating'|'reviews'|'recent')}><option value="rating">Melhor avaliados</option><option value="reviews">Mais avaliações</option><option value="recent">Mais recentes</option></select></div>
      {error && <p role="alert" style={{color:'#b91c1c'}}>{error}</p>}
      {!loading && !error && shown.length === 0 ? <div className="empty"><div className="empty-icon"><Icon name="search" size={34}/></div><h2>Nenhum profissional encontrado</h2><p>Ainda não há perfis publicados com esses filtros. Tente ampliar sua busca.</p><Button onClick={clear}>Limpar filtros</Button></div> :
      <div className="result-list">{shown.map(p => { const wa = whatsappUrl(p.whatsapp, p.name); return <div className="result-card" key={p.id}><Avatar id={p.avatarId} name={p.name}/><div className="result-info"><div className="pro-title"><h2>{p.name}</h2>{p.isVerified&&<span className="verified"><Icon name="check" size={12}/> Verificado</span>}</div><p className="role">{p.headline || mainCategory(p)}</p><Rating value={fmtRating(p.averageRating)} count={p.reviewCount}/>{p.description&&<p className="description">{p.description.length > 160 ? p.description.slice(0,160)+'…' : p.description}</p>}<p className="location"><Icon name="pin" size={16}/>{[p.neighborhoods?.slice(0,2).join(', '), p.city].filter(Boolean).join(' • ')}</p></div><div className="result-actions"><button className={favoriteIds.includes(p.id)?'favorite saved':'favorite'} onClick={()=>toggleFavorite(p.id)} aria-label="Favoritar"><Icon name="heart"/></button><Button onClick={()=>open(p.slug)}>Ver perfil</Button>{wa&&<Button variant="whatsapp" onClick={()=>window.open(wa,'_blank')}><Icon name="whatsapp" size={18}/> Chamar no WhatsApp</Button>}</div></div> })}</div>}
    </section></div></main>
}
function Profile({ slug, go, favoriteIds, toggleFavorite, onReview }: { slug:string; go:(p:Page)=>void; favoriteIds:string[]; toggleFavorite:(id:string)=>void; onReview:(p:{id:string;name:string})=>void }) {
  const [p, setP] = useState<(Pro & { services?: { id: string; title: string; description?: string | null; priceFrom?: string | null }[]; reviews?: { id: string; rating: number; comment: string; createdAt: string; author: { name: string } }[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    setLoading(true); setError('')
    api(`/api/professionals/${encodeURIComponent(slug)}`).then(r => {
      if (r.ok) setP(r.data.professional); else setError(r.data?.error?.message || 'Não foi possível carregar o perfil.')
      setLoading(false)
    })
  }, [slug])
  if (loading) return <main className="profile-page"><div className="container"><p>Carregando perfil...</p></div></main>
  if (error || !p) return <main className="profile-page"><div className="container"><div className="empty"><h2>Perfil não encontrado</h2><p>{error || 'Este profissional não está disponível.'}</p><Button onClick={() => go('search')}>Voltar para a busca</Button></div></div></main>
  const wa = whatsappUrl(p.whatsapp, p.name)
  const saved = favoriteIds.includes(p.id)
  return <main className="profile-page"><div className="container"><div className="breadcrumb profile-crumb">Início / {mainCategory(p)} / {p.name}</div>
    <section className="profile-header"><Avatar id={p.avatarId} name={p.name}/><div className="profile-main">{p.isVerified && <span className="verified"><Icon name="check" size={12}/> Perfil verificado</span>}<h1>{p.name}</h1><p className="role">{p.headline || mainCategory(p)}</p><div className="profile-metrics"><Rating value={fmtRating(p.averageRating)} count={p.reviewCount}/>{p.yearsExperience ? <><span>•</span><b>{p.yearsExperience} anos de experiência</b></> : null}</div><p className="location"><Icon name="pin"/>{p.city}{p.state ? `, ${p.state}` : ''}</p></div><div className="profile-actions">{wa && <Button variant="whatsapp" onClick={() => window.open(wa, '_blank')}><Icon name="whatsapp"/> Solicitar orçamento pelo WhatsApp</Button>}<Button variant="secondary" onClick={() => toggleFavorite(p.id)}><Icon name="heart"/>{saved ? 'Salvo nos favoritos' : 'Favoritar profissional'}</Button></div></section>
    <div className="profile-layout"><div className="profile-content">
      {p.description && <section className="content-card"><h2>Sobre o profissional</h2><p>{p.description}</p></section>}
      {!!p.services?.length && <section className="content-card"><h2>Serviços oferecidos</h2><div className="services-list">{p.services.map(x => <span key={x.id}><Icon name="check" size={16}/>{x.title}{x.priceFrom ? ` — a partir de R$ ${Number(x.priceFrom).toFixed(2).replace('.', ',')}` : ''}</span>)}</div></section>}
      {!!p.workImages?.length && <section className="content-card"><div className="section-head compact-head"><h2>Trabalhos realizados</h2></div><div className="gallery">{p.workImages.map(id => <a key={id} href={`/api/images/${id}`} target="_blank" rel="noreferrer"><img src={`/api/images/${id}`} alt={`Trabalho de ${p.name}`} loading="lazy"/></a>)}</div></section>}
      <section className="content-card reviews" id="avaliacoes"><div className="section-head compact-head"><div><h2>Avaliações de clientes</h2><Rating value={fmtRating(p.averageRating)} count={p.reviewCount}/></div><Button variant="secondary" onClick={() => onReview({ id: p.id, name: p.name })}>Avaliar profissional</Button></div>
        {p.reviews?.length ? p.reviews.map(r => <div className="review" key={r.id}><div className="review-avatar">{initials(r.author.name)}</div><div><b>{r.author.name}</b><span className="five-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span><p>{r.comment}</p><small>{new Date(r.createdAt).toLocaleDateString('pt-BR')}</small></div></div>) : <p>Este profissional ainda não possui avaliações publicadas.</p>}
      </section>
    </div><aside className="profile-side"><div className="content-card"><h3>Área de atendimento</h3><p><Icon name="pin" size={17}/> {p.city}{p.state ? `, ${p.state}` : ''}</p>{!!p.neighborhoods?.length && <div className="tags">{p.neighborhoods.map(n => <span key={n}>{n}</span>)}</div>}{!!p.categories.length && <><hr/><h3>Especialidades</h3><div className="tags">{p.categories.map(c => <span key={c.name}>{c.name}</span>)}</div></>}</div></aside></div>
  </div>{wa && <div className="mobile-contact"><Button variant="whatsapp" onClick={() => window.open(wa, '_blank')}><Icon name="whatsapp"/> Solicitar orçamento</Button></div>}</main>
}
function Auth({ signup, go, onLogin }: { signup?: boolean; go:(p:Page)=>void; onLogin:(user:AuthUser)=>void }) {
  const [professional, setProfessional] = useState(false)
  const [professionalCategories,setProfessionalCategories]=useState<string[]>([])
  const [categoryError,setCategoryError]=useState('')
  const [customCategory,setCustomCategory]=useState('')
  const [name,setName]=useState('')
  const [email,setEmail]=useState('')
  const [phone,setPhone]=useState('')
  const [password,setPassword]=useState('')
  const [confirmPassword,setConfirmPassword]=useState('')
  const [city,setCity]=useState('Foz do Iguaçu')
  const [description,setDescription]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)

  const submit=async(e:React.FormEvent)=>{
    e.preventDefault()
    setError('')
    if(signup && password!==confirmPassword){setError('As senhas não coincidem.');return}
    if(signup&&professional&&!professionalCategories.length){setCategoryError('Selecione pelo menos uma categoria de serviço.');return}
    const finalCategories=professionalCategories.map(c=>c==='Outro serviço'&&customCategory.trim()?customCategory.trim():c)
    setCategoryError('')
    setBusy(true)
    try {
      const response=await fetch(signup?'/api/auth/register':'/api/auth/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'same-origin',
        body:JSON.stringify(signup?{
          name,email,phone,password,role:professional?'PROFESSIONAL':'CLIENT',
          categories:professional?finalCategories:[],city,description
        }:{email,password})
      })
      const result=await response.json().catch(()=>({}))
      if(!response.ok){
        setError(result?.error?.message||result?.message||'Não foi possível concluir. Confira os dados e tente novamente.')
        return
      }
      const account=result?.user as AuthUser|undefined
      if(!account||(account.role!=='CLIENT'&&account.role!=='PROFESSIONAL'&&account.role!=='ADMIN')){
        setError('A conta foi processada, mas o servidor não retornou o tipo de usuário. Tente entrar novamente.')
        return
      }
      onLogin(account)
    } catch {
      setError('Não foi possível conectar ao servidor. Confira se o projeto e o banco estão funcionando.')
    } finally {
      setBusy(false)
    }
  }
  return <main className="auth-page"><div className="auth-art"><Logo onClick={()=>go('home')}/><div><span className="overline">BEM-VINDO AO RESOLVE AQUI</span><h1>{professional?'Transforme seu talento em novas oportunidades.':'Tudo o que você precisa, perto de você.'}</h1><p>Conectamos bons profissionais a pessoas que valorizam um serviço bem feito.</p></div></div><div className="auth-panel"><div className="auth-box"><span className="auth-mobile-logo"><Logo onClick={()=>go('home')}/></span><h2>{signup?'Crie sua conta':'Entre na sua conta'}</h2><p>{signup?'Escolha como você quer usar o Resolve Aqui.':'Que bom ter você de volta!'}</p>
    <div className="account-choice"><button type="button" className={!professional?'active':''} onClick={()=>setProfessional(false)}><Icon name="search"/><span><b>Sou cliente</b><small>Quero contratar serviços</small></span></button><button type="button" className={professional?'active':''} onClick={()=>setProfessional(true)}><Icon name="user"/><span><b>Sou profissional</b><small>Quero divulgar meu trabalho</small></span></button></div>
    <form onSubmit={submit}>{signup&&<label>Nome completo<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome completo" autoComplete="name"/></label>}<label>E-mail<input required type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email"/></label>{signup&&<label>Telefone<input value={phone} onChange={e=>setPhone(e.target.value)} maxLength={30} placeholder="(45) 99999-9999" autoComplete="tel"/></label>}<label>Senha<input required type="password" minLength={signup?8:1} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} placeholder={signup?'Mínimo de 8 caracteres':'Sua senha'} autoComplete={signup?'new-password':'current-password'}/></label>{signup&&<label>Confirmar senha<input required type="password" minLength={8} maxLength={72} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Digite a senha novamente" autoComplete="new-password"/></label>}{signup&&professional&&<><label>Categoria principal e especialidades<CategoryPicker multiple selected={professionalCategories} onChange={items=>{setProfessionalCategories(items);setCategoryError('')}} error={categoryError} placeholder="Pesquise e selecione suas categorias"/></label>{professionalCategories.includes('Outro serviço')&&<label>Especialidade personalizada<input value={customCategory} onChange={e=>setCustomCategory(e.target.value)} placeholder="Ex.: Instalação de painéis solares"/></label>}<label>Cidade<CityPicker value={city} onChange={setCity} required/></label><label>Breve descrição<textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={2000} placeholder="Conte um pouco sobre sua experiência"/></label></>}
      {signup?<label className="terms"><input type="checkbox" required/>Aceito os Termos de Uso e a Política de Privacidade.</label>:<div className="forgot"><label className="terms"><input type="checkbox"/>Lembrar de mim</label><button type="button" onClick={()=>setError('A recuperação de senha ainda não está disponível. Entre em contato com o suporte.')}>Esqueci minha senha</button></div>}
      {error&&<p role="alert" style={{color:'#b91c1c',background:'#fef2f2',padding:12,borderRadius:8,fontSize:13}}>{error}</p>}
      <Button className="full">{busy?'Aguarde...':signup?(professional?'Criar perfil profissional':'Criar conta de cliente'):'Entrar'}</Button></form>
    <p className="auth-switch">{signup?'Já possui uma conta?':'Ainda não tem cadastro?'} <button type="button" onClick={()=>go(signup?'login':'signup')}>{signup?'Entrar':'Criar conta'}</button></p>
  </div></div></main>
}

function AccessDialog({ kind, go, close }: { kind:'favorite'|'review'; go:(p:Page)=>void; close:()=>void }) {
  return <div className="dialog-backdrop" onClick={close}><section className="access-dialog" onClick={e=>e.stopPropagation()}><button className="dialog-close" onClick={close}><Icon name="close"/></button><div className="dialog-icon"><Icon name={kind==='favorite'?'heart':'star'} size={28}/></div><h2>{kind==='favorite'?'Salve seus profissionais favoritos':'Entre para avaliar este profissional'}</h2><p>{kind==='favorite'?'Entre na sua conta para salvar seus profissionais favoritos.':'As avaliações são vinculadas à sua conta e a um serviço realizado, garantindo mais confiança para todos.'}</p><div><Button onClick={()=>go('login')}>Entrar</Button><Button variant="secondary" onClick={()=>go('signup')}>Criar conta</Button></div></section></div>
}

function ReviewDialog({ target, close }: { target:{id:string;name:string}; close:()=>void }) {
  const [sent,setSent]=useState(false)
  const [rating,setRating]=useState(0)
  const [comment,setComment]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const submit=async()=>{
    if(!rating){setError('Escolha uma nota de 1 a 5 estrelas.');return}
    if(comment.trim().length<5){setError('Escreva um comentário com pelo menos 5 caracteres.');return}
    setBusy(true);setError('')
    const r=await api('/api/account/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({professionalId:target.id,rating,comment})})
    setBusy(false)
    if(!r.ok){setError(r.data?.error?.message||'Não foi possível enviar a avaliação.');return}
    setSent(true)
  }
  return <div className="dialog-backdrop" onClick={close}><section className="access-dialog review-dialog" onClick={e=>e.stopPropagation()}><button className="dialog-close" onClick={close}><Icon name="close"/></button>{sent?<><div className="dialog-icon success"><Icon name="check" size={28}/></div><h2>Avaliação enviada!</h2><p>Obrigado! Sua avaliação será publicada após a análise da nossa equipe.</p><Button onClick={close}>Concluir</Button></>:<><span className="overline">AVALIAR PROFISSIONAL</span><h2>Como foi o serviço de {target.name.split(' ')[0]}?</h2><div className="review-stars">{[1,2,3,4,5].map(x=><button key={x} type="button" onClick={()=>setRating(x)} aria-label={`${x} estrelas`}>{x<=rating?'★':'☆'}</button>)}</div><label className="review-comment">Seu comentário<textarea value={comment} onChange={e=>setComment(e.target.value)} maxLength={2000} placeholder="Conte como foi sua experiência, a qualidade e o atendimento..."/></label>{error&&<p role="alert" style={{color:'#b91c1c',fontSize:13}}>{error}</p>}<Button className="full" disabled={busy} onClick={submit}>{busy?'Enviando...':'Enviar avaliação'}</Button></>}</section></div>
}
function Dashboard({ go, user, logout, open }: { go:(p:Page)=>void; user:AuthUser; logout:()=>void; open:(slug:string)=>void }) {
  type Tab = 'profile' | 'photos' | 'reviews'
  type MyReview = { id: string; rating: number; comment: string; createdAt: string; author: { name: string } }
  const [tab,setTab]=useState<Tab>('profile')
  const [profile,setProfile]=useState<{slug:string;isPublished:boolean;isVerified:boolean}|null>(null)
  const [counts,setCounts]=useState<{published:number;pending:number;average:number|null}>({published:0,pending:0,average:null})
  const [myReviews,setMyReviews]=useState<MyReview[]>([])
  const [avatarId,setAvatarId]=useState<string|null>(null)
  const [workImages,setWorkImages]=useState<string[]>([])
  const [headline,setHeadline]=useState('')
  const [description,setDescription]=useState('')
  const [whatsapp,setWhatsapp]=useState('')
  const [city,setCity]=useState('')
  const [neighborhoods,setNeighborhoods]=useState('')
  const [years,setYears]=useState('')
  const [specialties,setSpecialties]=useState<string[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [uploading,setUploading]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')

  const load=async(initial:boolean)=>{
    const r=await api('/api/account/professional')
    if(!r.ok){setError(r.data?.error?.message||'Não foi possível carregar seu perfil.');setLoading(false);return}
    const p=r.data.profile
    setProfile({slug:p.slug,isPublished:p.isPublished,isVerified:p.isVerified})
    setCounts(r.data.reviews);setMyReviews(r.data.reviewList||[])
    setAvatarId(p.avatarId);setWorkImages(p.workImages||[])
    if(initial){
      setHeadline(p.headline||'');setDescription(p.description||'');setWhatsapp(p.whatsapp||'');setCity(p.city||'')
      setNeighborhoods((p.neighborhoods||[]).join(', '));setYears(p.yearsExperience!=null?String(p.yearsExperience):'');setSpecialties(p.categories||[])
    }
    setLoading(false)
  }
  useEffect(()=>{void load(true)},[])

  const filled=[headline,description,whatsapp,neighborhoods,years,specialties.length?'x':'',avatarId?'x':'',workImages.length?'x':''].filter(v=>String(v).trim()).length
  const completion=Math.round((filled/8)*100)

  const save=async(e:React.FormEvent)=>{
    e.preventDefault();setBusy(true);setMessage('');setError('')
    const r=await api('/api/account/professional',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      headline,description,whatsapp,city,
      neighborhoods:neighborhoods.split(',').map(x=>x.trim()).filter(Boolean),
      yearsExperience:years.trim()===''?null:Number(years),
      ...(specialties.length?{categories:specialties}:{}),
    })})
    setBusy(false)
    if(!r.ok){setError(r.data?.error?.message||'Não foi possível salvar.');return}
    setMessage('Perfil salvo com sucesso.')
  }

  const send=async(files:FileList|null,kind:'AVATAR'|'WORK')=>{
    if(!files||!files.length)return
    setUploading(true);setMessage('');setError('')
    for(const file of Array.from(files)){
      const result=await uploadImage(file,kind)
      if(!result.ok){setError(result.message);break}
    }
    await load(false)
    setUploading(false)
  }
  const removeWork=async(id:string)=>{
    if(!window.confirm('Remover esta foto?'))return
    const r=await api(`/api/account/professional/images/${encodeURIComponent(id)}`,{method:'DELETE'})
    if(!r.ok){setError(r.data?.error?.message||'Não foi possível remover a foto.');return}
    await load(false)
  }

  const field:React.CSSProperties={display:'block',width:'100%',border:'1px solid #cbd5e1',borderRadius:8,padding:11,marginTop:6,font:'inherit'}
  const today=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})
  const stars=(n:number)=>'★'.repeat(n)+'☆'.repeat(5-n)
  const navItems:[Tab,string,string][]=[['profile','◉','Meu perfil'],['photos','▧','Fotos e portfólio'],['reviews','★',`Avaliações recebidas${counts.published?` (${counts.published})`:''}`]]
  return <main className="dashboard"><aside className="dash-nav"><Logo onClick={()=>go('home')}/><nav>{navItems.map(([id,icon,label])=><button key={id} className={tab===id?'active':''} onClick={()=>{setTab(id);setMessage('');setError('')}}><span>{icon}</span>{label}</button>)}{profile?.isPublished&&<button onClick={()=>open(profile.slug)}><span>▦</span>Ver perfil público</button>}</nav><button className="dash-exit" onClick={logout}>Sair da conta</button></aside><section className="dash-content"><div className="dash-head"><div><p style={{textTransform:'capitalize'}}>{today}</p><h1>Olá, {user.name.split(' ')[0]}!</h1><span>Complete seu perfil para aparecer nas buscas.</span></div><div className="dash-user">{avatarId?<img src={`/api/images/${avatarId}`} alt={user.name}/>:<div className="avatar-mini">{initials(user.name)}</div>}<b>{user.name}</b></div></div>
    {loading?<p>Carregando...</p>:!profile?<p role="alert" style={{color:'#b91c1c'}}>{error}</p>:<>
    <div className="completion"><div><span>{profile.isPublished?'Seu perfil está publicado no site':'Seu perfil está aguardando a aprovação do administrador'}</span><b>{completion}%</b></div><div className="progress"><i style={{width:`${completion}%`}}/></div><p>{profile.isPublished?'Perfis completos, com foto e trabalhos, recebem mais contatos.':'Preencha os dados e adicione fotos. Depois o administrador revisa e publica seu perfil.'}</p></div>
    <div className="stats">{[['Avaliações publicadas',String(counts.published)],['Nota média',counts.average!=null?counts.average.toFixed(1).replace('.',','):'—'],['Situação',profile.isPublished?(profile.isVerified?'Publicado e verificado':'Publicado'):'Não publicado']].map(x=><article key={x[0]}><span>{x[0]}</span><h2 style={x[0]==='Situação'?{fontSize:18}:undefined}>{x[1]}</h2></article>)}</div>
    {message&&<p role="status" style={{color:'#166534',fontSize:13,marginTop:14}}>{message}</p>}{error&&<p role="alert" style={{color:'#b91c1c',fontSize:13,marginTop:14}}>{error}</p>}

    {tab==='profile'&&<form className="dash-card" onSubmit={save} style={{marginTop:18,display:'grid',gap:14}}><h2>Dados do perfil</h2>
      <label>Título profissional<input style={field} maxLength={120} value={headline} onChange={e=>setHeadline(e.target.value)} placeholder="Ex.: Eletricista residencial e comercial"/></label>
      <label>Sobre você<textarea style={{...field,minHeight:110}} maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Conte sobre sua experiência e serviços"/></label>
      <label>WhatsApp (com DDD)<input style={field} maxLength={30} value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="45999999999"/></label>
      <label>Cidade<CityPicker value={city} onChange={setCity} required/></label>
      <label>Bairros atendidos (separe por vírgula)<input style={field} value={neighborhoods} onChange={e=>setNeighborhoods(e.target.value)} placeholder="Centro, Vila A, Porto Meira"/></label>
      <label>Anos de experiência<input style={field} type="number" min={0} max={80} value={years} onChange={e=>setYears(e.target.value)}/></label>
      <div><b style={{fontSize:14}}>Categorias e especialidades</b><CategoryPicker multiple selected={specialties} onChange={setSpecialties} placeholder="Adicionar categoria"/></div>
      <Button type="submit" disabled={busy}>{busy?'Salvando...':'Salvar perfil'}</Button></form>}

    {tab==='photos'&&<div style={{display:'grid',gap:18,marginTop:18}}>
      <section className="dash-card"><h2>Foto de perfil</h2><p>Use uma foto sua ou da sua marca. Ela aparece nas buscas e no seu perfil.</p>
        <div className="avatar-edit"><div className="avatar-edit-preview"><Avatar id={avatarId} name={user.name}/></div>
          <div><label className="btn btn-secondary" style={{cursor:'pointer'}}>{uploading?'Enviando...':avatarId?'Trocar foto':'Escolher foto'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={e=>{void send(e.target.files,'AVATAR');e.target.value=''}}/></label><small style={{display:'block',marginTop:8,color:'#64748b'}}>JPG, PNG ou WebP. A imagem é reduzida automaticamente.</small></div></div></section>
      <section className="dash-card"><h2>Fotos dos trabalhos ({workImages.length}/12)</h2><p>Mostre serviços que você já realizou. Elas aparecem na galeria do seu perfil público.</p>
        <div className="photo-grid">{workImages.map(id=><div className="photo-item" key={id}><img src={`/api/images/${id}`} alt="Foto de trabalho" loading="lazy"/><button type="button" onClick={()=>removeWork(id)} aria-label="Remover foto">×</button></div>)}{workImages.length<12&&<label className="photo-add">{uploading?'Enviando...':'+ Adicionar fotos'}<input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={uploading} onChange={e=>{void send(e.target.files,'WORK');e.target.value=''}}/></label>}</div></section>
    </div>}

    {tab==='reviews'&&<section className="dash-card" style={{marginTop:18}}><h2>Avaliações recebidas</h2><p>{counts.pending>0?`${counts.pending} avaliação(ões) aguardando análise do administrador. `:''}Somente avaliações publicadas aparecem aqui e no seu perfil.</p>
      {myReviews.length?myReviews.map(r=><div className="review" key={r.id}><div className="review-avatar">{initials(r.author.name)}</div><div><b>{r.author.name}</b><span className="five-stars" style={{color:'#f59e0b'}}>{stars(r.rating)}</span><p>{r.comment}</p><small>{new Date(r.createdAt).toLocaleDateString('pt-BR')}</small></div></div>):<p style={{marginTop:16}}>Você ainda não recebeu avaliações publicadas.</p>}</section>}
    </>}
  </section></main>
}
function Favorites({ go, open, user, favoriteIds, toggleFavorite }: { go:(p:Page)=>void; open:(slug:string)=>void; user:AuthUser|null; favoriteIds:string[]; toggleFavorite:(id:string)=>void }) {
  const [list,setList]=useState<Pro[]>([])
  const [loading,setLoading]=useState(true)
  const key=favoriteIds.join(',')
  useEffect(()=>{
    if(!user){setLoading(false);return}
    api('/api/account/favorites').then(r=>{
      setList(r.ok?(r.data.favorites||[]).map((f:{professional:Pro})=>f.professional):[])
      setLoading(false)
    })
  },[user,key])
  return <main className="simple-page"><div className="container"><span className="overline">SUA SELEÇÃO</span><h1>Profissionais favoritos</h1><p>Seus profissionais de confiança, sempre à mão.</p><div className="pro-grid favorite-grid">{loading?<p>Carregando...</p>:list.length?list.map(p=><ProCard key={p.id} pro={p} open={open} saved toggle={()=>toggleFavorite(p.id)}/>):<div className="empty"><h2>Nenhum favorito ainda</h2><p>Salve profissionais para encontrá-los rapidamente depois.</p><Button onClick={()=>go('search')}>Encontrar profissionais</Button></div>}</div></div></main>
}
function Footer({ go }: { go:(p:Page)=>void }) {
  return <footer><div className="container footer-grid"><div><Logo onClick={()=>go('home')}/><p>Serviços de confiança, perto de você.</p></div><div><b>Resolve Aqui</b><button>Sobre nós</button><button>Como funciona</button><button>Ajuda</button></div><div><b>Legal</b><button>Termos de uso</button><button>Privacidade</button><button>Contato</button></div><div><b>Atendimento</b><p>Foz do Iguaçu, Paraná</p><p>contato@resolveaqui.com.br</p></div></div><div className="container copyright">© {new Date().getFullYear()} Resolve Aqui. Todos os direitos reservados. <span>Feito para conectar pessoas.</span></div></footer>
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('Foz do Iguaçu')
  const [slug, setSlug] = useState('')
  const [dialog, setDialog] = useState<'favorite'|'review'|null>(null)
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string } | null>(null)
  const [notice, setNotice] = useState('')

  const go = (p:Page) => { setPage(p); setDialog(null); window.scrollTo({top:0, behavior:'smooth'}) }
  const open = (s:string) => { setSlug(s); go('profile') }
  const loadFavorites = async () => {
    const r = await api('/api/account/favorites')
    setFavoriteIds(r.ok ? (r.data.favorites || []).map((f: { professional: { id: string } }) => f.professional.id) : [])
  }

  // Restaura a sessão (cookie) ao abrir/atualizar a página
  useEffect(() => {
    api('/api/auth/me').then(async r => {
      if (r.ok && r.data.user) { setUser(r.data.user); await loadFavorites() }
    }).finally(() => setReady(true))
  }, [])

  // Painel do profissional exige login
  useEffect(() => { if (ready && !user && page === 'dashboard') go('login') }, [ready, user, page])

  const login = (account: AuthUser) => {
    setUser(account)
    void loadFavorites()
    if (account.role === 'ADMIN') { window.location.href = '/admin'; return }
    go(account.role === 'PROFESSIONAL' ? 'dashboard' : 'home')
  }
  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null); setFavoriteIds([]); go('home')
  }
  const toggleFavorite = async (id: string) => {
    if (!user) { setDialog('favorite'); return }
    const isSaved = favoriteIds.includes(id)
    const r = await api(`/api/account/favorites/${encodeURIComponent(id)}`, { method: isSaved ? 'DELETE' : 'PUT' })
    if (!r.ok) { setNotice(r.data?.error?.message || 'Não foi possível atualizar seus favoritos.'); return }
    setFavoriteIds(isSaved ? favoriteIds.filter(x => x !== id) : [...favoriteIds, id])
  }
  const review = (target: { id: string; name: string }) => user ? setReviewTarget(target) : setDialog('review')

  const full = page === 'login' || page === 'signup' || page === 'dashboard'
  return <div>{!full&&<Header go={go} user={user} logout={logout}/>}
    {page==='home'&&<Home go={go} open={open} category={category} setCategory={setCategory} city={city} setCity={setCity} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite}/>}
    {page==='search'&&<SearchPage go={go} open={open} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} category={category} setCategory={setCategory} city={city} setCity={setCity}/>}
    {page==='profile'&&<Profile slug={slug} go={go} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite} onReview={review}/>}
    {page==='login'&&<Auth go={go} onLogin={login}/>}
    {page==='signup'&&<Auth signup go={go} onLogin={login}/>}
    {page==='dashboard'&&user&&<Dashboard go={go} user={user} logout={logout} open={open}/>}
    {page==='favorites'&&<Favorites go={go} open={open} user={user} favoriteIds={favoriteIds} toggleFavorite={toggleFavorite}/>}
    {!full&&<><button className="favorites-fab" onClick={()=>user?go('favorites'):setDialog('favorite')} aria-label="Meus favoritos"><Icon name="heart"/>{favoriteIds.length>0&&<i/>}</button><Footer go={go}/></>}
    {dialog&&<AccessDialog kind={dialog} go={go} close={()=>setDialog(null)}/>}
    {reviewTarget&&<ReviewDialog target={reviewTarget} close={()=>setReviewTarget(null)}/>}
    {notice&&<div role="status" className="toast" onClick={()=>setNotice('')}>{notice}</div>}
  </div>
}
