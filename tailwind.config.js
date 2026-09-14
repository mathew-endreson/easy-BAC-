/** @type {import('tailwindcss').Config} */

// Semantic surface/text/border tokens resolve to CSS variables (RGB channel
// triples defined in src/index.css under :root and .dark). This keeps opacity
// utilities working (e.g. bg-bg-soft/60) AND makes every existing usage of these
// tokens theme-aware with zero per-component edits. Brand `primary` colors stay
// static — the red reads well on both light and dark grounds.
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#AB1017',
        'primary-dark': '#7C111A',
        'primary-deep': '#410702',
        'primary-strong': '#BB181D',
        'primary-soft': '#FFE2E4',
        'primary-pale': '#FAEBEB',
        'primary-accent': '#CE2026',
        'primary-glow': '#FFBCBC',
        'primary-rose': '#B07076',
        ink: withVar('--c-ink'),
        'ink-muted': withVar('--c-ink-muted'),
        'border-soft': withVar('--c-border-soft'),
        'border-light': withVar('--c-border-light'),
        'border-card': withVar('--c-border-card'),
        'bg-card': withVar('--c-bg-card'),
        'bg-card-alt': withVar('--c-bg-card-alt'),
        'bg-soft': withVar('--c-bg-soft'),
        'bg-page': withVar('--c-bg-page'),
        // `surface` = the neutral card/panel surface used by new components;
        // maps to white in light mode and an elevated slate in dark mode.
        surface: withVar('--c-surface'),
        'surface-muted': withVar('--c-surface-muted'),
        'footer-bg': '#4B0B05',
        'footer-text': '#B7B7B7'
      },
      fontFamily: {
        body: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        outfit: ['Outfit', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'ez-xs': '0.64rem',
        'ez-sm': '0.8rem',
        'ez-base': '1rem',
        'ez-lg': '1.25rem',
        'ez-xl': '1.563rem',
        'ez-2xl': '1.953rem',
        'ez-3xl': '2.441rem',
        'ez-4xl': '3.052rem',
        'ez-5xl': '3.815rem'
      },
      maxWidth: {
        container: '1295px'
      },
      borderRadius: {
        pill: '80px'
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '50%': { transform: 'translateX(5px)' },
          '75%': { transform: 'translateX(-5px)' }
        },
        successPop: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' }
        },
        slideInBlurred: {
          '0%': { transform: 'translateY(50px) scale(0.9)', filter: 'blur(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', filter: 'blur(0)', opacity: '1' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(1deg)' }
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(187, 24, 29, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(187, 24, 29, 0.6)' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pop: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '70%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        shake: 'shake 0.4s ease',
        'success-pop': 'successPop 0.4s ease',
        'reveal-cinematic': 'slideInBlurred 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        float: 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s infinite',
        'fade-in': 'fadeIn 0.4s ease',
        pop: 'pop 0.5s ease'
      }
    }
  },
  plugins: []
}
