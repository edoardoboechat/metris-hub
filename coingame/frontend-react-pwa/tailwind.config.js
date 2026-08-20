/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aether-cyan': '#00E5FF',
        'aether-dark': '#0b1326',
        'aether-slate': '#1b2735',
        'aether-gold': '#FFD700',
      },
      fontFamily: {
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 229, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.6)' },
        }
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(to right, #22d3ee, #00E5FF)',
      }
    },
  },
  plugins: [],
}
