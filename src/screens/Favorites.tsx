'use client'

import { useEffect, useState } from 'react'
import { ProCard } from '@/components/pro/ProCard'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import type { AuthUser, Page, Pro } from '@/types'

export function Favorites({
  go,
  open,
  user,
  favoriteIds,
  toggleFavorite,
}: {
  go: (p: Page) => void
  open: (slug: string) => void
  user: AuthUser | null
  favoriteIds: string[]
  toggleFavorite: (id: string) => void
}) {
  const [list, setList] = useState<Pro[]>([])
  const [loading, setLoading] = useState(true)
  const key = favoriteIds.join(',')
  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    api('/api/account/favorites').then((r) => {
      setList(r.ok ? (r.data.favorites || []).map((f: { professional: Pro }) => f.professional) : [])
      setLoading(false)
    })
  }, [user, key])
  return (
    <main className="simple-page">
      <div className="container">
        <span className="overline">SUA SELEÇÃO</span>
        <h1>Profissionais favoritos</h1>
        <p>Seus profissionais de confiança, sempre à mão.</p>
        <div className="pro-grid favorite-grid">
          {loading ? (
            <p>Carregando...</p>
          ) : list.length ? (
            list.map((p) => (
              <ProCard key={p.id} pro={p} open={open} saved toggle={() => toggleFavorite(p.id)} />
            ))
          ) : (
            <div className="empty">
              <h2>Nenhum favorito ainda</h2>
              <p>Salve profissionais para encontrá-los rapidamente depois.</p>
              <Button onClick={() => go('search')}>Encontrar profissionais</Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
