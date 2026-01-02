import React from 'react';
import { Chip } from '@mui/material';
import { TaskPriority, PriorityConfig } from '@factory-app/shared';

interface PriorityBadgeProps {
  priority: TaskPriority;
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = PriorityConfig[priority];

  return (
    <Chip
      label={config.label}
      size="small"
      sx={{
        backgroundColor: config.backgroundColor,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.75rem',
      }}
    />
  );
};

export default PriorityBadge;

