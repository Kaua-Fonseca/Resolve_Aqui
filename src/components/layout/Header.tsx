'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'
import type { AuthUser, Page } from '@/types'

export function Header({
  go,
  user,
  logout,
}: {
  go: (p: Page) => void
  user: AuthUser | null
  logout: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <header className="header">
      <div className="container header-inner">
        <Logo onClick={() => go('home')} />
        <nav className={open ? 'nav open' : 'nav'}>
          <button onClick={() => go('home')}>Início</button>
          <button onClick={() => go('search')}>Encontrar profissionais</button>
          <button
            onClick={() => {
              go('home')
              setTimeout(
                () => document.querySelector('#categorias')?.scrollIntoView({ behavior: 'smooth' }),
                50,
              )
            }}
          >
            Categorias
          </button>
          <button
            onClick={() => {
              go('home')
              setTimeout(() => document.querySelector('#como')?.scrollIntoView({ behavior: 'smooth' }), 50)
            }}
          >
            Como funciona
          </button>
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <a className="btn btn-secondary" href="/admin">
                  Painel admin
                </a>
              )}
              {user.role === 'PROFESSIONAL' && (
                <Button variant="secondary" onClick={() => go('dashboard')}>
                  Meu painel
                </Button>
              )}
              {user.role !== 'ADMIN' && (
                <Button variant="ghost" onClick={() => go('favorites')}>
                  <Icon name="heart" size={17} /> Meus favoritos
                </Button>
              )}
              <Button onClick={logout}>Sair</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => go('login')}>
                Entrar
              </Button>
              <Button onClick={() => go('signup')}>Criar conta</Button>
            </>
          )}
        </div>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Abrir menu">
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
    </header>
  )
}
