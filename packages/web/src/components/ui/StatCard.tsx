import React from 'react';
import { Box, Typography, alpha } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import { colors } from '../../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: {
    value: number;
    label?: string;
    positive?: boolean;
  };
  subtitle?: string;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

const colorMap = {
  primary: colors.primary[500],
  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  info: colors.info[500],
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  subtitle,
  color = 'primary',
}) => {
  const accentColor = colorMap[color];

  return (
    <Box
      sx={{
        backgroundColor: colors.neutral[900],
        border: `1px solid ${colors.neutral[800]}`,
        borderRadius: 3,
        p: 3,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: colors.neutral[700],
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography
          sx={{
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: colors.neutral[400],
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </Typography>
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              backgroundColor: alpha(accentColor, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              '& .MuiSvgIcon-root': {
                fontSize: 20,
              },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      <Typography
        sx={{
          fontSize: '2rem',
          fontWeight: 700,
          color: colors.neutral[50],
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>

      {(change || subtitle) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
          {change && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                borderRadius: 1,
                backgroundColor: alpha(
                  change.positive !== false ? colors.success[500] : colors.error[500],
                  0.1
                ),
              }}
            >
              {change.positive !== false ? (
                <TrendingUp sx={{ fontSize: 14, color: colors.success[500] }} />
              ) : (
                <TrendingDown sx={{ fontSize: 14, color: colors.error[500] }} />
              )}
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: change.positive !== false ? colors.success[500] : colors.error[500],
                }}
              >
                {Math.abs(change.value)}%
              </Typography>
            </Box>
          )}
          <Typography
            sx={{
              fontSize: '0.8125rem',
              color: colors.neutral[500],
            }}
          >
            {change?.label || subtitle}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StatCard;

