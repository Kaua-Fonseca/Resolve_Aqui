'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { normalize } from '@/lib/format'

export // Campo de cidade: o usuário digita livremente, mas vê sugestões com as cidades que já têm profissionais.
function CityPicker({
  value,
  onChange,
  placeholder = 'Sua cidade',
  required,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [cities, setCities] = useState<{ name: string; state: string; count: number }[]>([])
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    api('/api/cities').then((r) => {
      if (r.ok && Array.isArray(r.data.cities)) setCities(r.data.cities)
    })
  }, [])
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const q = normalize(value)
  const exact = cities.some((c) => normalize(c.name) === q)
  const options = !q || exact ? cities : cities.filter((c) => normalize(c.name).includes(q))
  return (
    <div className="category-picker" ref={box}>
      <input
        value={value}
        required={required}
        minLength={required ? 2 : undefined}
        maxLength={100}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
      />
      {open && (
        <div className="picker-menu">
          <div className="picker-options">
            {options.length ? (
              <div className="picker-group">
                <b>Cidades com profissionais</b>
                {options.map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    className={normalize(c.name) === q ? 'selected' : ''}
                    onClick={() => {
                      onChange(c.name)
                      setOpen(false)
                    }}
                  >
                    <span>
                      {c.name}
                      {c.state ? `, ${c.state}` : ''}
                    </span>
                    <small>
                      {c.count} profissiona{c.count === 1 ? 'l' : 'is'}
                    </small>
                  </button>
                ))}
              </div>
            ) : (
              <p>
                {cities.length
                  ? 'Nenhuma cidade sugerida com esse nome.'
                  : 'Ainda não há cidades com profissionais publicados.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
