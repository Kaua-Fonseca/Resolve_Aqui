import type { Pro } from '@/types'

export const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join('')

export const fmtRating = (v?: number | null) => (v == null ? '—' : v.toFixed(1).replace('.', ','))

export const mainCategory = (p: Pro) =>
  (p.categories.find((c) => c.isPrimary) || p.categories[0])?.name || 'Profissional'

export const whatsappUrl = (number: string | null | undefined, name: string) => {
  const digits = (number || '').replace(/\D/g, '')
  if (!digits) return ''
  const full = digits.length <= 11 ? `55${digits}` : digits
  return `https://wa.me/${full}?text=${encodeURIComponent(`Olá, ${name}! Encontrei seu perfil no Resolve Aqui e gostaria de solicitar um orçamento.`)}`
}

export const normalize = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
