import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  Slider,
  TextField,
  Button,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import { CalendarToday, Business } from '@mui/icons-material';
import { ArrowBack } from '@mui/icons-material';
import Header from '../../components/layout/Header';
import PriorityBadge from '../../components/task/PriorityBadge';
import { fetchTaskDetail, updateTaskProgress } from '../../store/slices/taskSlice';
import { AppDispatch, RootState } from '../../store';

const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedTask, loading } = useSelector((state: RootState) => state.tasks);
  const [progress, setProgress] = useState(0);
  const [updateText, setUpdateText] = useState('');

  useEffect(() => {
    if (taskId) {
      dispatch(fetchTaskDetail(taskId));
    }
  }, [dispatch, taskId]);

  useEffect(() => {
    if (selectedTask) {
      setProgress(selectedTask.progressPercentage);
    }
  }, [selectedTask]);

  const handleSave = async () => {
    if (selectedTask) {
      await dispatch(updateTaskProgress({
        taskId: selectedTask.id,
        data: { progressPercentage: progress, updateText },
      }));
      navigate('/tasks');
    }
  };

  if (!selectedTask) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Header />
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          minHeight: 'calc(100vh - 64px)',
          pb: 4,
        }}
      >
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <IconButton
            onClick={() => navigate('/tasks')}
            sx={{ mb: 2, color: 'text.secondary' }}
          >
            <ArrowBack /> Back to Tasks
          </IconButton>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                {selectedTask.title}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <PriorityBadge priority={selectedTask.priority} />
              </Box>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 3,
                mb: 3,
                flexWrap: 'wrap',
              }}
            >
              <Chip
                icon={<CalendarToday />}
                label={`Due: ${new Date(selectedTask.deadline).toLocaleDateString()}`}
                variant="outlined"
                color="primary"
              />
              <Chip
                icon={<Business />}
                label={selectedTask.departmentName || 'N/A'}
                variant="outlined"
                color="secondary"
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom fontWeight="600">
              Description
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary" sx={{ mb: 3 }}>
              {selectedTask.description}
            </Typography>

            {selectedTask.additionalInfo && (
              <>
                <Typography variant="h6" gutterBottom fontWeight="600">
                  Additional Information
                </Typography>
                <Typography
                  variant="body1"
                  paragraph
                  color="text.secondary"
                  sx={{
                    whiteSpace: 'pre-line',
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    mb: 3,
                  }}
                >
                  {selectedTask.additionalInfo}
                </Typography>
              </>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom fontWeight="600">
              Progress: {progress}%
            </Typography>
            <Slider
              value={progress}
              onChange={(_, value) => setProgress(value as number)}
              min={0}
              max={100}
              step={1}
              marks
              sx={{ mb: 4, mt: 2 }}
              color="primary"
            />

            <Typography variant="h6" gutterBottom fontWeight="600" sx={{ mb: 2 }}>
              Work Update
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Describe your work"
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="What have you accomplished? What's the current status?"
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={loading}
              fullWidth
              sx={{
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
                },
              }}
            >
              {loading ? 'Saving...' : 'Save Progress'}
            </Button>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default TaskDetailPage;

