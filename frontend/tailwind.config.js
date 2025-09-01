/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
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
      },
      boxShadow: {
        'electric': '0 0 20px rgba(0, 191, 255, 0.3), 0 0 40px rgba(0, 191, 255, 0.1)',
        'electric-hover': '0 0 30px rgba(0, 191, 255, 0.5), 0 0 60px rgba(0, 191, 255, 0.2)',
        'aqua': '0 0 15px rgba(13, 254, 255, 0.4), 0 0 30px rgba(13, 254, 255, 0.2)',
        'badge': '0 0 10px rgba(0, 191, 255, 0.3)',
      },
      backgroundImage: {
        'circuit': "radial-gradient(circle at 25% 25%, rgba(0, 191, 255, 0.1) 1px, transparent 1px), radial-gradient(circle at 75% 75%, rgba(13, 254, 255, 0.1) 1px, transparent 1px)",
      },
      animation: {
        'electric-pulse': 'electric-pulse 3s ease-in-out infinite',
      },
      keyframes: {
        'electric-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 191, 255, 0.3), 0 0 40px rgba(0, 191, 255, 0.1)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 191, 255, 0.6), 0 0 60px rgba(0, 191, 255, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}

