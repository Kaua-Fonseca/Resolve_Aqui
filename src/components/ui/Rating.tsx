'use client'

import { Icon } from '@/components/ui/Icon'

export function Rating({ value = '—', count }: { value?: string; count?: number }) {
  if (count === 0)
    return (
      <span className="rating">
        <span>Sem avaliações ainda</span>
      </span>
    )
  return (
    <span className="rating">
      <Icon name="star" size={16} />
      <b>{value}</b>
      {count !== undefined && <span>({count} avaliações)</span>}
    </span>
  )
}
