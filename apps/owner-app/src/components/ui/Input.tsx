interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export function Input({ label, error, helperText, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-body font-medium text-texto-oscuro">{label}</label>
      )}
      <input
        className={`px-4 py-3 bg-white border ${error ? 'border-red-400' : 'border-gray-200'} rounded-card font-body text-texto-oscuro placeholder-texto-tenue focus:outline-none focus:border-naranja focus:ring-2 focus:ring-naranja/20 transition-all ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helperText && !error && <p className="text-xs text-texto-tenue">{helperText}</p>}
    </div>
  )
}
