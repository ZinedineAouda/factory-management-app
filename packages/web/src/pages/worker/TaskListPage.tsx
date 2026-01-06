import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  CircularProgress,
  Box,
  Card,
  CardContent,
  Alert,
  Button,
  Fade,
  Zoom,
  Grow,
} from '@mui/material';
import {
  Refresh,
  Assignment,
} from '@mui/icons-material';
import Header from '../../components/layout/Header';
import TaskCard from '../../components/task/TaskCard';
import { fetchTasks } from '../../store/slices/taskSlice';
import { refreshUser } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { styled, keyframes } from '@mui/material/styles';

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.98);
  }
`;

const StyledCard = styled(Card)({
  textAlign: 'center',
  py: 8,
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
  backdropFilter: 'blur(10px)',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  animation: `${pulse} 3s ease-in-out infinite`,
});

const TaskListPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { tasks, loading, error } = useSelector((state: RootState) => state.tasks);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Refresh user data first to get latest department assignment
    dispatch(refreshUser());
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(refreshUser());
    dispatch(fetchTasks());
  };

  return (
    <>
      <Header />
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          minHeight: 'calc(100vh - 64px)',
          pb: 4,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ pt: 4, position: 'relative' }}>
          <Fade in timeout={600}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography
                  variant="h3"
                  component="h1"
                  gutterBottom
                  fontWeight="bold"
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1,
                  }}
                >
                  Your Tasks
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                  Manage and track your assigned tasks
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={handleRefresh}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  px: 3,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Refresh
              </Button>
            </Box>
          </Fade>

          {error && (
            <Fade in>
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  borderRadius: '12px',
                  '& .MuiAlert-icon': {
                    fontSize: '1.5rem',
                  },
                }}
                onClose={() => {}}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {!user?.departmentId && (
            <Fade in>
              <Alert
                severity="warning"
                icon={<Assignment />}
                sx={{
                  mb: 2,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 193, 7, 0.05) 100%)',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                }}
              >
                <Typography variant="body2" fontWeight={600}>
                  <strong>No Department Assigned:</strong> You need to be assigned to a department to see tasks.
                  Please contact your administrator to assign you to a department.
                </Typography>
              </Alert>
            </Fade>
          )}

          {loading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="400px"
            >
              <Zoom in>
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress
                    size={64}
                    thickness={4}
                    sx={{
                      color: '#667eea',
                      animationDuration: '1.5s',
                    }}
                  />
                  <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                    Loading tasks...
                  </Typography>
                </Box>
              </Zoom>
            </Box>
          ) : tasks.length === 0 ? (
            <Zoom in timeout={600}>
              <StyledCard>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    <Assignment sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />
                  </Box>
                  <Typography variant="h5" color="text.secondary" gutterBottom fontWeight={600}>
                    No tasks assigned
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {user?.departmentId
                      ? "You don't have any tasks in your department at the moment"
                      : "You need to be assigned to a department first. Please contact your administrator."}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleRefresh}
                    sx={{
                      borderRadius: '12px',
                      px: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Refresh
                  </Button>
                </CardContent>
              </StyledCard>
            </Zoom>
          ) : (
            <Grid container spacing={3}>
              {tasks.map((task, index) => (
                <Grid item xs={12} sm={6} md={4} key={task.id}>
                  <Grow in timeout={600 + index * 100}>
                    <Box>
                      <TaskCard task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                    </Box>
                  </Grow>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>
    </>
  );
};

export default TaskListPage;
