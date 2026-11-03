'use client'

import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { Page } from '@/types'

export function AccessDialog({
  kind,
  go,
  close,
}: {
  kind: 'favorite' | 'review'
  go: (p: Page) => void
  close: () => void
}) {
  return (
    <div className="dialog-backdrop" onClick={close}>
      <section className="access-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="dialog-close" onClick={close}>
          <Icon name="close" />
        </button>
        <div className="dialog-icon">
          <Icon name={kind === 'favorite' ? 'heart' : 'star'} size={28} />
        </div>
        <h2>
          {kind === 'favorite'
            ? 'Salve seus profissionais favoritos'
            : 'Entre para avaliar este profissional'}
        </h2>
        <p>
          {kind === 'favorite'
            ? 'Entre na sua conta para salvar seus profissionais favoritos.'
            : 'As avaliações são vinculadas à sua conta e a um serviço realizado, garantindo mais confiança para todos.'}
        </p>
        <div>
          <Button onClick={() => go('login')}>Entrar</Button>
          <Button variant="secondary" onClick={() => go('signup')}>
            Criar conta
          </Button>
        </div>
      </section>
    </div>
  )
}
