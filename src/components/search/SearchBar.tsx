'use client'

import { CategoryPicker } from '@/components/search/CategoryPicker'
import { CityPicker } from '@/components/search/CityPicker'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'

export function SearchBar({
  onSearch,
  compact = false,
  category,
  onCategoryChange,
  city,
  onCityChange,
}: {
  onSearch: () => void
  compact?: boolean
  category: string
  onCategoryChange: (value: string) => void
  city: string
  onCityChange: (value: string) => void
}) {
  return (
    <div className={`searchbar ${compact ? 'compact' : ''}`}>
      <label className="search-category">
        <span>Serviço</span>
        <div>
          <Icon name="search" />
          <CategoryPicker
            selected={category ? [category] : []}
            onChange={(v) => onCategoryChange(v[0] || '')}
            placeholder="Qual serviço você precisa?"
          />
        </div>
      </label>
      <label>
        <span>Localização</span>
        <div>
          <Icon name="pin" />
          <CityPicker value={city} onChange={onCityChange} placeholder="Sua cidade" />
        </div>
      </label>
      <Button onClick={onSearch}>
        <Icon name="search" size={18} /> Encontrar profissionais
      </Button>
    </div>
  )
}
