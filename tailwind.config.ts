import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '720px',
      },
    },
    extend: {
      colors: {
        // 来自 ADR-003 UI 视觉语言 v2 · 鼠尾草绿 + 暖中性
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: 'hsl(var(--surface))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          soft: 'hsl(var(--primary-soft))',
        },
        neutral: {
          900: 'hsl(var(--neutral-900))',
          500: 'hsl(var(--neutral-500))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--danger))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        // ADR-003 扩展色板
        sage: {
          50:  'hsl(var(--sage-50))',
          100: 'hsl(var(--sage-100))',
          200: 'hsl(var(--sage-200))',
          300: 'hsl(var(--sage-300))',
          400: 'hsl(var(--sage-400))',  // ★ 主品牌色
          500: 'hsl(var(--sage-500))',
          600: 'hsl(var(--sage-600))',
          700: 'hsl(var(--sage-700))',
          800: 'hsl(var(--sage-800))',
          900: 'hsl(var(--sage-900))',
        },
        warm: {
          50:  'hsl(var(--warm-50))',
          100: 'hsl(var(--warm-100))',
          200: 'hsl(var(--warm-200))',
          700: 'hsl(var(--warm-700))',
          900: 'hsl(var(--warm-900))',
        },
        cactus: {
          flower: 'hsl(var(--cactus-flower))',  // 仙人掌果
          sunset:  'hsl(var(--sunset))',
          clay:    'hsl(var(--clay))',
        },
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['PingFang SC', 'Hiragino Sans GB', 'Source Han Sans SC', 'system-ui', 'sans-serif'],
        serif: ['Source Han Serif SC', 'Songti SC', 'STSong', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        // 严格 7 级（来自原型 §3.2）
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4' }],
        '3xl': ['32px', { lineHeight: '1.3' }],
      },
      spacing: {
        // 4/8/12/16/24/32/48（来自原型 §3.3）
        '4.5': '1.125rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,.04)',
        card: '0 4px 12px rgba(0,0,0,.06)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
