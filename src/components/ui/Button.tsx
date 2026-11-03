'use client'

export function Button({
  children,
  variant = 'primary',
  onClick,
  className = '',
  disabled,
  type,
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'whatsapp'
  onClick?: () => void
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit'
}) {
  return (
    <button type={type} disabled={disabled} className={`btn btn-${variant} ${className}`} onClick={onClick}>
      {children}
    </button>
  )
}
