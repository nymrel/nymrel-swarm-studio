export const TOKENS = {
  colors: {
    bg: {
      canvas: '#FAF8F2',       // Warm Paper Cream
      surface: '#F4F0E6',      // Soft Linen
      surfaceElevated: '#FFFFFF', // Clean Paper White
      surfaceAlt: '#EAE4D7',   // Sand Paper
      surfaceHighlight: '#F0ECE1',
    },
    text: {
      primary: '#2A332E',      // Cedar Green / Dark Bark
      secondary: '#656E66',    // Slate Bark
      muted: '#8E8A80',        // Stone Mist
      inverse: '#FAF8F2',
    },
    border: {
      subtle: '#EAE5DB',
      default: '#E2DDD2',      // Warm Stone
      active: '#C7BFB1',
      focus: '#A8541F',        // Terracotta
    },
    brand: {
      terracotta: '#A8541F',
      terracottaHover: '#8E4314',
      terracottaLight: '#FBEFEA',
      cedar: '#2A332E',
      cedarLight: '#E8EFEA',
    },
    status: {
      success: '#3B7A57',      // Sage Olive
      successLight: '#EEF5F1',
      warning: '#C88A2E',      // Ochre Amber
      warningLight: '#FDF6EC',
      danger: '#9E2A2B',       // Crimson Rust
      dangerLight: '#FDF0F0',
      info: '#2C6E8F',         // Slate Azure
      infoLight: '#EDF5F8',
    },
    provider: {
      openai: '#10A37F',
      anthropic: '#D97706',
      google: '#4285F4',
      ollama: '#6B7280',
      cloudflare: '#F38020',
    }
  },
  typography: {
    fontSans: '"Instrument Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSerif: '"Newsreader", Georgia, serif',
    fontMono: '"JetBrains Mono", Menlo, Consolas, monospace',
  },
  shadows: {
    sm: '0 1px 2px rgba(42, 51, 46, 0.04)',
    md: '0 4px 12px rgba(42, 51, 46, 0.06), 0 1px 3px rgba(42, 51, 46, 0.04)',
    lg: '0 12px 28px rgba(42, 51, 46, 0.08), 0 2px 6px rgba(42, 51, 46, 0.04)',
    focus: '0 0 0 3px rgba(168, 84, 31, 0.2)',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    full: '9999px',
  }
} as const;

export type ThemeTokens = typeof TOKENS;
