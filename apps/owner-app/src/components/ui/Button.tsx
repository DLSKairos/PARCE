interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, fullWidth, children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-ui font-semibold rounded-pill transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-naranja text-white hover:bg-naranja-vivo shadow-naranja active:scale-95',
    secondary: 'bg-azul-noche text-crema hover:bg-azul-medio active:scale-95',
    ghost: 'bg-transparent text-naranja border border-naranja hover:bg-naranja-suave',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-95',
  }
  const sizes = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-base', lg: 'px-8 py-4 text-lg' }
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" /> : null}
      {children}
    </button>
  )
}
