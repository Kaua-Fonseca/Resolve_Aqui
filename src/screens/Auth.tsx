'use client'

import { useState } from 'react'
import { CategoryPicker } from '@/components/search/CategoryPicker'
import { CityPicker } from '@/components/search/CityPicker'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Logo } from '@/components/ui/Logo'
import type { AuthUser, Page } from '@/types'

export function Auth({
  signup,
  go,
  onLogin,
}: {
  signup?: boolean
  go: (p: Page) => void
  onLogin: (user: AuthUser) => void
}) {
  const [professional, setProfessional] = useState(false)
  const [professionalCategories, setProfessionalCategories] = useState<string[]>([])
  const [categoryError, setCategoryError] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [city, setCity] = useState('Foz do Iguaçu')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (signup && password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (signup && professional && !professionalCategories.length) {
      setCategoryError('Selecione pelo menos uma categoria de serviço.')
      return
    }
    const finalCategories = professionalCategories.map((c) =>
      c === 'Outro serviço' && customCategory.trim() ? customCategory.trim() : c,
    )
    setCategoryError('')
    setBusy(true)
    try {
      const response = await fetch(signup ? '/api/auth/register' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(
          signup
            ? {
                name,
                email,
                phone,
                password,
                role: professional ? 'PROFESSIONAL' : 'CLIENT',
                categories: professional ? finalCategories : [],
                city,
                description,
              }
            : { email, password },
        ),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(
          result?.error?.message ||
            result?.message ||
            'Não foi possível concluir. Confira os dados e tente novamente.',
        )
        return
      }
      const account = result?.user as AuthUser | undefined
      if (
        !account ||
        (account.role !== 'CLIENT' && account.role !== 'PROFESSIONAL' && account.role !== 'ADMIN')
      ) {
        setError(
          'A conta foi processada, mas o servidor não retornou o tipo de usuário. Tente entrar novamente.',
        )
        return
      }
      onLogin(account)
    } catch {
      setError('Não foi possível conectar ao servidor. Confira se o projeto e o banco estão funcionando.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-art">
        <Logo onClick={() => go('home')} />
        <div>
          <span className="overline">BEM-VINDO AO RESOLVE AQUI</span>
          <h1>
            {professional
              ? 'Transforme seu talento em novas oportunidades.'
              : 'Tudo o que você precisa, perto de você.'}
          </h1>
          <p>Conectamos bons profissionais a pessoas que valorizam um serviço bem feito.</p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-box">
          <span className="auth-mobile-logo">
            <Logo onClick={() => go('home')} />
          </span>
          <h2>{signup ? 'Crie sua conta' : 'Entre na sua conta'}</h2>
          <p>{signup ? 'Escolha como você quer usar o Resolve Aqui.' : 'Que bom ter você de volta!'}</p>
          <div className="account-choice">
            <button
              type="button"
              className={!professional ? 'active' : ''}
              onClick={() => setProfessional(false)}
            >
              <Icon name="search" />
              <span>
                <b>Sou cliente</b>
                <small>Quero contratar serviços</small>
              </span>
            </button>
            <button
              type="button"
              className={professional ? 'active' : ''}
              onClick={() => setProfessional(true)}
            >
              <Icon name="user" />
              <span>
                <b>Sou profissional</b>
                <small>Quero divulgar meu trabalho</small>
              </span>
            </button>
          </div>
          <form onSubmit={submit}>
            {signup && (
              <label>
                Nome completo
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              E-mail
              <input
                required
                type="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
              />
            </label>
            {signup && (
              <label>
                Telefone
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={30}
                  placeholder="(45) 99999-9999"
                  autoComplete="tel"
                />
              </label>
            )}
            <label>
              Senha
              <input
                required
                type="password"
                minLength={signup ? 8 : 1}
                maxLength={72}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={signup ? 'Mínimo de 8 caracteres' : 'Sua senha'}
                autoComplete={signup ? 'new-password' : 'current-password'}
              />
            </label>
            {signup && (
              <label>
                Confirmar senha
                <input
                  required
                  type="password"
                  minLength={8}
                  maxLength={72}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  autoComplete="new-password"
                />
              </label>
            )}
            {signup && professional && (
              <>
                <label>
                  Categoria principal e especialidades
                  <CategoryPicker
                    multiple
                    selected={professionalCategories}
                    onChange={(items) => {
                      setProfessionalCategories(items)
                      setCategoryError('')
                    }}
                    error={categoryError}
                    placeholder="Pesquise e selecione suas categorias"
                  />
                </label>
                {professionalCategories.includes('Outro serviço') && (
                  <label>
                    Especialidade personalizada
                    <input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Ex.: Instalação de painéis solares"
                    />
                  </label>
                )}
                <label>
                  Cidade
                  <CityPicker value={city} onChange={setCity} required />
                </label>
                <label>
                  Breve descrição
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={2000}
                    placeholder="Conte um pouco sobre sua experiência"
                  />
                </label>
              </>
            )}
            {signup ? (
              <label className="terms">
                <input type="checkbox" required />
                Aceito os Termos de Uso e a Política de Privacidade.
              </label>
            ) : (
              <div className="forgot">
                <label className="terms">
                  <input type="checkbox" />
                  Lembrar de mim
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setError(
                      'A recuperação de senha ainda não está disponível. Entre em contato com o suporte.',
                    )
                  }
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
            {error && (
              <p
                role="alert"
                style={{
                  color: '#b91c1c',
                  background: '#fef2f2',
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                {error}
              </p>
            )}
            <Button className="full">
              {busy
                ? 'Aguarde...'
                : signup
                  ? professional
                    ? 'Criar perfil profissional'
                    : 'Criar conta de cliente'
                  : 'Entrar'}
            </Button>
          </form>
          <p className="auth-switch">
            {signup ? 'Já possui uma conta?' : 'Ainda não tem cadastro?'}{' '}
            <button type="button" onClick={() => go(signup ? 'login' : 'signup')}>
              {signup ? 'Entrar' : 'Criar conta'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}
