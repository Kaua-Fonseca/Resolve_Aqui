'use client'

import { useEffect, useState } from 'react'
import { CategoryPicker } from '@/components/search/CategoryPicker'
import { SearchBar } from '@/components/search/SearchBar'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Rating } from '@/components/ui/Rating'
import { useDebounced } from '@/hooks/useDebounced'
import { api } from '@/lib/api'
import { fmtRating, mainCategory, whatsappUrl } from '@/lib/format'
import type { Page, Pro } from '@/types'

export function SearchPage({
  go,
  open,
  favoriteIds,
  toggleFavorite,
  category,
  setCategory,
  city,
  setCity,
}: {
  go: (p: Page) => void
  open: (slug: string) => void
  favoriteIds: string[]
  toggleFavorite: (id: string) => void
  category: string
  setCategory: (v: string) => void
  city: string
  setCity: (v: string) => void
}) {
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
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ limit: '50' })
    if (category) params.set('category', category)
    if (dCity.trim()) params.set('city', dCity.trim())
    if (dNeighborhood.trim()) params.set('neighborhood', dNeighborhood.trim())
    api(`/api/professionals?${params}`).then((r) => {
      if (cancelled) return
      if (!r.ok) {
        setError(r.data?.error?.message || 'Não foi possível buscar profissionais.')
        setList([])
      } else setList(r.data.data || [])
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [category, dCity, dNeighborhood])
  const shown = list
    .filter((p) => !minRating || (p.averageRating ?? 0) >= 4.5)
    .sort((a, b) =>
      sort === 'rating'
        ? (b.averageRating ?? 0) - (a.averageRating ?? 0)
        : sort === 'reviews'
          ? (b.reviewCount ?? 0) - (a.reviewCount ?? 0)
          : 0,
    )
  const clear = () => {
    setCategory('')
    setNeighborhood('')
    setMinRating(false)
  }
  return (
    <main className="search-page">
      <div className="search-top">
        <div className="container">
          <SearchBar
            compact
            category={category}
            onCategoryChange={setCategory}
            city={city}
            onCityChange={setCity}
            onSearch={() => {}}
          />
        </div>
      </div>
      <div className="container results-layout">
        <aside className="filters">
          <div className="filter-title">
            <h3>Filtros</h3>
            <button onClick={clear}>Limpar</button>
          </div>
          <div className="filter-group">
            <b>Categoria</b>
            <CategoryPicker
              selected={category ? [category] : []}
              onChange={(v) => setCategory(v[0] || '')}
              placeholder="Todas as categorias"
            />
          </div>
          <div className="filter-group">
            <b>Bairro</b>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="Ex.: Centro"
              style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 10 }}
            />
          </div>
          <div className="filter-group">
            <b>Avaliação mínima</b>
            <label>
              <input type="checkbox" checked={minRating} onChange={(e) => setMinRating(e.target.checked)} />
              4,5 ou mais
            </label>
          </div>
        </aside>
        <section className="results">
          <div className="results-head">
            <div>
              <span className="breadcrumb">Início / {category || 'Todos os serviços'}</span>
              <h1>
                {category || 'Profissionais'} em {city || 'sua região'}
              </h1>
              <p>
                {loading
                  ? 'Buscando...'
                  : `${shown.length} profissiona${shown.length === 1 ? 'l encontrado' : 'is encontrados'}`}
              </p>
            </div>
            <select
              aria-label="Ordenar"
              value={sort}
              onChange={(e) => setSort(e.target.value as 'rating' | 'reviews' | 'recent')}
            >
              <option value="rating">Melhor avaliados</option>
              <option value="reviews">Mais avaliações</option>
              <option value="recent">Mais recentes</option>
            </select>
          </div>
          {error && (
            <p role="alert" style={{ color: '#b91c1c' }}>
              {error}
            </p>
          )}
          {!loading && !error && shown.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">
                <Icon name="search" size={34} />
              </div>
              <h2>Nenhum profissional encontrado</h2>
              <p>Ainda não há perfis publicados com esses filtros. Tente ampliar sua busca.</p>
              <Button onClick={clear}>Limpar filtros</Button>
            </div>
          ) : (
            <div className="result-list">
              {shown.map((p) => {
                const wa = whatsappUrl(p.whatsapp, p.name)
                return (
                  <div className="result-card" key={p.id}>
                    <Avatar id={p.avatarId} name={p.name} />
                    <div className="result-info">
                      <div className="pro-title">
                        <h2>{p.name}</h2>
                        {p.isVerified && (
                          <span className="verified">
                            <Icon name="check" size={12} /> Verificado
                          </span>
                        )}
                      </div>
                      <p className="role">{p.headline || mainCategory(p)}</p>
                      <Rating value={fmtRating(p.averageRating)} count={p.reviewCount} />
                      {p.description && (
                        <p className="description">
                          {p.description.length > 160 ? p.description.slice(0, 160) + '…' : p.description}
                        </p>
                      )}
                      <p className="location">
                        <Icon name="pin" size={16} />
                        {[p.neighborhoods?.slice(0, 2).join(', '), p.city].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                    <div className="result-actions">
                      <button
                        className={favoriteIds.includes(p.id) ? 'favorite saved' : 'favorite'}
                        onClick={() => toggleFavorite(p.id)}
                        aria-label="Favoritar"
                      >
                        <Icon name="heart" />
                      </button>
                      <Button onClick={() => open(p.slug)}>Ver perfil</Button>
                      {wa && (
                        <Button variant="whatsapp" onClick={() => window.open(wa, '_blank')}>
                          <Icon name="whatsapp" size={18} /> Chamar no WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
