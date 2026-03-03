/**
 * Design Tokens - Far7i Platform
 * Unified design system for Partner and Admin spaces
 */

export const colors = {
  // Primary Palette
  primary: {
    DEFAULT: '#B79A63',
    light: '#C9B088',
    dark: '#A58952',
    50: '#FAF8F4',
    100: '#F3EFE6',
    200: '#E6DCCA',
    300: '#D9C9AE',
    400: '#CCB692',
    500: '#B79A63',
    600: '#A58952',
    700: '#8A7344',
    800: '#6F5D37',
    900: '#54472A',
  },
  
  // Secondary Palette
  secondary: {
    DEFAULT: '#1E1E1E',
    light: '#2D2D2D',
    dark: '#0F0F0F',
    50: '#F5F5F5',
    100: '#E8E8E8',
    200: '#D1D1D1',
    300: '#BABABA',
    400: '#A3A3A3',
    500: '#6B6B6B',
    600: '#545454',
    700: '#3D3D3D',
    800: '#2D2D2D',
    900: '#1E1E1E',
  },
  
  // Background
  background: {
    primary: '#FDFCFB',
    secondary: '#F8F5F0',
    tertiary: '#EBE6DA',
    dark: '#1E1E1E',
  },
  
  // Borders
  border: {
    DEFAULT: '#D4D2CF',
    light: '#E8E6E3',
    dark: '#C0BEB8',
  },
  
  // Status Colors
  status: {
    success: {
      bg: '#E6F4EA',
      text: '#1E7E34',
      border: '#A8D5B5',
    },
    warning: {
      bg: '#FEF3C7',
      text: '#F59E0B',
      border: '#FCD34D',
    },
    error: {
      bg: '#FEE2E2',
      text: '#DC2626',
      border: '#FCA5A5',
    },
    info: {
      bg: '#DBEAFE',
      text: '#2563EB',
      border: '#93C5FD',
    },
    pending: {
      bg: '#FEF3C7',
      text: '#D97706',
      border: '#FCD34D',
    },
    approved: {
      bg: '#E6F4EA',
      text: '#1E7E34',
      border: '#A8D5B5',
    },
    rejected: {
      bg: '#FEE2E2',
      text: '#DC2626',
      border: '#FCA5A5',
    },
    draft: {
      bg: '#F3F3F3',
      text: '#6B6B6B',
      border: '#D1D1D1',
    },
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px',
} as const;

export const borderRadius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
} as const;

export const typography = {
  fontFamily: {
    serif: 'Georgia, "Times New Roman", serif',
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },
  fontSize: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.2em',
  },
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  gold: '0 4px 14px 0 rgba(183, 154, 99, 0.2)',
  'gold-lg': '0 10px 30px 0 rgba(183, 154, 99, 0.3)',
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  DEFAULT: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Helper function to get status color
export const getStatusColor = (status: keyof typeof colors.status) => {
  return colors.status[status] || colors.status.draft;
};

// Helper function for consistent card styles
export const cardStyles = {
  base: `bg-white border border-[${colors.border.DEFAULT}] rounded-2xl shadow-sm transition-all duration-300`,
  hover: 'hover:border-[#B79A63] hover:-translate-y-0.5 hover:shadow-md',
  elevated: `shadow-md hover:shadow-lg`,
} as const;

// Helper function for consistent button styles
export const buttonStyles = {
  primary: `bg-[#1E1E1E] text-[#B79A63] hover:bg-black hover:scale-105 active:scale-95 transition-all duration-300`,
  secondary: `border-2 border-[#1E1E1E] text-[#1E1E1E] hover:bg-[#1E1E1E] hover:text-white transition-all duration-300`,
  ghost: `text-[#1E1E1E] hover:bg-[#F8F5F0] transition-all duration-300`,
  danger: `bg-red-600 text-white hover:bg-red-700 transition-all duration-300`,
} as const;

// Helper function for consistent input styles
export const inputStyles = {
  base: `w-full rounded-xl border border-[${colors.border.DEFAULT}] bg-[#F8F5F0]/30 px-4 py-3 text-sm focus:border-[#B79A63] focus:ring-2 focus:ring-[#B79A63]/20 outline-none transition-all`,
  error: `border-red-500 focus:border-red-500 focus:ring-red-500/20`,
  disabled: `bg-gray-100 cursor-not-allowed opacity-60`,
} as const;

// Helper function for consistent badge styles
export const badgeStyles = {
  base: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest`,
  sizes: {
    sm: 'text-[8px] px-2 py-0.5',
    md: 'text-[10px] px-2.5 py-1',
    lg: 'text-xs px-3 py-1.5',
  },
} as const;

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  transitions,
  breakpoints,
  getStatusColor,
  cardStyles,
  buttonStyles,
  inputStyles,
  badgeStyles,
};
