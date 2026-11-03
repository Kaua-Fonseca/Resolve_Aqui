'use client'

import { Icon } from '@/components/ui/Icon'

export function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button className="logo" onClick={onClick} aria-label="Ir para o início">
      <span className="logo-mark">
        <Icon name="check" size={19} />
      </span>
      <span>
        Resolve <b>Aqui</b>
      </span>
    </button>
  )
}
