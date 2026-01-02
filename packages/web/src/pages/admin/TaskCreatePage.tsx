import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
import { fetchTasks } from '../../store/slices/taskSlice';
import { AppDispatch } from '../../store';

interface Department {
  id: string;
  name: string;
}

const TaskCreatePage: React.FC = () => {
  const { taskId } = useParams<{ taskId?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((state: RootState) => state.auth);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    additionalInfo: '',
    departmentId: '',
    departmentType: '' as 'production' | 'maintenance' | 'quality' | '',
    groupId: '',
    productId: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    deadline: '',
  });

  useEffect(() => {
    fetchDepartments();
    fetchProducts();
    fetchGroups();
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

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

  const fetchProducts = async () => {
    try {
      const response = await axios.get(ApiEndpoints.PRODUCTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products');
    }
  };

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
        departmentId: task.departmentId,
        departmentType: task.departmentType || '',
        groupId: task.groupId || '',
        productId: task.productId || '',
        priority: task.priority,
        deadline: task.deadline.split('T')[0],
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

    if (!formData.title || !formData.departmentId || !formData.deadline) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        departmentType: formData.departmentType || null,
      };
      if (taskId) {
        await axios.put(
          ApiEndpoints.TASKS.UPDATE(taskId),
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          ApiEndpoints.TASKS.CREATE,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      dispatch(fetchTasks());
      navigate('/admin/tasks');
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
              {taskId ? 'Edit Task' : 'Create New Task'}
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
              />

              <TextField
                fullWidth
                select
                label="Department"
                value={formData.departmentId}
                onChange={(e) => {
                  const selectedDept = departments.find(d => d.id === e.target.value);
                  const isProduction = selectedDept?.name.toLowerCase() === 'production';
                  setFormData({ 
                    ...formData, 
                    departmentId: e.target.value,
                    departmentType: isProduction ? 'production' : formData.departmentType
                  });
                }}
                margin="normal"
                required
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </TextField>

              <FormControl fullWidth margin="normal">
                <InputLabel>Department Type</InputLabel>
                <Select
                  value={formData.departmentType}
                  onChange={(e) => setFormData({ ...formData, departmentType: e.target.value as any })}
                  label="Department Type"
                >
                  <MenuItem value="">
                    <em>None (Auto-detect)</em>
                  </MenuItem>
                  <MenuItem value="production">Production</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="quality">Quality</MenuItem>
                </Select>
              </FormControl>

              {formData.departmentType === 'production' && (
                <>
                  <TextField
                    fullWidth
                    select
                    label="Product"
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    margin="normal"
                    required
                  >
                    {products.map((product) => (
                      <MenuItem key={product.id} value={product.id}>
                        {product.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    select
                    label="Group"
                    value={formData.groupId}
                    onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                    margin="normal"
                    required
                  >
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </>
              )}

              {(formData.departmentType === 'maintenance' || formData.departmentType === 'quality') && (
                <TextField
                  fullWidth
                  select
                  label="Group"
                  value={formData.groupId}
                  onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                  margin="normal"
                  required
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                fullWidth
                select
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                margin="normal"
                required
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                margin="normal"
                required
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                margin="normal"
                multiline
                rows={4}
              />

              <TextField
                fullWidth
                label="Additional Information"
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                margin="normal"
                multiline
                rows={3}
                placeholder="Instructions, notes, safety requirements, etc."
              />

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/tasks')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : taskId ? 'Update Task' : 'Create Task'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Container>
      </Box>
    </>
  );
};

export default TaskCreatePage;
