'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'

export function CategoryPicker({
  selected,
  onChange,
  multiple = false,
  placeholder = 'Selecione uma categoria',
  error,
}: {
  selected: string[]
  onChange: (items: string[]) => void
  multiple?: boolean
  placeholder?: string
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<{ group: string; items: string[] }[]>([])
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data.categories)) {
          const grouped = new Map<string, string[]>()
          for (const c of data.categories) {
            const key = c.groupName || 'Outros serviços'
            grouped.set(key, [...(grouped.get(key) || []), c.name])
          }
          setGroups(Array.from(grouped.entries()).map(([group, items]) => ({ group, items })))
        }
      })
      .catch(() => {})
  }, [])
  const toggle = (item: string) => {
    if (multiple) onChange(selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item])
    else {
      onChange([item])
      setOpen(false)
    }
  }
  const visible = groups
    .map((g) => ({ ...g, items: g.items.filter((x) => x.toLowerCase().includes(query.toLowerCase())) }))
    .filter((g) => g.items.length)
  return (
    <div className="category-picker">
      <button
        type="button"
        className={`picker-trigger ${error ? 'has-error' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span>
          {selected.length
            ? multiple
              ? `${selected.length} categoria${selected.length > 1 ? 's' : ''} selecionada${selected.length > 1 ? 's' : ''}`
              : selected[0]
            : placeholder}
        </span>
        <span className="picker-chevron">⌄</span>
      </button>
      {selected.length > 0 && multiple && (
        <div className="selected-tags">
          {selected.map((item) => (
            <span key={item}>
              {item}
              <button type="button" onClick={() => toggle(item)} aria-label={`Remover ${item}`}>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="picker-menu">
          <div className="picker-search">
            <Icon name="search" size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar categoria pelo nome..."
              autoFocus
            />
          </div>
          <div className="picker-options">
            {visible.length ? (
              visible.map((group) => (
                <div className="picker-group" key={group.group}>
                  <b>{group.group}</b>
                  {group.items.map((item) => (
                    <button
                      type="button"
                      className={selected.includes(item) ? 'selected' : ''}
                      key={item}
                      onClick={() => toggle(item)}
                    >
                      <span>{item}</span>
                      {selected.includes(item) && <Icon name="check" size={15} />}
                    </button>
                  ))}
                </div>
              ))
            ) : (
              <p>Nenhuma categoria encontrada.</p>
            )}
          </div>
        </div>
      )}
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}
