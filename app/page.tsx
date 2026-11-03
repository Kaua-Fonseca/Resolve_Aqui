'use client'

import { useEffect, useState } from 'react'
import { AccessDialog } from '@/components/dialogs/AccessDialog'
import { ReviewDialog } from '@/components/dialogs/ReviewDialog'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { Icon } from '@/components/ui/Icon'
import { api } from '@/lib/api'
import { Auth } from '@/screens/Auth'
import { Dashboard } from '@/screens/Dashboard'
import { Favorites } from '@/screens/Favorites'
import { Home } from '@/screens/Home'
import { Profile } from '@/screens/Profile'
import { SearchPage } from '@/screens/SearchPage'
import type { AuthUser, Page } from '@/types'

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [user, setUser] = useState<AuthUser | null>(null)
  const [ready, setReady] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('Foz do Iguaçu')
  const [slug, setSlug] = useState('')
  const [dialog, setDialog] = useState<'favorite' | 'review' | null>(null)
  const [reviewTarget, setReviewTarget] = useState<{ id: string; name: string } | null>(null)
  const [notice, setNotice] = useState('')

  const go = (p: Page) => {
    setPage(p)
    setDialog(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const open = (s: string) => {
    setSlug(s)
    go('profile')
  }
  const loadFavorites = async () => {
    const r = await api('/api/account/favorites')
    setFavoriteIds(
      r.ok ? (r.data.favorites || []).map((f: { professional: { id: string } }) => f.professional.id) : [],
    )
  }

  // Restaura a sessão (cookie) ao abrir/atualizar a página
  useEffect(() => {
    api('/api/auth/me')
      .then(async (r) => {
        if (r.ok && r.data.user) {
          setUser(r.data.user)
          await loadFavorites()
        }
      })
      .finally(() => setReady(true))
  }, [])

  // Painel do profissional exige login
  useEffect(() => {
    if (ready && !user && page === 'dashboard') go('login')
  }, [ready, user, page])

  const login = (account: AuthUser) => {
    setUser(account)
    void loadFavorites()
    if (account.role === 'ADMIN') {
      window.location.href = '/admin'
      return
    }
    go(account.role === 'PROFESSIONAL' ? 'dashboard' : 'home')
  }
  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setFavoriteIds([])
    go('home')
  }
  const toggleFavorite = async (id: string) => {
    if (!user) {
      setDialog('favorite')
      return
    }
    const isSaved = favoriteIds.includes(id)
    const r = await api(`/api/account/favorites/${encodeURIComponent(id)}`, {
      method: isSaved ? 'DELETE' : 'PUT',
    })
    if (!r.ok) {
      setNotice(r.data?.error?.message || 'Não foi possível atualizar seus favoritos.')
      return
    }
    setFavoriteIds(isSaved ? favoriteIds.filter((x) => x !== id) : [...favoriteIds, id])
  }
  const review = (target: { id: string; name: string }) =>
    user ? setReviewTarget(target) : setDialog('review')

  const full = page === 'login' || page === 'signup' || page === 'dashboard'
  return (
    <div>
      {!full && <Header go={go} user={user} logout={logout} />}
      {page === 'home' && (
        <Home
          go={go}
          open={open}
          category={category}
          setCategory={setCategory}
          city={city}
          setCity={setCity}
          favoriteIds={favoriteIds}
          toggleFavorite={toggleFavorite}
        />
      )}
      {page === 'search' && (
        <SearchPage
          go={go}
          open={open}
          favoriteIds={favoriteIds}
          toggleFavorite={toggleFavorite}
          category={category}
          setCategory={setCategory}
          city={city}
          setCity={setCity}
        />
      )}
      {page === 'profile' && (
        <Profile
          slug={slug}
          go={go}
          favoriteIds={favoriteIds}
          toggleFavorite={toggleFavorite}
          onReview={review}
        />
      )}
      {page === 'login' && <Auth go={go} onLogin={login} />}
      {page === 'signup' && <Auth signup go={go} onLogin={login} />}
      {page === 'dashboard' && user && <Dashboard go={go} user={user} logout={logout} open={open} />}
      {page === 'favorites' && (
        <Favorites
          go={go}
          open={open}
          user={user}
          favoriteIds={favoriteIds}
          toggleFavorite={toggleFavorite}
        />
      )}
      {!full && (
        <>
          <button
            className="favorites-fab"
            onClick={() => (user ? go('favorites') : setDialog('favorite'))}
            aria-label="Meus favoritos"
          >
            <Icon name="heart" />
            {favoriteIds.length > 0 && <i />}
          </button>
          <Footer go={go} />
        </>
      )}
      {dialog && <AccessDialog kind={dialog} go={go} close={() => setDialog(null)} />}
      {reviewTarget && <ReviewDialog target={reviewTarget} close={() => setReviewTarget(null)} />}
      {notice && (
        <div role="status" className="toast" onClick={() => setNotice('')}>
          {notice}
        </div>
      )}
    </div>
  )
}
