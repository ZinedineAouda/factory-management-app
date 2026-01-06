import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Chip,
  Tooltip,
  alpha,
  InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search, Business, FilterList } from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { DataTable, StatusBadge, EmptyState } from '../../components/ui';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

interface Department {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  createdAt: string;
}

const DepartmentManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ApiEndpoints.DEPARTMENTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error: any) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (dept?: Department) => {
    if (dept) {
      setEditing(dept);
      setFormData({ name: dept.name, description: dept.description || '' });
    } else {
      setEditing(null);
      setFormData({ name: '', description: '' });
    }
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setFormData({ name: '', description: '' });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Department name is required');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const url = editing
        ? `${ApiEndpoints.DEPARTMENTS.LIST}/${editing.id}`
        : ApiEndpoints.DEPARTMENTS.LIST;

      if (editing) {
        await axios.put(url, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } else {
        await axios.post(url, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      handleClose();
      fetchDepartments();
    } catch (error: any) {
      // Safely extract error message
      let errorMessage = 'Failed to save department';
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
        errorMessage = 'Network error: Cannot connect to server.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    try {
      await axios.delete(`${ApiEndpoints.DEPARTMENTS.LIST}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDepartments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 
                           error?.response?.data?.message || 
                           error?.message || 
                           'Failed to delete department';
      setError(typeof errorMessage === 'string' ? errorMessage : String(errorMessage));
    }
  };

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      id: 'name',
      label: 'Department Name',
      render: (row: Department) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              backgroundColor: alpha(colors.primary[500], 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary[400],
            }}
          >
            <Business sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[100] }}>
                {row.name}
              </Typography>
              {row.isSystem && (
                <Chip
                  label="System"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.625rem',
                    backgroundColor: alpha(colors.primary[500], 0.12),
                    color: colors.primary[400],
                  }}
                />
              )}
            </Box>
            {row.description && (
              <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                {row.description}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      width: 150,
      render: (row: Department) => (
        <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400] }}>
          {new Date(row.createdAt).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      width: 100,
      render: () => <StatusBadge status="success" label="Active" />,
    },
    {
      id: 'actions',
      label: '',
      width: 100,
      align: 'right' as const,
      render: (row: Department) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleOpen(row)}
              disabled={row.isSystem}
              sx={{ opacity: row.isSystem ? 0.5 : 1 }}
            >
              <Edit sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => handleDelete(row.id)}
              disabled={row.isSystem}
              sx={{
                color: colors.error[500],
                opacity: row.isSystem ? 0.5 : 1,
              }}
            >
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <PageContainer
      title="Departments"
      subtitle="Organize and manage your factory departments"
      actions={
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Department
        </Button>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {typeof error === 'string' ? error : ((error as any)?.message || (error as any)?.error || 'An error occurred')}
        </Alert>
      )}

      {/* Search */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            placeholder="Search departments..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: colors.neutral[500] }} />
                </InputAdornment>
              ),
            }}
            sx={{ width: 280 }}
          />
          <Button variant="outlined" startIcon={<FilterList sx={{ fontSize: 18 }} />}>
            Filters
          </Button>
        </Box>
        <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500] }}>
          {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Table or Empty State */}
      {!loading && filteredDepartments.length === 0 && !searchQuery ? (
        <Box
          sx={{
            backgroundColor: colors.neutral[900],
            border: `1px solid ${colors.neutral[800]}`,
            borderRadius: 3,
          }}
        >
          <EmptyState
            icon={<Business />}
            title="No departments yet"
            description="Create your first department to organize your factory workers and tasks."
            action={{
              label: 'Add Department',
              onClick: () => handleOpen(),
            }}
          />
        </Box>
      ) : (
        <DataTable
          columns={columns}
          data={filteredDepartments}
          loading={loading}
          rowKey={(row) => row.id}
          emptyMessage="No departments match your search"
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Department' : 'Create Department'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {typeof error === 'string' ? error : ((error as any)?.message || (error as any)?.error || 'An error occurred')}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Department Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            autoFocus
            placeholder="e.g., Production, Maintenance, Quality Control"
          />
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            placeholder="Brief description of this department's responsibilities"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {editing ? 'Save Changes' : 'Create Department'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default DepartmentManagementPage;
