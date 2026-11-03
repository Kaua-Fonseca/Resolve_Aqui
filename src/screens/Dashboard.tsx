'use client'

import { useEffect, useState } from 'react'
import { CategoryPicker } from '@/components/search/CategoryPicker'
import { CityPicker } from '@/components/search/CityPicker'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { api, uploadImage } from '@/lib/api'
import { initials } from '@/lib/format'
import type { AuthUser, Page } from '@/types'

export function Dashboard({
  go,
  user,
  logout,
  open,
}: {
  go: (p: Page) => void
  user: AuthUser
  logout: () => void
  open: (slug: string) => void
}) {
  type Tab = 'profile' | 'photos' | 'reviews'
  type MyReview = { id: string; rating: number; comment: string; createdAt: string; author: { name: string } }
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<{ slug: string; isPublished: boolean; isVerified: boolean } | null>(
    null,
  )
  const [counts, setCounts] = useState<{ published: number; pending: number; average: number | null }>({
    published: 0,
    pending: 0,
    average: null,
  })
  const [myReviews, setMyReviews] = useState<MyReview[]>([])
  const [avatarId, setAvatarId] = useState<string | null>(null)
  const [workImages, setWorkImages] = useState<string[]>([])
  const [headline, setHeadline] = useState('')
  const [description, setDescription] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [city, setCity] = useState('')
  const [neighborhoods, setNeighborhoods] = useState('')
  const [years, setYears] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async (initial: boolean) => {
    const r = await api('/api/account/professional')
    if (!r.ok) {
      setError(r.data?.error?.message || 'Não foi possível carregar seu perfil.')
      setLoading(false)
      return
    }
    const p = r.data.profile
    setProfile({ slug: p.slug, isPublished: p.isPublished, isVerified: p.isVerified })
    setCounts(r.data.reviews)
    setMyReviews(r.data.reviewList || [])
    setAvatarId(p.avatarId)
    setWorkImages(p.workImages || [])
    if (initial) {
      setHeadline(p.headline || '')
      setDescription(p.description || '')
      setWhatsapp(p.whatsapp || '')
      setCity(p.city || '')
      setNeighborhoods((p.neighborhoods || []).join(', '))
      setYears(p.yearsExperience != null ? String(p.yearsExperience) : '')
      setSpecialties(p.categories || [])
    }
    setLoading(false)
  }
  useEffect(() => {
    void load(true)
  }, [])

  const filled = [
    headline,
    description,
    whatsapp,
    neighborhoods,
    years,
    specialties.length ? 'x' : '',
    avatarId ? 'x' : '',
    workImages.length ? 'x' : '',
  ].filter((v) => String(v).trim()).length
  const completion = Math.round((filled / 8) * 100)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    setError('')
    const r = await api('/api/account/professional', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline,
        description,
        whatsapp,
        city,
        neighborhoods: neighborhoods
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        yearsExperience: years.trim() === '' ? null : Number(years),
        ...(specialties.length ? { categories: specialties } : {}),
      }),
    })
    setBusy(false)
    if (!r.ok) {
      setError(r.data?.error?.message || 'Não foi possível salvar.')
      return
    }
    setMessage('Perfil salvo com sucesso.')
  }

  const send = async (files: FileList | null, kind: 'AVATAR' | 'WORK') => {
    if (!files || !files.length) return
    setUploading(true)
    setMessage('')
    setError('')
    for (const file of Array.from(files)) {
      const result = await uploadImage(file, kind)
      if (!result.ok) {
        setError(result.message)
        break
      }
    }
    await load(false)
    setUploading(false)
  }
  const removeWork = async (id: string) => {
    if (!window.confirm('Remover esta foto?')) return
    const r = await api(`/api/account/professional/images/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!r.ok) {
      setError(r.data?.error?.message || 'Não foi possível remover a foto.')
      return
    }
    await load(false)
  }

  const field: React.CSSProperties = {
    display: 'block',
    width: '100%',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    padding: 11,
    marginTop: 6,
    font: 'inherit',
  }
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)
  const navItems: [Tab, string, string][] = [
    ['profile', '◉', 'Meu perfil'],
    ['photos', '▧', 'Fotos e portfólio'],
    ['reviews', '★', `Avaliações recebidas${counts.published ? ` (${counts.published})` : ''}`],
  ]
  return (
    <main className="dashboard">
      <aside className="dash-nav">
        <Logo onClick={() => go('home')} />
        <nav>
          {navItems.map(([id, icon, label]) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => {
                setTab(id)
                setMessage('')
                setError('')
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
          {profile?.isPublished && (
            <button onClick={() => open(profile.slug)}>
              <span>▦</span>Ver perfil público
            </button>
          )}
        </nav>
        <button className="dash-exit" onClick={logout}>
          Sair da conta
        </button>
      </aside>
      <section className="dash-content">
        <div className="dash-head">
          <div>
            <p style={{ textTransform: 'capitalize' }}>{today}</p>
            <h1>Olá, {user.name.split(' ')[0]}!</h1>
            <span>Complete seu perfil para aparecer nas buscas.</span>
          </div>
          <div className="dash-user">
            {avatarId ? (
              <img src={`/api/images/${avatarId}`} alt={user.name} />
            ) : (
              <div className="avatar-mini">{initials(user.name)}</div>
            )}
            <b>{user.name}</b>
          </div>
        </div>
        {loading ? (
          <p>Carregando...</p>
        ) : !profile ? (
          <p role="alert" style={{ color: '#b91c1c' }}>
            {error}
          </p>
        ) : (
          <>
            <div className="completion">
              <div>
                <span>
                  {profile.isPublished
                    ? 'Seu perfil está publicado no site'
                    : 'Seu perfil está aguardando a aprovação do administrador'}
                </span>
                <b>{completion}%</b>
              </div>
              <div className="progress">
                <i style={{ width: `${completion}%` }} />
              </div>
              <p>
                {profile.isPublished
                  ? 'Perfis completos, com foto e trabalhos, recebem mais contatos.'
                  : 'Preencha os dados e adicione fotos. Depois o administrador revisa e publica seu perfil.'}
              </p>
            </div>
            <div className="stats">
              {[
                ['Avaliações publicadas', String(counts.published)],
                ['Nota média', counts.average != null ? counts.average.toFixed(1).replace('.', ',') : '—'],
                [
                  'Situação',
                  profile.isPublished
                    ? profile.isVerified
                      ? 'Publicado e verificado'
                      : 'Publicado'
                    : 'Não publicado',
                ],
              ].map((x) => (
                <article key={x[0]}>
                  <span>{x[0]}</span>
                  <h2 style={x[0] === 'Situação' ? { fontSize: 18 } : undefined}>{x[1]}</h2>
                </article>
              ))}
            </div>
            {message && (
              <p role="status" style={{ color: '#166534', fontSize: 13, marginTop: 14 }}>
                {message}
              </p>
            )}
            {error && (
              <p role="alert" style={{ color: '#b91c1c', fontSize: 13, marginTop: 14 }}>
                {error}
              </p>
            )}

            {tab === 'profile' && (
              <form className="dash-card" onSubmit={save} style={{ marginTop: 18, display: 'grid', gap: 14 }}>
                <h2>Dados do perfil</h2>
                <label>
                  Título profissional
                  <input
                    style={field}
                    maxLength={120}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Ex.: Eletricista residencial e comercial"
                  />
                </label>
                <label>
                  Sobre você
                  <textarea
                    style={{ ...field, minHeight: 110 }}
                    maxLength={2000}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Conte sobre sua experiência e serviços"
                  />
                </label>
                <label>
                  WhatsApp (com DDD)
                  <input
                    style={field}
                    maxLength={30}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="45999999999"
                  />
                </label>
                <label>
                  Cidade
                  <CityPicker value={city} onChange={setCity} required />
                </label>
                <label>
                  Bairros atendidos (separe por vírgula)
                  <input
                    style={field}
                    value={neighborhoods}
                    onChange={(e) => setNeighborhoods(e.target.value)}
                    placeholder="Centro, Vila A, Porto Meira"
                  />
                </label>
                <label>
                  Anos de experiência
                  <input
                    style={field}
                    type="number"
                    min={0}
                    max={80}
                    value={years}
                    onChange={(e) => setYears(e.target.value)}
                  />
                </label>
                <div>
                  <b style={{ fontSize: 14 }}>Categorias e especialidades</b>
                  <CategoryPicker
                    multiple
                    selected={specialties}
                    onChange={setSpecialties}
                    placeholder="Adicionar categoria"
                  />
                </div>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Salvando...' : 'Salvar perfil'}
                </Button>
              </form>
            )}

            {tab === 'photos' && (
              <div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
                <section className="dash-card">
                  <h2>Foto de perfil</h2>
                  <p>Use uma foto sua ou da sua marca. Ela aparece nas buscas e no seu perfil.</p>
                  <div className="avatar-edit">
                    <div className="avatar-edit-preview">
                      <Avatar id={avatarId} name={user.name} />
                    </div>
                    <div>
                      <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                        {uploading ? 'Enviando...' : avatarId ? 'Trocar foto' : 'Escolher foto'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          hidden
                          disabled={uploading}
                          onChange={(e) => {
                            void send(e.target.files, 'AVATAR')
                            e.target.value = ''
                          }}
                        />
                      </label>
                      <small style={{ display: 'block', marginTop: 8, color: '#64748b' }}>
                        JPG, PNG ou WebP. A imagem é reduzida automaticamente.
                      </small>
                    </div>
                  </div>
                </section>
                <section className="dash-card">
                  <h2>Fotos dos trabalhos ({workImages.length}/12)</h2>
                  <p>Mostre serviços que você já realizou. Elas aparecem na galeria do seu perfil público.</p>
                  <div className="photo-grid">
                    {workImages.map((id) => (
                      <div className="photo-item" key={id}>
                        <img src={`/api/images/${id}`} alt="Foto de trabalho" loading="lazy" />
                        <button type="button" onClick={() => removeWork(id)} aria-label="Remover foto">
                          ×
                        </button>
                      </div>
                    ))}
                    {workImages.length < 12 && (
                      <label className="photo-add">
                        {uploading ? 'Enviando...' : '+ Adicionar fotos'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          hidden
                          disabled={uploading}
                          onChange={(e) => {
                            void send(e.target.files, 'WORK')
                            e.target.value = ''
                          }}
                        />
                      </label>
                    )}
                  </div>
                </section>
              </div>
            )}

            {tab === 'reviews' && (
              <section className="dash-card" style={{ marginTop: 18 }}>
                <h2>Avaliações recebidas</h2>
                <p>
                  {counts.pending > 0
                    ? `${counts.pending} avaliação(ões) aguardando análise do administrador. `
                    : ''}
                  Somente avaliações publicadas aparecem aqui e no seu perfil.
                </p>
                {myReviews.length ? (
                  myReviews.map((r) => (
                    <div className="review" key={r.id}>
                      <div className="review-avatar">{initials(r.author.name)}</div>
                      <div>
                        <b>{r.author.name}</b>
                        <span className="five-stars" style={{ color: '#f59e0b' }}>
                          {stars(r.rating)}
                        </span>
                        <p>{r.comment}</p>
                        <small>{new Date(r.createdAt).toLocaleDateString('pt-BR')}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ marginTop: 16 }}>Você ainda não recebeu avaliações publicadas.</p>
                )}
              </section>
            )}
          </>
        )}
      </section>
    </main>
  )
}
