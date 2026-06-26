// Stub de tema para compatibilizar imports existentes após a remoção dos estilos antigos.
// Mapeia tokens mínimos para classes do tema atual (Datta Able / Bootstrap) ou strings vazias.

export const theme = {
  // Classe para superfícies/containers. Deixe vazio para não interferir.
  surface: '',
  // Classe base para cartões compatível com Bootstrap/Datta Able.
  card: 'card',
} as const

export type ThemeTokens = typeof theme