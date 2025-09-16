/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        'primary': {
          50: '#e6f7ff',
          100: '#b3e6ff',
          200: '#80d4ff',
          300: '#4dc3ff',
          400: '#1ab1ff',
          500: '#00BFFF', // Electric Blue
          600: '#0099e6',
          700: '#0073bf',
          800: '#004d99',
          900: '#00264d',
        },
        'secondary': {
          50: '#e6fff9',
          100: '#b3fff0',
          200: '#80ffe6',
          300: '#4dffdc',
          400: '#1affd1',
          500: '#0DFEFF', // Neon Aqua
          600: '#0dcccb',
          700: '#0a9997',
          800: '#086664',
          900: '#053331',
        },

        // Neutral Colors
        'neutral': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },

        // Semantic Colors
        'success': {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        'warning': {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        'error': {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },

        // Legacy colors for backward compatibility
        'electric-blue': '#00BFFF',
        'neon-aqua': '#0DFEFF',
        'dark-bg': '#0A0A0F',
        'dark-secondary': '#1F1F27',
        'dark-tertiary': '#2A2A35',
        'text-primary': '#FFFFFF',
        'text-secondary': '#AEEFFF',
        'text-muted': '#888888',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'monospace'],
        'rajdhani': ['Rajdhani', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'electric': '0 0 20px rgba(0, 191, 255, 0.3), 0 0 40px rgba(0, 191, 255, 0.1)',
        'electric-hover': '0 0 30px rgba(0, 191, 255, 0.5), 0 0 60px rgba(0, 191, 255, 0.2)',
        'aqua': '0 0 15px rgba(13, 254, 255, 0.4), 0 0 30px rgba(13, 254, 255, 0.2)',
        'badge': '0 0 10px rgba(0, 191, 255, 0.3)',
        'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 25px rgba(0, 0, 0, 0.12)',
        'large': '0 8px 40px rgba(0, 0, 0, 0.16)',
      },
      backgroundImage: {
        'circuit': "radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.1) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(13, 254, 255, 0.1) 1px, transparent 1px)",
        'gradient-primary': 'linear-gradient(135deg, #00BFFF 0%, #0DFEFF 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      },
      animation: {
        'electric-pulse': 'electric-pulse 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'bounce-subtle': 'bounce-subtle 0.6s ease-out',
      },
      keyframes: {
        'electric-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 191, 255, 0.3), 0 0 40px rgba(0, 191, 255, 0.1)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 191, 255, 0.6), 0 0 60px rgba(0, 191, 255, 0.3)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}

