import { createTheme, alpha } from '@mui/material/styles';

// ============================================
// DESIGN SYSTEM - Enterprise SaaS Dashboard
// Inspired by: Linear, Vercel, Stripe, Notion
// ============================================

// Color Palette
const colors = {
  // Primary - Deep Blue
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1', // Main
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  // Neutral - Slate
  neutral: {
    0: '#FFFFFF',
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  // Semantic Colors
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  error: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
};

// Spacing Scale (4px base)
const spacing = 4;

// Border Radius Scale
const borderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
};

// Typography Scale
const typography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMono: '"JetBrains Mono", "Fira Code", monospace',
};

// Shadows (subtle, professional)
const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary[500],
      light: colors.primary[400],
      dark: colors.primary[600],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: colors.neutral[400],
      light: colors.neutral[300],
      dark: colors.neutral[500],
    },
    error: {
      main: colors.error[500],
      light: colors.error[100],
      dark: colors.error[700],
    },
    warning: {
      main: colors.warning[500],
      light: colors.warning[100],
      dark: colors.warning[700],
    },
    info: {
      main: colors.info[500],
      light: colors.info[100],
      dark: colors.info[700],
    },
    success: {
      main: colors.success[500],
      light: colors.success[100],
      dark: colors.success[700],
    },
    background: {
      default: colors.neutral[950],
      paper: colors.neutral[900],
    },
    text: {
      primary: colors.neutral[50],
      secondary: colors.neutral[400],
      disabled: colors.neutral[600],
    },
    divider: colors.neutral[800],
    action: {
      active: colors.neutral[400],
      hover: alpha(colors.neutral[400], 0.08),
      selected: alpha(colors.primary[500], 0.16),
      disabled: colors.neutral[700],
      disabledBackground: colors.neutral[800],
    },
  },
  typography: {
    fontFamily: typography.fontFamily,
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: colors.neutral[400],
    },
    overline: {
      fontSize: '0.6875rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: colors.neutral[400],
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: borderRadius.md,
  },
  spacing: spacing,
  shadows: [
    'none',
    shadows.xs,
    shadows.sm,
    shadows.sm,
    shadows.md,
    shadows.md,
    shadows.md,
    shadows.lg,
    shadows.lg,
    shadows.lg,
    shadows.lg,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        body: {
          backgroundColor: colors.neutral[950],
          color: colors.neutral[50],
        },
        '::-webkit-scrollbar': {
          width: 8,
          height: 8,
        },
        '::-webkit-scrollbar-track': {
          background: colors.neutral[900],
        },
        '::-webkit-scrollbar-thumb': {
          background: colors.neutral[700],
          borderRadius: 4,
          '&:hover': {
            background: colors.neutral[600],
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 16px',
          transition: 'all 0.15s ease',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.8125rem',
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '0.9375rem',
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${colors.primary[400]} 0%, ${colors.primary[500]} 100%)`,
          },
        },
        outlined: {
          borderColor: colors.neutral[700],
          '&:hover': {
            borderColor: colors.neutral[600],
            backgroundColor: alpha(colors.neutral[500], 0.08),
          },
        },
        text: {
          '&:hover': {
            backgroundColor: alpha(colors.neutral[500], 0.08),
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: alpha(colors.neutral[500], 0.08),
          },
        },
        sizeSmall: {
          padding: 6,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.xl,
          backgroundColor: colors.neutral[900],
          border: `1px solid ${colors.neutral[800]}`,
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: colors.neutral[700],
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.neutral[900],
        },
        outlined: {
          borderColor: colors.neutral[800],
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.md,
            backgroundColor: colors.neutral[900],
            '& fieldset': {
              borderColor: colors.neutral[800],
              transition: 'border-color 0.15s ease',
            },
            '&:hover fieldset': {
              borderColor: colors.neutral[600],
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary[500],
              borderWidth: 1,
            },
          },
          '& .MuiInputBase-input': {
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.neutral[800]}`,
          backgroundColor: colors.neutral[900],
          boxShadow: shadows.lg,
          marginTop: 4,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          padding: '8px 12px',
          borderRadius: borderRadius.sm,
          margin: '2px 4px',
          '&:hover': {
            backgroundColor: alpha(colors.neutral[500], 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary[500], 0.12),
            '&:hover': {
              backgroundColor: alpha(colors.primary[500], 0.16),
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius.xl,
          backgroundColor: colors.neutral[900],
          border: `1px solid ${colors.neutral[800]}`,
          boxShadow: shadows.xl,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 600,
          padding: '20px 24px 16px',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px 20px',
          gap: 8,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.neutral[800]}`,
          overflow: 'hidden',
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: colors.neutral[900],
            borderBottom: `1px solid ${colors.neutral[800]}`,
            fontWeight: 600,
            fontSize: '0.75rem',
            color: colors.neutral[400],
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '12px 16px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root': {
            '&:hover': {
              backgroundColor: alpha(colors.neutral[500], 0.04),
            },
            '&:last-child .MuiTableCell-root': {
              borderBottom: 'none',
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.neutral[800]}`,
          padding: '12px 16px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: 24,
        },
        filled: {
          '&.MuiChip-colorDefault': {
            backgroundColor: colors.neutral[800],
            color: colors.neutral[300],
          },
          '&.MuiChip-colorPrimary': {
            backgroundColor: alpha(colors.primary[500], 0.15),
            color: colors.primary[400],
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: alpha(colors.success[500], 0.15),
            color: colors.success[500],
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: alpha(colors.warning[500], 0.15),
            color: colors.warning[500],
          },
          '&.MuiChip-colorError': {
            backgroundColor: alpha(colors.error[500], 0.15),
            color: colors.error[500],
          },
          '&.MuiChip-colorInfo': {
            backgroundColor: alpha(colors.info[500], 0.15),
            color: colors.info[500],
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          fontSize: '0.875rem',
        },
        standardError: {
          backgroundColor: alpha(colors.error[500], 0.1),
          color: colors.error[500],
          '& .MuiAlert-icon': {
            color: colors.error[500],
          },
        },
        standardWarning: {
          backgroundColor: alpha(colors.warning[500], 0.1),
          color: colors.warning[500],
          '& .MuiAlert-icon': {
            color: colors.warning[500],
          },
        },
        standardSuccess: {
          backgroundColor: alpha(colors.success[500], 0.1),
          color: colors.success[500],
          '& .MuiAlert-icon': {
            color: colors.success[500],
          },
        },
        standardInfo: {
          backgroundColor: alpha(colors.info[500], 0.1),
          color: colors.info[500],
          '& .MuiAlert-icon': {
            color: colors.info[500],
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 40,
        },
        indicator: {
          height: 2,
          borderRadius: 1,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          padding: '8px 16px',
          fontSize: '0.875rem',
          fontWeight: 500,
          textTransform: 'none',
          color: colors.neutral[400],
          '&.Mui-selected': {
            color: colors.neutral[50],
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.neutral[800],
          color: colors.neutral[100],
          fontSize: '0.75rem',
          padding: '6px 10px',
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.neutral[700]}`,
        },
        arrow: {
          color: colors.neutral[800],
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          fontSize: '0.625rem',
          fontWeight: 600,
          minWidth: 16,
          height: 16,
          padding: '0 4px',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.full,
          height: 4,
          backgroundColor: colors.neutral[800],
        },
        bar: {
          borderRadius: borderRadius.full,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: colors.primary[500],
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.neutral[950],
          borderRight: `1px solid ${colors.neutral[800]}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: colors.neutral[950],
          borderBottom: `1px solid ${colors.neutral[800]}`,
          boxShadow: 'none',
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
        },
        separator: {
          color: colors.neutral[600],
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.md,
          '&:hover': {
            backgroundColor: alpha(colors.neutral[500], 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary[500], 0.12),
            '&:hover': {
              backgroundColor: alpha(colors.primary[500], 0.16),
            },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
          color: colors.neutral[400],
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: colors.neutral[800],
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: colors.neutral[800],
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 44,
          height: 24,
          padding: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        switchBase: {
          padding: 2,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            '& + .MuiSwitch-track': {
              backgroundColor: colors.primary[500],
              opacity: 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          },
          '&:hover': {
            '& + .MuiSwitch-track': {
              backgroundColor: colors.neutral[600],
              transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&.Mui-checked + .MuiSwitch-track': {
              backgroundColor: colors.primary[600],
              transition: 'background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            },
          },
        },
        thumb: {
          width: 20,
          height: 20,
          backgroundColor: '#fff',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
          '&:hover': {
            boxShadow: `0 2px 8px ${alpha(colors.primary[500], 0.3)}`,
          },
        },
        track: {
          borderRadius: 12,
          backgroundColor: colors.neutral[700],
          opacity: 1,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
  },
});

// Export colors for custom usage
export { colors, shadows, borderRadius };
