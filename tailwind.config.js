/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Makanan Core Palette
        'primary-mint':     '#3ECBA0',
        'primary-mint-dark':'#2DAF87',
        'primary-mint-light':'#C8F0E4',
        'near-black':       '#1A1A1A',
        'soft-teal':        '#2DAF87',
        'light-bg':         '#F2FBF7',
        'very-light-mint':  '#E6F9F2',
        'main-bg':          '#FFFFFF',
        'soft-grey':        '#F5F5F5',
        'muted-text':       '#6B7280',
        'border-light':     '#D0F0E4',
        // Functional
        'success':          '#4CAF70',
        'warning':          '#F4B054',
        'error':            '#EE7373',
        'info':             '#6BFABC',
      },
      fontFamily: {
        sans:   ['Poppins', 'system-ui', 'sans-serif'],
        serif:  ['Poppins', 'system-ui', 'sans-serif'],
        mono:   ['Poppins', 'monospace'],
      },
      fontSize: {
        'display-bold': ['clamp(2rem, 5vw, 2.75rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'hero':         ['clamp(2.5rem, 6vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'display':      ['clamp(1.75rem, 4vw, 2.5rem)', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.5rem',
        'pill': '9999px',
      },
      backgroundImage: {
        'mint-gradient':  'linear-gradient(135deg, #3ECBA0 0%, #2DAF87 100%)',
        'light-gradient': 'linear-gradient(180deg, #E6F9F2 0%, #C8F0E4 100%)',
        'hero-gradient':  'linear-gradient(180deg, #E6F9F2 0%, #C8F0E4 100%)',
      },
      boxShadow: {
        'bubble': '0 4px 16px rgba(62,203,160,0.18), 0 1.5px 4px rgba(62,203,160,0.10)',
        'card':   '0 2px 12px rgba(26,26,26,0.07)',
        'cta':    '0 4px 20px rgba(62,203,160,0.45)',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up':  'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both',
        'float':    'floatY 4s ease-in-out infinite',
        'shimmer':  'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};