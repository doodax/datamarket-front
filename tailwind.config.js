/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Palette principale : sombre + accents néon
        ink: {
          900: '#0a0e1a',
          800: '#0f1420',
          700: '#161b2c',
          600: '#1e2438',
          500: '#2a3148',
          400: '#3a4260',
          300: '#5a6585',
          200: '#8b95b3',
          100: '#c4cae0'
        },
        terminal: {
          green: '#00ff9d',
          cyan: '#00d4ff',
          amber: '#ffb800',
          red: '#ff3860',
          purple: '#bd00ff'
        },
        risk: {
          low: '#10b981',
          medium: '#f59e0b',
          high: '#ef4444',
          critical: '#7f1d1d'
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'scan': 'scan 4s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'tick': 'tick 1s ease-out'
      },
      keyframes: {
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '50%': { boxShadow: '0 0 10px currentColor, 0 0 30px currentColor' }
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.95 }
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 }
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        },
        tick: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' }
        }
      }
    }
  },
  plugins: []
};
