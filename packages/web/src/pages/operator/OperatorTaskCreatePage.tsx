import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import Header from '../../components/layout/Header';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

interface Group {
  id: string;
  name: string;
}

const OperatorTaskCreatePage: React.FC = () => {
  const { taskId } = useParams<{ taskId?: string }>();
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    additionalInfo: '',
    groupId: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    deadline: '',
  });

  useEffect(() => {
    fetchGroups();
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(ApiEndpoints.GROUPS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
    } catch (error) {
      console.error('Failed to fetch groups');
    }
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ApiEndpoints.TASKS.DETAIL(taskId!), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const task = response.data;
      setFormData({
        title: task.title,
        description: task.description || '',
        additionalInfo: task.additionalInfo || '',
        groupId: task.groupId || '',
        priority: task.priority,
        deadline: task.deadline ? task.deadline.split('T')[0] : '',
      });
    } catch (error: any) {
      setError('Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title || !formData.groupId || !formData.deadline) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const taskData = {
        ...formData,
        taskType: 'maintenance', // Operators can only create maintenance tasks
      };

      if (taskId) {
        await axios.put(
          ApiEndpoints.TASKS.UPDATE(taskId),
          taskData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          ApiEndpoints.TASKS.CREATE,
          taskData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      navigate('/operator/tasks');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

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
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              {taskId ? 'Edit Maintenance Task' : 'Create Maintenance Task'}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Task Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                margin="normal"
                required
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                margin="normal"
                multiline
                rows={4}
                disabled={loading}
              />
              <TextField
                fullWidth
                label="Additional Info"
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                margin="normal"
                multiline
                rows={2}
                disabled={loading}
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Group</InputLabel>
                <Select
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  label="Group"
                  disabled={loading}
                >
                  <MenuItem value="">
                    <em>Select a group</em>
                  </MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  label="Priority"
                  disabled={loading}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                margin="normal"
                required
                disabled={loading}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : taskId ? 'Update Task' : 'Create Task'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/operator/tasks')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default OperatorTaskCreatePage;

