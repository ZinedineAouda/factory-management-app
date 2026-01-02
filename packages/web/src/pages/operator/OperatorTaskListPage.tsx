import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Schedule,
  Pending,
  Add,
  Report,
} from '@mui/icons-material';
import Header from '../../components/layout/Header';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

const OperatorTaskListPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ApiEndpoints.TASKS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'pending':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle />;
      case 'in_progress':
        return <Schedule />;
      case 'pending':
        return <Pending />;
      default:
        return <Assignment />;
    }
  };

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Maintenance Tasks
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/operator/tasks/create')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
              },
            }}
          >
            Create Task
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : tasks.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No maintenance tasks found
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => navigate('/operator/tasks/create')}
              sx={{ mt: 2 }}
            >
              Create Your First Task
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid item xs={12} key={task.id}>
                <Card
                  elevation={2}
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/operator/tasks/${task.id}`)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {task.title}
                        </Typography>
                        {task.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {task.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                          <Chip
                            label={task.status}
                            color={getStatusColor(task.status) as any}
                            size="small"
                            icon={getStatusIcon(task.status)}
                          />
                          {task.groupName && (
                            <Chip label={`Group: ${task.groupName}`} size="small" variant="outlined" />
                          )}
                          {task.priority && (
                            <Chip label={`Priority: ${task.priority}`} size="small" variant="outlined" />
                          )}
                        </Box>
                        {task.progressPercentage !== undefined && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                              Progress: {task.progressPercentage}%
                            </Typography>
                            <Box
                              sx={{
                                width: '100%',
                                height: 8,
                                bgcolor: 'grey.200',
                                borderRadius: 1,
                                mt: 0.5,
                                overflow: 'hidden',
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${task.progressPercentage}%`,
                                  height: '100%',
                                  bgcolor: 'primary.main',
                                }}
                              />
                            </Box>
                          </Box>
                        )}
                      </Box>
                      <Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Report />}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/operator/tasks/${task.id}/report`);
                          }}
                          sx={{ mt: 1 }}
                        >
                          Report
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
};

export default OperatorTaskListPage;

