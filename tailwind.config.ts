import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      // Tipografia base sugerida
      fontFamily: {
        sans: ['Poppins', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      // Easing cinematográfica
      transitionTimingFunction: {
        cine: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      // Sombras padrão
      boxShadow: {
        cine: '0 0 20px rgba(0, 184, 255, 0.15)',
        card: '0 4px 12px rgba(0,0,0,0.06)',
      },
      // Raio extra
      borderRadius: {
        cine: '1.5rem',
      },
      // Animação de transição de tema
      keyframes: {
        themefade: {
          '0%': { opacity: 0, filter: 'blur(4px)' },
          '100%': { opacity: 1, filter: 'blur(0)' },
        },
      },
      animation: {
        themefade: 'themefade .4s both',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      const baseUtils = {
        // Utilitários baseados em variáveis CSS do tema
        '.bg-cine': { backgroundColor: 'var(--cine-bg)' },
        '.bg-cine-surface': { backgroundColor: 'var(--cine-surface)' },
        '.text-cine': { color: 'var(--cine-text)' },
        '.text-cine-muted': { color: 'var(--cine-text-muted)' },
        '.border-cine': { borderColor: 'var(--cine-border)' },
        '.ring-cine-primary': { '--tw-ring-color': 'var(--cine-primary)' },
        '.shadow-cine': { boxShadow: '0 0 20px var(--cine-primary-15)' },
        '.gradient-cine': { backgroundImage: 'linear-gradient(135deg, var(--cine-primary) 0%, var(--cine-secondary) 100%)' },
        '.hover-cine': { backgroundColor: 'var(--cine-hover)' },
      };
      // Habilita variantes dark para utilitários base
      addUtilities(baseUtils, ['dark']);

      // Aliases legados usados no AppShell (compatibilização)
      const legacyAliases = {
        '.text-cine-light-text': { color: 'var(--cine-text)' },
        '.text-cine-light-textMuted': { color: 'var(--cine-text-muted)' },
        '.text-cine-dark-text': { color: 'var(--cine-text)' },
        '.text-cine-dark-textMuted': { color: 'var(--cine-text-muted)' },
        '.border-cine-light-border': { borderColor: 'var(--cine-border)' },
        '.border-cine-dark-border': { borderColor: 'var(--cine-border)' },
      };
      addUtilities(legacyAliases, ['dark']);
    },
  ],
} satisfies Config
