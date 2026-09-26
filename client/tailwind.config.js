/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        police: {
          900: '#0B132B',
          800: '#1C2541',
          700: '#3A506B',
          600: '#4C6A92',
          500: '#5C7D9D',
          100: '#E2E8F0',
        },
        forensic: {
          bg: '#0B0F19',
          card: '#111827',
          border: '#1F2937',
          accent: '#2563EB',
          alert: '#DC2626',
          warning: '#D97706',
          success: '#059669',
          muted: '#6B7280'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
