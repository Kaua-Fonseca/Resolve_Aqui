'use client'

import { Logo } from '@/components/ui/Logo'
import type { Page } from '@/types'

export function Footer({ go }: { go: (p: Page) => void }) {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Logo onClick={() => go('home')} />
          <p>Serviços de confiança, perto de você.</p>
        </div>
        <div>
          <b>Resolve Aqui</b>
          <button>Sobre nós</button>
          <button>Como funciona</button>
          <button>Ajuda</button>
        </div>
        <div>
          <b>Legal</b>
          <button>Termos de uso</button>
          <button>Privacidade</button>
          <button>Contato</button>
        </div>
        <div>
          <b>Atendimento</b>
          <p>Foz do Iguaçu, Paraná</p>
          <p>contato@resolveaqui.com.br</p>
        </div>
      </div>
      <div className="container copyright">
        © {new Date().getFullYear()} Resolve Aqui. Todos os direitos reservados.{' '}
        <span>Feito para conectar pessoas.</span>
      </div>
    </footer>
  )
}
