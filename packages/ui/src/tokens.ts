export const tokens = {
  color: {
    brand: {
      primary:      '#3353FE',
      primaryHover: '#1F4CEE',
      accent:       '#32B7EE',
    },
    bg: {
      base:   '#FFFFFF',
      subtle: '#F8FAFC',
      muted:  '#F1F5F9',
    },
    border: {
      default: '#E6E5EC',
      strong:  '#CBD5E1',
    },
    text: {
      primary:   '#0F172A',
      secondary: '#64748B',
      tertiary:  '#94A3B8',
      inverse:   '#FFFFFF',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      danger:  '#EF4444',
      info:    '#32B7EE',
    },
  },
  gradient: {
    brand: 'linear-gradient(90deg, #1F4CEE 0%, #41A7FE 50%, #32B7EE 100%)',
  },
  font: {
    body:    '"Inter", system-ui, sans-serif',
    heading: '"Maven Pro", "Inter", sans-serif',
    mono:    '"JetBrains Mono", ui-monospace, monospace',
  },
  radius: { sm: '4px', md: '6px', lg: '8px', xl: '12px', full: '9999px' },
  shadow: {
    xs: '0 1px 2px rgba(15,23,42,0.04)',
    sm: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
    md: '0 4px 12px rgba(15,23,42,0.06)',
    lg: '0 10px 24px rgba(15,23,42,0.08)',
  },
} as const;
