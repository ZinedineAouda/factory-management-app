import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Chip,
  LinearProgress,
  Box,
} from '@mui/material';
import {
  ArrowForward,
  CalendarToday,
  CheckCircle,
  PlayArrow,
  Pending,
  Cancel,
} from '@mui/icons-material';
import { Task } from '@factory-app/shared';
import PriorityBadge from './PriorityBadge';
import { styled, keyframes } from '@mui/material/styles';

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const StyledCard = styled(Card)({
  cursor: 'pointer',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '20px',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
  backdropFilter: 'blur(10px)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent)',
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    transform: 'translateY(-12px) scale(1.02)',
    boxShadow: '0 20px 40px rgba(102, 126, 234, 0.2)',
    borderColor: '#667eea',
    '&::before': {
      left: '100%',
    },
    '& .arrow-icon': {
      transform: 'translateX(4px)',
      opacity: 1,
    },
  },
});

const StatusIcon = ({ status }: { status: string }) => {
  const icons = {
    completed: <CheckCircle sx={{ fontSize: 20, color: '#4CAF50' }} />,
    in_progress: <PlayArrow sx={{ fontSize: 20, color: '#2196F3' }} />,
    pending: <Pending sx={{ fontSize: 20, color: '#FF9800' }} />,
    cancelled: <Cancel sx={{ fontSize: 20, color: '#F44336' }} />,
  };
  return icons[status as keyof typeof icons] || icons.pending;
};

const AnimatedProgress = styled(LinearProgress)(({ value }: { value: number }) => ({
  height: 10,
  borderRadius: 10,
  background: 'rgba(102, 126, 234, 0.1)',
  '& .MuiLinearProgress-bar': {
    borderRadius: 10,
    background: `linear-gradient(90deg, #667eea ${value}%, #764ba2 ${value}%)`,
    backgroundSize: '200% 100%',
    animation: `${shimmer} 2s linear infinite`,
  },
}));

const ArrowIcon = styled(ArrowForward)({
  position: 'absolute',
  bottom: 16,
  right: 16,
  opacity: 0,
  transition: 'all 0.3s ease',
  fontSize: '1.25rem',
  color: '#667eea',
});

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: '#4CAF50',
      in_progress: '#2196F3',
      pending: '#FF9800',
      cancelled: '#F44336',
    };
    return colors[status] || colors.pending;
  };

  return (
    <StyledCard onClick={onClick}>
      <CardHeader
        title={
          <Typography
            variant="h6"
            fontWeight={700}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            {task.title}
          </Typography>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <PriorityBadge priority={task.priority} />
            <Chip
              icon={<StatusIcon status={task.status} />}
              label={task.status.replace('_', ' ').toUpperCase()}
              size="small"
              sx={{
                bgcolor: `${getStatusColor(task.status)}15`,
                color: getStatusColor(task.status),
                fontWeight: 600,
                fontSize: '0.7rem',
                height: '24px',
              }}
            />
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Due: {formatDate(task.deadline)}
          </Typography>
        </Box>

        {task.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
            }}
          >
            {task.description}
          </Typography>
        )}

        {task.departmentName && (
          <Chip
            label={task.departmentName}
            size="small"
            sx={{
              mb: 2,
              bgcolor: '#667eea15',
              color: '#667eea',
              fontWeight: 600,
              alignSelf: 'flex-start',
            }}
          />
        )}

        {task.progressPercentage > 0 && (
          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Progress
              </Typography>
              <Typography variant="caption" fontWeight={700} color="primary">
                {task.progressPercentage}%
              </Typography>
            </Box>
            <AnimatedProgress variant="determinate" value={task.progressPercentage} />
          </Box>
        )}

        <ArrowIcon className="arrow-icon" />
      </CardContent>
    </StyledCard>
  );
};

export default TaskCard;
