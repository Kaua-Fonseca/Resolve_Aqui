'use client'

import { useEffect, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Rating } from '@/components/ui/Rating'
import { api } from '@/lib/api'
import { fmtRating, initials, mainCategory, whatsappUrl } from '@/lib/format'
import type { Page, Pro } from '@/types'

export function Profile({
  slug,
  go,
  favoriteIds,
  toggleFavorite,
  onReview,
}: {
  slug: string
  go: (p: Page) => void
  favoriteIds: string[]
  toggleFavorite: (id: string) => void
  onReview: (p: { id: string; name: string }) => void
}) {
  const [p, setP] = useState<
    | (Pro & {
        services?: { id: string; title: string; description?: string | null; priceFrom?: string | null }[]
        reviews?: {
          id: string
          rating: number
          comment: string
          createdAt: string
          author: { name: string }
        }[]
      })
    | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    setLoading(true)
    setError('')
    api(`/api/professionals/${encodeURIComponent(slug)}`).then((r) => {
      if (r.ok) setP(r.data.professional)
      else setError(r.data?.error?.message || 'Não foi possível carregar o perfil.')
      setLoading(false)
    })
  }, [slug])
  if (loading)
    return (
      <main className="profile-page">
        <div className="container">
          <p>Carregando perfil...</p>
        </div>
      </main>
    )
  if (error || !p)
    return (
      <main className="profile-page">
        <div className="container">
          <div className="empty">
            <h2>Perfil não encontrado</h2>
            <p>{error || 'Este profissional não está disponível.'}</p>
            <Button onClick={() => go('search')}>Voltar para a busca</Button>
          </div>
        </div>
      </main>
    )
  const wa = whatsappUrl(p.whatsapp, p.name)
  const saved = favoriteIds.includes(p.id)
  return (
    <main className="profile-page">
      <div className="container">
        <div className="breadcrumb profile-crumb">
          Início / {mainCategory(p)} / {p.name}
        </div>
        <section className="profile-header">
          <Avatar id={p.avatarId} name={p.name} />
          <div className="profile-main">
            {p.isVerified && (
              <span className="verified">
                <Icon name="check" size={12} /> Perfil verificado
              </span>
            )}
            <h1>{p.name}</h1>
            <p className="role">{p.headline || mainCategory(p)}</p>
            <div className="profile-metrics">
              <Rating value={fmtRating(p.averageRating)} count={p.reviewCount} />
              {p.yearsExperience ? (
                <>
                  <span>•</span>
                  <b>{p.yearsExperience} anos de experiência</b>
                </>
              ) : null}
            </div>
            <p className="location">
              <Icon name="pin" />
              {p.city}
              {p.state ? `, ${p.state}` : ''}
            </p>
          </div>
          <div className="profile-actions">
            {wa && (
              <Button variant="whatsapp" onClick={() => window.open(wa, '_blank')}>
                <Icon name="whatsapp" /> Solicitar orçamento pelo WhatsApp
              </Button>
            )}
            <Button variant="secondary" onClick={() => toggleFavorite(p.id)}>
              <Icon name="heart" />
              {saved ? 'Salvo nos favoritos' : 'Favoritar profissional'}
            </Button>
          </div>
        </section>
        <div className="profile-layout">
          <div className="profile-content">
            {p.description && (
              <section className="content-card">
                <h2>Sobre o profissional</h2>
                <p>{p.description}</p>
              </section>
            )}
            {!!p.services?.length && (
              <section className="content-card">
                <h2>Serviços oferecidos</h2>
                <div className="services-list">
                  {p.services.map((x) => (
                    <span key={x.id}>
                      <Icon name="check" size={16} />
                      {x.title}
                      {x.priceFrom
                        ? ` — a partir de R$ ${Number(x.priceFrom).toFixed(2).replace('.', ',')}`
                        : ''}
                    </span>
                  ))}
                </div>
              </section>
            )}
            {!!p.workImages?.length && (
              <section className="content-card">
                <div className="section-head compact-head">
                  <h2>Trabalhos realizados</h2>
                </div>
                <div className="gallery">
                  {p.workImages.map((id) => (
                    <a key={id} href={`/api/images/${id}`} target="_blank" rel="noreferrer">
                      <img src={`/api/images/${id}`} alt={`Trabalho de ${p.name}`} loading="lazy" />
                    </a>
                  ))}
                </div>
              </section>
            )}
            <section className="content-card reviews" id="avaliacoes">
              <div className="section-head compact-head">
                <div>
                  <h2>Avaliações de clientes</h2>
                  <Rating value={fmtRating(p.averageRating)} count={p.reviewCount} />
                </div>
                <Button variant="secondary" onClick={() => onReview({ id: p.id, name: p.name })}>
                  Avaliar profissional
                </Button>
              </div>
              {p.reviews?.length ? (
                p.reviews.map((r) => (
                  <div className="review" key={r.id}>
                    <div className="review-avatar">{initials(r.author.name)}</div>
                    <div>
                      <b>{r.author.name}</b>
                      <span className="five-stars">
                        {'★'.repeat(r.rating)}
                        {'☆'.repeat(5 - r.rating)}
                      </span>
                      <p>{r.comment}</p>
                      <small>{new Date(r.createdAt).toLocaleDateString('pt-BR')}</small>
                    </div>
                  </div>
                ))
              ) : (
                <p>Este profissional ainda não possui avaliações publicadas.</p>
              )}
            </section>
          </div>
          <aside className="profile-side">
            <div className="content-card">
              <h3>Área de atendimento</h3>
              <p>
                <Icon name="pin" size={17} /> {p.city}
                {p.state ? `, ${p.state}` : ''}
              </p>
              {!!p.neighborhoods?.length && (
                <div className="tags">
                  {p.neighborhoods.map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
              )}
              {!!p.categories.length && (
                <>
                  <hr />
                  <h3>Especialidades</h3>
                  <div className="tags">
                    {p.categories.map((c) => (
                      <span key={c.name}>{c.name}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
      {wa && (
        <div className="mobile-contact">
          <Button variant="whatsapp" onClick={() => window.open(wa, '_blank')}>
            <Icon name="whatsapp" /> Solicitar orçamento
          </Button>
        </div>
      )}
    </main>
  )
}
