import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Tailwind dark mode controlado por la clase .dark en <html>
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Untitled UI Gray scale (exact Figma spec) ─────────────
        gray: {
          25:  '#FCFCFD',
          50:  '#F9FAFB',
          100: '#F2F4F7',
          200: '#E4E7EC',
          300: '#D0D5DD',
          400: '#98A2B3',
          500: '#667085',
          600: '#475467',
          700: '#344054',
          800: '#1D2939',
          900: '#101828',
          950: '#0C111D',
        },

        // ── Kubik brand = UUI brand (violet) — exact UUI values ────
        kubik: {
          25:  '#F9F5FF',
          50:  '#F9F5FF',
          100: '#F4EBFF',
          200: '#E9D7FE',
          300: '#D6BBFB',
          400: '#B692F6',
          500: '#9E77ED',
          600: '#7F56D9',
          700: '#6941C6',
          800: '#53389E',
          900: '#42307D',
          950: '#2C1C5F',
        },

        // ── Brand alias = kubik (UUI compatibility) ────────────────
        brand: {
          25:  '#F9F5FF',
          50:  '#F9F5FF',
          100: '#F4EBFF',
          200: '#E9D7FE',
          300: '#D6BBFB',
          400: '#B692F6',
          500: '#9E77ED',
          600: '#7F56D9',
          700: '#6941C6',
          800: '#53389E',
          900: '#42307D',
          950: '#2C1C5F',
        },

        // ── Status colors ─────────────────────────────────────────
        status: {
          available:    '#17B26A',
          busy:         '#F79009',
          'in-meeting': '#F04438',
          away:         '#98A2B3',
          offline:      '#667085',
        },

        // ── UUI Success scale ─────────────────────────────────────
        success: {
          25:  '#F6FEF9',
          50:  '#ECFDF3',
          100: '#D1FADF',
          200: '#A9EFC5',
          300: '#6CE9A6',
          400: '#32D583',
          500: '#12B76A',
          600: '#039855',
          700: '#027A48',
          800: '#05603A',
          900: '#054F31',
        },

        // ── UUI Warning scale ─────────────────────────────────────
        warning: {
          25:  '#FFFCF5',
          50:  '#FFFAEB',
          100: '#FEF0C7',
          200: '#FEDF89',
          300: '#FEC84B',
          400: '#FDB022',
          500: '#F79009',
          600: '#DC6803',
          700: '#B54708',
          800: '#93370D',
          900: '#7A2E0E',
        },

        // ── UUI Error scale ───────────────────────────────────────
        error: {
          25:  '#FFFBFA',
          50:  '#FEF3F2',
          100: '#FEE4E2',
          200: '#FECDCA',
          300: '#FDA29B',
          400: '#F97066',
          500: '#F04438',
          600: '#D92D20',
          700: '#B42318',
          800: '#912018',
          900: '#7A271A',
        },

        // ── UUI utility colors for badge components ────────────────
        // These reference CSS vars so dark mode inversion is automatic
        'utility-green': {
          50:  'var(--color-utility-green-50)',
          200: 'var(--color-utility-green-200)',
          500: 'var(--color-utility-green-500)',
          700: 'var(--color-utility-green-700)',
        },
        'utility-red': {
          50:  'var(--color-utility-red-50)',
          200: 'var(--color-utility-red-200)',
          500: 'var(--color-utility-red-500)',
          700: 'var(--color-utility-red-700)',
        },
        'utility-yellow': {
          50:  'var(--color-utility-yellow-50)',
          200: 'var(--color-utility-yellow-200)',
          500: 'var(--color-utility-yellow-500)',
          700: 'var(--color-utility-yellow-700)',
        },
        'utility-brand': {
          50:  'var(--color-utility-brand-50)',
          200: 'var(--color-utility-brand-200)',
          500: 'var(--color-utility-brand-500)',
          700: 'var(--color-utility-brand-700)',
        },
        'utility-neutral': {
          50:  'var(--color-utility-neutral-50)',
          200: 'var(--color-utility-neutral-200)',
          500: 'var(--color-utility-neutral-500)',
          700: 'var(--color-utility-neutral-700)',
        },
        'utility-blue': {
          50:  'var(--color-utility-blue-50)',
          200: 'var(--color-utility-blue-200)',
          500: 'var(--color-utility-blue-500)',
          700: 'var(--color-utility-blue-700)',
        },
        'utility-purple': {
          50:  'var(--color-utility-purple-50)',
          200: 'var(--color-utility-purple-200)',
          500: 'var(--color-utility-purple-500)',
          700: 'var(--color-utility-purple-700)',
        },

        // ── Kubik-specific surface tokens ─────────────────────────
        surface: {
          base:            'var(--color-bg-primary)',
          sidebar:         'var(--surface-sidebar)',
          panel:           'var(--surface-panel)',
          card:            'var(--color-bg-primary)',
          border:          'var(--color-border-secondary)',
          'border-strong': 'var(--color-border-primary)',
          hover:           'var(--color-bg-primary_hover)',
          active:          'var(--surface-active)',
        },

        // ── Map canvas ────────────────────────────────────────────
        map: {
          bg: 'var(--map-bg)',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      fontSize: {
        'xs':       ['0.75rem', { lineHeight: '1.125rem' }],
        'sm':       ['0.875rem', { lineHeight: '1.25rem' }],
        'md':       ['1rem', { lineHeight: '1.5rem' }],
        'lg':       ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':       ['1.25rem', { lineHeight: '1.875rem' }],
        '2xl':      ['1.5rem', { lineHeight: '2rem' }],
        '3xl':      ['1.875rem', { lineHeight: '2.375rem' }],
        '4xl':      ['2.25rem', { lineHeight: '2.75rem' }],
        '5xl':      ['3rem', { lineHeight: '3.75rem' }],
        // Kubik custom scale
        'label-xs': ['10px', { lineHeight: '1.4', letterSpacing: '0.07em' }],
        'label-sm': ['11px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
        'body-xs':  ['12px', { lineHeight: '1.5' }],
        'body-sm':  ['13px', { lineHeight: '1.5' }],
        'body-md':  ['14px', { lineHeight: '1.5' }],
        'title-sm': ['13px', { lineHeight: '1.4' }],
        'title-md': ['15px', { lineHeight: '1.35' }],
      },

      animation: {
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float':         'float 4s ease-in-out infinite',
        'fade-in':       'fadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-up':       'fadeUp 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in':      'slideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right':'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':      'scaleIn 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'dropdown-in':   'dropdownIn 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        'theme-switch':  'themeSwitch 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'presence-in':   'presenceIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(3px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-6px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        dropdownIn: {
          from: { opacity: '0', transform: 'translateY(-4px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        themeSwitch: {
          '0%':   { opacity: '0.6', transform: 'scale(0.96)' },
          '100%': { opacity: '1',   transform: 'scale(1)' },
        },
        presenceIn: {
          from: { opacity: '0', transform: 'scale(0.7)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },

      // Grid template areas para la oficina virtual
      gridTemplateAreas: {
        'office': '"lobby focus" "cafeteria meeting" "collab support"',
      },

      // ── Shadow scale — exact UUI values ─────────────────────────
      boxShadow: {
        'xs':               '0px 1px 2px rgba(0, 0, 0, 0.05)',
        'sm':               '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'md':               '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'lg':               '0px 12px 16px -4px rgba(0, 0, 0, 0.08), 0px 4px 6px -2px rgba(0, 0, 0, 0.03), 0px 2px 2px -1px rgba(0, 0, 0, 0.04)',
        'xl':               '0px 20px 24px -4px rgba(0, 0, 0, 0.08), 0px 8px 8px -4px rgba(0, 0, 0, 0.03), 0px 3px 3px -1.5px rgba(0, 0, 0, 0.04)',
        '2xl':              '0px 24px 48px -12px rgba(0, 0, 0, 0.18), 0px 4px 4px -2px rgba(0, 0, 0, 0.04)',
        'xs-skeuomorphic':  '0px 0px 0px 1px rgba(0,0,0,0.18) inset, 0px -2px 0px 0px rgba(0,0,0,0.05) inset, 0px 1px 2px rgba(0, 0, 0, 0.05)',
        'topbar':           'var(--shadow-topbar)',
        'dropdown':         '0px 12px 16px -4px rgba(0, 0, 0, 0.08), 0px 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'glow-kubik':       'var(--shadow-glow-kubik)',
      },

      // ── Easing functions premium ─────────────────────────────────
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring':   'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':   'cubic-bezier(0.4, 0, 0.2, 1)',
        'snappy':   'cubic-bezier(0.2, 0, 0, 1)',
      },

      // ── Duration scale ───────────────────────────────────────────
      transitionDuration: {
        'micro': '80ms',
        'fast':  '120ms',
        'base':  '180ms',
        'slow':  '280ms',
        'enter': '220ms',
      },
    },
  },
  plugins: [],
}

export default config
