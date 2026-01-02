import React from 'react';
import { Box, Typography, Button, alpha } from '@mui/material';
import { Add } from '@mui/icons-material';
import { colors } from '../../theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 4,
        textAlign: 'center',
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            backgroundColor: alpha(colors.neutral[500], 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
            color: colors.neutral[500],
            '& .MuiSvgIcon-root': {
              fontSize: 28,
            },
          }}
        >
          {icon}
        </Box>
      )}
      <Typography
        sx={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: colors.neutral[100],
          mb: 1,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          sx={{
            fontSize: '0.9375rem',
            color: colors.neutral[500],
            maxWidth: 400,
            mb: action ? 3 : 0,
          }}
        >
          {description}
        </Typography>
      )}
      {action && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;

