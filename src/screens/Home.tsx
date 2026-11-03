'use client'

import { useEffect, useState } from 'react'
import { ProCard } from '@/components/pro/ProCard'
import { SearchBar } from '@/components/search/SearchBar'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { api } from '@/lib/api'
import { categoryIcons, heroPhoto } from '@/lib/constants'
import type { Page, Pro } from '@/types'

export function Home({
  go,
  open,
  category,
  setCategory,
  city,
  setCity,
  favoriteIds,
  toggleFavorite,
}: {
  go: (p: Page) => void
  open: (slug: string) => void
  category: string
  setCategory: (v: string) => void
  city: string
  setCity: (v: string) => void
  favoriteIds: string[]
  toggleFavorite: (id: string) => void
}) {
  const [featured, setFeatured] = useState<string[]>([])
  const [top, setTop] = useState<Pro[]>([])
  const [loadingTop, setLoadingTop] = useState(true)
  useEffect(() => {
    api('/api/categories').then((r) => {
      if (r.ok && Array.isArray(r.data.categories))
        setFeatured(r.data.categories.map((c: { name: string }) => c.name))
    })
    api('/api/professionals?limit=12')
      .then((r) => {
        if (r.ok && Array.isArray(r.data.data))
          setTop(
            [...(r.data.data as Pro[])]
              .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
              .slice(0, 3),
          )
      })
      .finally(() => setLoadingTop(false))
  }, [])
  const quick = Object.keys(categoryIcons)
    .filter((n) => featured.includes(n))
    .concat(featured.filter((n) => !(n in categoryIcons)))
    .slice(0, 8)
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span>●</span> Profissionais perto de você
            </span>
            <h1>
              Precisou de um serviço? <em>Resolve Aqui!</em>
            </h1>
            <p>
              Encontre profissionais da sua região, compare avaliações e solicite seu orçamento sem
              complicação.
            </p>
            <SearchBar
              category={category}
              onCategoryChange={setCategory}
              city={city}
              onCityChange={setCity}
              onSearch={() => go('search')}
            />
            <div className="trust-row">
              <span>
                <Icon name="check" /> Avaliações moderadas
              </span>
              <span>
                <Icon name="check" /> Contato direto
              </span>
              <span>
                <Icon name="check" /> Sem custo
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="orange-shape" />
            <img src={heroPhoto} alt="Profissional eletricista trabalhando com segurança" />
          </div>
        </div>
      </section>

      <section className="section categories" id="categorias">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="overline">SERVIÇOS MAIS BUSCADOS</span>
              <h2>O que você precisa resolver?</h2>
              <p>Encontre o profissional certo para cada necessidade.</p>
            </div>
            <button
              className="text-link"
              onClick={() => {
                setCategory('')
                go('search')
              }}
            >
              Ver todos os profissionais <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="category-grid">
            {quick.map((name) => (
              <button
                className="category-card"
                key={name}
                onClick={() => {
                  setCategory(name)
                  go('search')
                }}
              >
                <span>{categoryIcons[name] || '✦'}</span>
                <b>{name}</b>
                <Icon name="chevron" size={16} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section professionals">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="overline">DESTAQUES DA REGIÃO</span>
              <h2>Profissionais em destaque</h2>
              <p>Perfis aprovados e publicados na plataforma.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setCategory('')
                go('search')
              }}
            >
              Ver todos <Icon name="arrow" size={17} />
            </Button>
          </div>
          {loadingTop ? (
            <p>Carregando profissionais...</p>
          ) : top.length ? (
            <div className="pro-grid">
              {top.map((p) => (
                <ProCard
                  key={p.id}
                  pro={p}
                  open={open}
                  saved={favoriteIds.includes(p.id)}
                  toggle={() => toggleFavorite(p.id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <h2>Ainda não há profissionais publicados</h2>
              <p>Seja o primeiro a divulgar seus serviços em Foz do Iguaçu.</p>
              <Button onClick={() => go('signup')}>Cadastre-se como profissional</Button>
            </div>
          )}
        </div>
      </section>

      <section className="section how" id="como">
        <div className="container">
          <div className="center-head">
            <span className="overline">SIMPLES, RÁPIDO E SEGURO</span>
            <h2>Como funciona?</h2>
            <p>Do problema resolvido ao profissional ideal em poucos passos.</p>
          </div>
          <div className="steps">
            {[
              ['search', 'Encontre um profissional', 'Busque pelo serviço e localização que você precisa.'],
              ['star', 'Confira as avaliações', 'Compare perfis, experiências e opiniões de clientes.'],
              ['whatsapp', 'Entre em contato', 'Converse diretamente pelo WhatsApp e peça seu orçamento.'],
            ].map((x, i) => (
              <div className="step" key={x[1]}>
                <span className="step-num">0{i + 1}</span>
                <div className="step-icon">
                  <Icon name={x[0]} size={28} />
                </div>
                <h3>{x[1]}</h3>
                <p>{x[2]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pro-cta">
        <div className="container cta-inner">
          <div>
            <span className="cta-label">PARA PROFISSIONAIS</span>
            <h2>
              Você trabalha por conta própria?
              <br />
              Encontre novos clientes!
            </h2>
            <p>Crie seu perfil gratuitamente, mostre seu trabalho e conecte-se com pessoas da sua região.</p>
            <Button onClick={() => go('signup')}>
              Cadastre-se como profissional <Icon name="arrow" size={18} />
            </Button>
          </div>
          <div className="cta-stats">
            <div>
              <b>100%</b>
              <span>gratuito para começar</span>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
