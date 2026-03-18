/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f0ff',
          100: '#e2e1ff',
          200: '#cac8ff',
          300: '#aaa5ff',
          400: '#8878ff',
          500: '#6d4dff',
          600: '#5e2ef7',
          700: '#4f1de3',
          800: '#4118be',
          900: '#36169a',
          950: '#200b5e',
        },
        dark: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a26',
          600: '#222235',
          500: '#2d2d45',
          400: '#3d3d5c',
        },
        accent: {
          green: '#00e5a0',
          pink: '#ff3d9a',
          amber: '#ffb800',
          blue: '#00b4ff',
        }
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Cabinet Grotesk', 'Sora', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(252,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(300,100%,65%,0.08) 0px, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(109,77,255,0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(109,77,255,0.6), 0 0 40px rgba(109,77,255,0.2)' },
        },
      },
    },
  },
  plugins: [],
}
