export type Page = 'home' | 'search' | 'profile' | 'login' | 'signup' | 'dashboard' | 'favorites'

export type Role = 'CLIENT' | 'PROFESSIONAL' | 'ADMIN'

export type AuthUser = { id: string; name: string; email: string; phone?: string | null; role: Role }

export type Category = { name: string; slug?: string; isPrimary?: boolean }

export type Pro = {
  id: string
  slug: string
  name: string
  headline?: string | null
  description?: string | null
  city: string
  state?: string
  neighborhoods?: string[]
  whatsapp?: string | null
  yearsExperience?: number | null
  isVerified?: boolean
  categories: Category[]
  averageRating?: number | null
  reviewCount?: number
  avatarId?: string | null
  workImages?: string[]
}
