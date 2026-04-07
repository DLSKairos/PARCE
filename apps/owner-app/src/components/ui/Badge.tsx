const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDING:    { label: 'Pendiente',      classes: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED:  { label: 'Confirmado',     classes: 'bg-blue-100 text-blue-800' },
  PREPARING:  { label: 'En preparación', classes: 'bg-ambar/20 text-ambar' },
  READY:      { label: 'Listo',          classes: 'bg-green-100 text-green-800' },
  DELIVERED:  { label: 'Entregado',      classes: 'bg-gray-100 text-gray-600' },
  CANCELLED:  { label: 'Cancelado',      classes: 'bg-red-100 text-red-600' },
}

interface BadgeProps {
  status?: string
  label?: string
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  className?: string
}

export function Badge({ status, label, variant, className = '' }: BadgeProps) {
  if (status && statusConfig[status]) {
    const { label: lbl, classes } = statusConfig[status]
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-ui font-semibold ${classes} ${className}`}>
        {lbl}
      </span>
    )
  }
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error:   'bg-red-100 text-red-600',
    info:    'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-ui font-semibold ${variantClasses[variant || 'neutral']} ${className}`}>
      {label}
    </span>
  )
}
