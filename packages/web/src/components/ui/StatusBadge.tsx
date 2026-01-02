import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { colors } from '../../theme';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary';

interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: 'small' | 'medium';
  dot?: boolean;
}

const statusColors: Record<StatusType, { bg: string; text: string; dot: string }> = {
  success: {
    bg: alpha(colors.success[500], 0.12),
    text: colors.success[500],
    dot: colors.success[500],
  },
  warning: {
    bg: alpha(colors.warning[500], 0.12),
    text: colors.warning[500],
    dot: colors.warning[500],
  },
  error: {
    bg: alpha(colors.error[500], 0.12),
    text: colors.error[500],
    dot: colors.error[500],
  },
  info: {
    bg: alpha(colors.info[500], 0.12),
    text: colors.info[500],
    dot: colors.info[500],
  },
  primary: {
    bg: alpha(colors.primary[500], 0.12),
    text: colors.primary[400],
    dot: colors.primary[500],
  },
  default: {
    bg: colors.neutral[800],
    text: colors.neutral[400],
    dot: colors.neutral[500],
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'medium',
  dot = true,
}) => {
  const colorScheme = statusColors[status] || statusColors.default;
  const isSmall = size === 'small';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: isSmall ? 1 : 1.5,
        py: isSmall ? 0.25 : 0.5,
        borderRadius: isSmall ? 1 : 1.5,
        backgroundColor: colorScheme.bg,
      }}
    >
      {dot && (
        <Box
          sx={{
            width: isSmall ? 6 : 8,
            height: isSmall ? 6 : 8,
            borderRadius: '50%',
            backgroundColor: colorScheme.dot,
          }}
        />
      )}
      <Typography
        sx={{
          fontSize: isSmall ? '0.6875rem' : '0.75rem',
          fontWeight: 600,
          color: colorScheme.text,
          lineHeight: 1,
          textTransform: 'capitalize',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export default StatusBadge;

