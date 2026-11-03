'use client'

import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Rating } from '@/components/ui/Rating'
import { fmtRating, mainCategory } from '@/lib/format'
import type { Pro } from '@/types'

export function ProCard({
  pro,
  open,
  saved,
  toggle,
}: {
  pro: Pro
  open: (slug: string) => void
  saved?: boolean
  toggle?: () => void
}) {
  return (
    <article className="pro-card">
      <div className="pro-photo">
        <Avatar id={pro.avatarId} name={pro.name} />
        {toggle && (
          <button
            className={saved ? 'favorite saved' : 'favorite'}
            onClick={toggle}
            aria-label={saved ? 'Remover dos favoritos' : 'Favoritar'}
          >
            <Icon name="heart" size={19} />
          </button>
        )}
      </div>
      <div className="pro-body">
        <div className="pro-title">
          <h3>{pro.name}</h3>
          {pro.isVerified && (
            <span className="verified">
              <Icon name="check" size={12} /> Verificado
            </span>
          )}
        </div>
        <p className="role">{pro.headline || mainCategory(pro)}</p>
        <p className="location">
          <Icon name="pin" size={16} />
          {[pro.neighborhoods?.[0], pro.city].filter(Boolean).join(' • ')}
        </p>
        <div className="pro-footer">
          <Rating value={fmtRating(pro.averageRating)} count={pro.reviewCount} />
          <Button variant="secondary" onClick={() => open(pro.slug)}>
            Ver perfil <Icon name="arrow" size={16} />
          </Button>
        </div>
      </div>
    </article>
  )
}
