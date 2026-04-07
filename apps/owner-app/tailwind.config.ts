import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        naranja: '#C4500A',
        'naranja-vivo': '#E05A0C',
        'naranja-suave': 'rgba(196,80,10,0.12)',
        'azul-noche': '#141B2D',
        'azul-medio': '#1E2840',
        crema: '#F7EDD8',
        'crema-suave': '#FAF4E8',
        ambar: '#F4A923',
        'texto-oscuro': '#1A1208',
        'texto-tenue': '#7A8BA8',
        'blanco-calido': '#FDF8F0',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        ui: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        pill: '50px',
      },
      boxShadow: {
        naranja: '0 12px 30px rgba(196,80,10,0.25)',
        card: '0 4px 20px rgba(20,27,45,0.08)',
      },
    },
  },
  plugins: [],
} satisfies Config
