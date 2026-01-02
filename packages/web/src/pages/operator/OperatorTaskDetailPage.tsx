import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Grid,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Schedule,
  Pending,
  ArrowBack,
  Report,
} from '@mui/icons-material';
import Header from '../../components/layout/Header';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

const OperatorTaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ApiEndpoints.TASKS.DETAIL(taskId!), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTask(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch task');
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

  if (loading) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  if (error || !task) {
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error">{error || 'Task not found'}</Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/operator/tasks')}
            sx={{ mt: 2 }}
          >
            Back to Tasks
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/operator/tasks')}
            variant="outlined"
          >
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={<Report />}
            onClick={() => navigate(`/operator/tasks/${taskId}/report`)}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
              },
            }}
          >
            Create Report
          </Button>
        </Box>

        <Card elevation={3}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                {task.title}
              </Typography>
              <Chip
                label={task.status}
                color={getStatusColor(task.status) as any}
                size="medium"
              />
            </Box>

            {task.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {task.description}
                </Typography>
              </Box>
            )}

            {task.additionalInfo && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Additional Information
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {task.additionalInfo}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Group
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {task.groupName || 'Not assigned'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Priority
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {task.priority || 'Not set'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  Deadline
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}
                </Typography>
              </Grid>
              {task.progressPercentage !== undefined && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Progress: {task.progressPercentage}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={task.progressPercentage}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default OperatorTaskDetailPage;

