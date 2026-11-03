'use client'

import { initials } from '@/lib/format'

export function Avatar({ id, name }: { id?: string | null; name: string }) {
  return id ? (
    <img src={`/api/images/${id}`} alt={name} />
  ) : (
    <div className="avatar-fallback" aria-hidden>
      {initials(name)}
    </div>
  )
}
