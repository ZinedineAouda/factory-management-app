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
  CircularProgress,
  Tooltip,
  alpha,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Group as GroupIcon,
  Search,
  FilterList,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { DataTable, EmptyState } from '../../components/ui';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

interface Group {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

const GroupManagementPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [editing, setEditing] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ApiEndpoints.GROUPS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
    } catch (error: any) {
      setError('Failed to fetch groups');
      console.error('Fetch groups error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setEditing(null);
    setFormData({
      name: '',
      description: '',
    });
    setError(null);
  };

  const handleEdit = (group: Group) => {
    setEditing(group);
    setFormData({
      name: group.name,
      description: group.description || '',
    });
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setFormData({
      name: '',
      description: '',
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      if (editing) {
        await axios.put(ApiEndpoints.GROUPS.UPDATE(editing.id), formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(ApiEndpoints.GROUPS.CREATE, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      handleClose();
      fetchGroups();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to save group';
      setError(errorMessage);
      console.error('Save group error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (group: Group) => {
    setGroupToDelete(group);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setGroupToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!groupToDelete) return;

    try {
      setError(null);
      await axios.delete(ApiEndpoints.GROUPS.DELETE(groupToDelete.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
      fetchGroups();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete group';
      setError(errorMessage);
      setDeleteDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      id: 'name',
      label: 'Group Name',
      render: (row: Group) => (
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
            <GroupIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[100] }}>
              {row.name}
            </Typography>
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
      width: 120,
      render: (row: Group) => (
        <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400] }}>
          {new Date(row.created_at).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      id: 'updatedAt',
      label: 'Updated',
      width: 120,
      render: (row: Group) => (
        <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400] }}>
          {new Date(row.updated_at).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      id: 'actions',
      label: '',
      width: 100,
      align: 'right' as const,
      render: (row: Group) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(row)}>
              <Edit sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDeleteClick(row)} sx={{ color: colors.error[500] }}>
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <PageContainer
      title="Group Management"
      subtitle="Organize workers into groups for better task management"
      actions={
        <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
          Create Group
        </Button>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            placeholder="Search groups..."
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
          {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Table or Empty State */}
      {!loading && filteredGroups.length === 0 && !searchQuery ? (
        <Box
          sx={{
            backgroundColor: colors.neutral[900],
            border: `1px solid ${colors.neutral[800]}`,
            borderRadius: 3,
          }}
        >
          <EmptyState
            icon={<GroupIcon />}
            title="No groups yet"
            description="Create your first group to organize workers and manage tasks."
            action={{
              label: 'Create Group',
              onClick: handleOpen,
            }}
          />
        </Box>
      ) : (
        <DataTable
          columns={columns}
          data={filteredGroups}
          loading={loading}
          rowKey={(row) => row.id}
          emptyMessage="No groups match your search"
        />
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Group' : 'Create Group'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Group Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            autoFocus
            disabled={loading}
            placeholder="e.g., Production Team A"
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            disabled={loading}
            placeholder="Describe the group's purpose or responsibilities"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} variant="outlined" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9375rem', color: colors.neutral[300], mb: 2 }}>
            Are you sure you want to delete the group <strong style={{ color: colors.neutral[100] }}>{groupToDelete?.name}</strong>?
          </Typography>
          <Alert severity="warning">
            This action cannot be undone. Make sure the group is not assigned to any tasks or users.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default GroupManagementPage;
