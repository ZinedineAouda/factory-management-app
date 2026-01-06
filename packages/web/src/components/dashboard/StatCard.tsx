import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { SxProps, Theme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: 'linear-gradient(90deg, transparent, currentColor, transparent)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::before': {
    opacity: 1,
  },
}));

const IconWrapper = styled(Box)<{ color: string }>(({ theme, color }) => ({
  width: 56,
  height: 56,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
  color: color,
  marginBottom: theme.spacing(2),
}));

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  subtitle?: string;
  sx?: SxProps<Theme>;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  color = '#2196F3',
  trend,
  subtitle,
  sx,
}) => {
  return (
    <StyledCard sx={sx}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                mb: 0.5,
                display: 'block',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: 'text.primary',
                mb: subtitle ? 0.5 : 0,
                lineHeight: 1.2,
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: trend.positive !== false ? 'success.main' : 'error.main',
                    fontWeight: 600,
                  }}
                >
                  {trend.positive !== false ? '↑' : '↓'} {Math.abs(trend.value)}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {trend.label}
                </Typography>
              </Box>
            )}
          </Box>
          <IconWrapper color={color}>{icon}</IconWrapper>
        </Box>
      </CardContent>
    </StyledCard>
  );
};

export default StatCard;

