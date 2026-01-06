import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import { Add, Edit, Delete, Business } from '@mui/icons-material';
import Header from '../../components/layout/Header';
import PriorityBadge from '../../components/task/PriorityBadge';
import { fetchTasks } from '../../store/slices/taskSlice';
import { AppDispatch, RootState } from '../../store';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';

interface Department {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  createdAt: string;
}

const TaskManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { tasks, loading } = useSelector((state: RootState) => state.tasks);
  const { token } = useSelector((state: RootState) => state.auth);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');

  useEffect(() => {
    dispatch(fetchTasks());
    fetchDepartments();
  }, [dispatch]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(ApiEndpoints.DEPARTMENTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const filteredTasks = selectedDepartmentId === 'all'
    ? tasks
    : tasks.filter((task: any) => task.departmentId === selectedDepartmentId);

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await axios.delete(ApiEndpoints.TASKS.DELETE(taskId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      dispatch(fetchTasks());
    } catch (error) {
      console.error('Failed to delete task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'info';
      case 'pending':
        return 'default';
      default:
        return 'default';
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
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Task Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/admin/tasks/create')}
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

          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={selectedDepartmentId}
              onChange={(_e, newValue) => setSelectedDepartmentId(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="department tabs"
            >
              <Tab
                icon={<Business />}
                iconPosition="start"
                label="All Departments"
                value="all"
              />
              {departments.map((dept) => (
                <Tab
                  key={dept.id}
                  icon={<Business />}
                  iconPosition="start"
                  label={dept.name}
                  value={dept.id}
                />
              ))}
            </Tabs>
          </Paper>

          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Task</strong></TableCell>
                  <TableCell><strong>Department</strong></TableCell>
                  <TableCell><strong>Priority</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Progress</strong></TableCell>
                  <TableCell><strong>Deadline</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      {selectedDepartmentId === 'all' ? 'No tasks found' : `No tasks found for this department`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {task.title}
                        </Typography>
                      </TableCell>
                      <TableCell>{task.departmentName || 'N/A'}</TableCell>
                      <TableCell>
                        <PriorityBadge priority={task.priority} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={task.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(task.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                          <LinearProgress
                            variant="determinate"
                            value={task.progressPercentage}
                            sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" fontWeight="bold">
                            {task.progressPercentage}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{new Date(task.deadline).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/tasks/create/${task.id}`)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(task.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </Box>
    </>
  );
};

export default TaskManagementPage;
