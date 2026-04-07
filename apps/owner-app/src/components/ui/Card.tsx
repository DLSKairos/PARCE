interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  highlight?: boolean
}

export function Card({ children, className = '', onClick, highlight }: CardProps) {
  return (
    <div
      className={`bg-blanco-calido rounded-card p-4 ${highlight ? 'shadow-naranja' : 'shadow-card'} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
