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
  AccessTime,
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
  start_time?: string;
  end_time?: string;
  created_at: string;
  updated_at: string;
}

const GroupsAndShiftsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    description: '',
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGroupDialog = () => {
    setGroupDialogOpen(true);
    setEditingGroup(null);
    setGroupFormData({
      name: '',
      description: '',
      startTime: '',
      endTime: '',
    });
    setError(null);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      description: group.description || '',
      startTime: group.start_time || '',
      endTime: group.end_time || '',
    });
    setGroupDialogOpen(true);
    setError(null);
  };

  const handleCloseGroupDialog = () => {
    setGroupDialogOpen(false);
    setEditingGroup(null);
    setGroupFormData({
      name: '',
      description: '',
      startTime: '',
      endTime: '',
    });
    setError(null);
  };

  const handleSubmitGroup = async () => {
    if (!groupFormData.name.trim()) {
      setError('Group name is required');
      return;
    }

    if (groupFormData.startTime || groupFormData.endTime) {
      if (!groupFormData.startTime || !groupFormData.endTime) {
        setError('Both start time and end time are required if you set working hours');
        return;
      }

      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(groupFormData.startTime)) {
        setError('Start time must be in 24-hour format (HH:MM), e.g., 08:00 or 14:30');
        return;
      }
      if (!timeRegex.test(groupFormData.endTime)) {
        setError('End time must be in 24-hour format (HH:MM), e.g., 08:00 or 14:30');
        return;
      }

      if (groupFormData.startTime === groupFormData.endTime) {
        setError('Start time and end time cannot be the same');
        return;
      }
    }

    try {
      setError(null);
      setLoading(true);

      const payload = {
        name: groupFormData.name,
        description: groupFormData.description,
        startTime: groupFormData.startTime || null,
        endTime: groupFormData.endTime || null,
      };

      if (editingGroup) {
        await axios.put(ApiEndpoints.GROUPS.UPDATE(editingGroup.id), payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(ApiEndpoints.GROUPS.CREATE, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      handleCloseGroupDialog();
      fetchGroups();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to save group';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroupClick = (group: Group) => {
    setGroupToDelete(group);
    setDeleteGroupDialogOpen(true);
  };

  const handleDeleteGroupCancel = () => {
    setDeleteGroupDialogOpen(false);
    setGroupToDelete(null);
  };

  const handleDeleteGroupConfirm = async () => {
    if (!groupToDelete) return;

    try {
      setError(null);
      await axios.delete(ApiEndpoints.GROUPS.DELETE(groupToDelete.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteGroupDialogOpen(false);
      setGroupToDelete(null);
      fetchGroups();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to delete group';
      setError(errorMessage);
      setDeleteGroupDialogOpen(false);
      setGroupToDelete(null);
    }
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return '-';
    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);

    if (end <= start) {
      end = new Date(`2000-01-02T${endTime}`);
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const formatTime = (value: string, previousValue: string) => {
    let cleaned = value.replace(/[^\d:]/g, '');
    const isDeleting = cleaned.length < previousValue.length;

    if (cleaned.includes(':')) {
      const parts = cleaned.split(':');
      let hours = parts[0].substring(0, 2);
      let minutes = parts[1] ? parts[1].substring(0, 2) : '';

      if (hours.length === 2) {
        const hourNum = parseInt(hours);
        if (hourNum > 23) hours = '23';
      } else if (hours.length === 1) {
        const hourNum = parseInt(hours);
        if (hourNum > 2) hours = '2';
      }

      if (minutes.length === 2) {
        const minNum = parseInt(minutes);
        if (minNum > 59) minutes = '59';
      } else if (minutes.length === 1) {
        const minNum = parseInt(minutes);
        if (minNum > 5) minutes = '5';
      }

      cleaned = hours + ':' + minutes;
    } else {
      if (cleaned.length === 1) {
        const hourNum = parseInt(cleaned);
        if (hourNum > 2) cleaned = '2';
      } else if (cleaned.length === 2) {
        const hourNum = parseInt(cleaned);
        if (hourNum > 23) cleaned = '23';
        if (!isDeleting) cleaned = cleaned + ':';
      } else if (cleaned.length > 2) {
        const hours = cleaned.substring(0, 2);
        const hourNum = parseInt(hours);
        if (hourNum > 23) {
          cleaned = '23:' + cleaned.substring(2, 4);
        } else {
          cleaned = hours + ':' + cleaned.substring(2, 4);
        }
      }
    }

    return cleaned.substring(0, 5);
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
      id: 'workingHours',
      label: 'Working Hours',
      render: (row: Group) =>
        row.start_time && row.end_time ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime sx={{ fontSize: 16, color: colors.neutral[500] }} />
            <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[300] }}>
              {row.start_time} - {row.end_time}
            </Typography>
          </Box>
        ) : (
          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[600] }}>Not set</Typography>
        ),
    },
    {
      id: 'duration',
      label: 'Duration',
      width: 100,
      render: (row: Group) => (
        <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400] }}>
          {calculateDuration(row.start_time || '', row.end_time || '')}
        </Typography>
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
      id: 'actions',
      label: '',
      width: 100,
      align: 'right' as const,
      render: (row: Group) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEditGroup(row)}>
              <Edit sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDeleteGroupClick(row)} sx={{ color: colors.error[500] }}>
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <PageContainer
      title="Groups & Shifts"
      subtitle="Manage work groups and their shift schedules"
      actions={
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenGroupDialog}>
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
            description="Create your first group to organize workers and manage shift schedules."
            action={{
              label: 'Create Group',
              onClick: handleOpenGroupDialog,
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
      <Dialog open={groupDialogOpen} onClose={handleCloseGroupDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingGroup ? 'Edit Group' : 'Create Group'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Group Name"
            value={groupFormData.name}
            onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
            margin="normal"
            required
            autoFocus
            disabled={loading}
            placeholder="e.g., Production Team A"
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={groupFormData.description}
            onChange={(e) => setGroupFormData({ ...groupFormData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            disabled={loading}
            placeholder="Describe the group's purpose or responsibilities"
          />
          <Box sx={{ mt: 2, p: 2, backgroundColor: colors.neutral[950], borderRadius: 2, border: `1px solid ${colors.neutral[800]}` }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[100], mb: 1 }}>
              Working Hours (Optional)
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mb: 2, display: 'block' }}>
              Set the daily working hours for this group. Leave empty if not applicable.
            </Typography>
            <TextField
              fullWidth
              label="Start Time"
              value={groupFormData.startTime}
              onChange={(e) =>
                setGroupFormData({
                  ...groupFormData,
                  startTime: formatTime(e.target.value, groupFormData.startTime),
                })
              }
              margin="normal"
              disabled={loading}
              placeholder="08:00"
              inputProps={{ maxLength: 5 }}
              helperText="24-hour format (HH:MM), e.g., 08:00 or 14:30"
            />
            <TextField
              fullWidth
              label="End Time"
              value={groupFormData.endTime}
              onChange={(e) =>
                setGroupFormData({
                  ...groupFormData,
                  endTime: formatTime(e.target.value, groupFormData.endTime),
                })
              }
              margin="normal"
              disabled={loading}
              placeholder="17:00"
              inputProps={{ maxLength: 5 }}
              helperText="24-hour format (HH:MM), e.g., 08:00 or 14:30"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupDialog} variant="outlined" disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmitGroup} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : editingGroup ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteGroupDialogOpen} onClose={handleDeleteGroupCancel}>
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
          <Button onClick={handleDeleteGroupCancel} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteGroupConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default GroupsAndShiftsPage;
