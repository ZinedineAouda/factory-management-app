import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AccessTime,
  CalendarToday,
  Group,
} from '@mui/icons-material';
import Header from '../../components/layout/Header';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

interface Shift {
  id: string;
  groupId: string;
  groupName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  description?: string;
  createdBy: string;
  createdByUsername: string;
  createdAt: string;
  updatedAt: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

const ShiftManagementPage: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<Shift | null>(null);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    groupId: '',
    shiftDate: '',
    startTime: '',
    endTime: '',
    description: '',
  });
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchShifts();
    fetchGroups();
  }, []);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ApiEndpoints.SHIFTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShifts(response.data);
    } catch (error: any) {
      setError('Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get(ApiEndpoints.GROUPS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(response.data);
    } catch (error: any) {
      console.error('Failed to fetch groups');
    }
  };

  const handleOpen = () => {
    setOpen(true);
    setEditing(null);
    setFormData({
      groupId: '',
      shiftDate: '',
      startTime: '',
      endTime: '',
      description: '',
    });
    setError(null);
  };

  const handleEdit = (shift: Shift) => {
    setEditing(shift);
    setFormData({
      groupId: shift.groupId,
      shiftDate: shift.shiftDate.split('T')[0],
      startTime: shift.startTime,
      endTime: shift.endTime,
      description: shift.description || '',
    });
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
    setFormData({
      groupId: '',
      shiftDate: '',
      startTime: '',
      endTime: '',
      description: '',
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!formData.groupId || !formData.shiftDate || !formData.startTime || !formData.endTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      if (editing) {
        await axios.put(
          ApiEndpoints.SHIFTS.UPDATE(editing.id),
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          ApiEndpoints.SHIFTS.CREATE,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      handleClose();
      fetchShifts();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save shift');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (shift: Shift) => {
    setShiftToDelete(shift);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setShiftToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!shiftToDelete) return;

    try {
      setError(null);
      await axios.delete(ApiEndpoints.SHIFTS.DELETE(shiftToDelete.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteDialogOpen(false);
      setShiftToDelete(null);
      fetchShifts();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete shift');
      setDeleteDialogOpen(false);
      setShiftToDelete(null);
    }
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
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
              Shift Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpen}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3f91 100%)',
                },
              }}
            >
              Create Shift
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell><strong>Group</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Start Time</strong></TableCell>
                  <TableCell><strong>End Time</strong></TableCell>
                  <TableCell><strong>Duration</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Created By</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : shifts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No shifts found
                    </TableCell>
                  </TableRow>
                ) : (
                  shifts.map((shift) => (
                    <TableRow key={shift.id} hover>
                      <TableCell>
                        <Chip
                          icon={<Group />}
                          label={shift.groupName}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2">
                            {new Date(shift.shiftDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight="medium">
                            {shift.startTime}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight="medium">
                            {shift.endTime}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {calculateDuration(shift.startTime, shift.endTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {shift.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {shift.createdByUsername}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(shift)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(shift)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Shift' : 'Create Shift'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
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
          <TextField
            fullWidth
            label="Date"
            type="date"
            value={formData.shiftDate}
            onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
            margin="normal"
            required
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Start Time"
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            margin="normal"
            required
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            helperText="24-hour format (HH:MM)"
          />
          <TextField
            fullWidth
            label="End Time"
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            margin="normal"
            required
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            helperText="24-hour format (HH:MM)"
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Shift</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the shift for <strong>{shiftToDelete?.groupName}</strong> on{' '}
            <strong>{shiftToDelete ? new Date(shiftToDelete.shiftDate).toLocaleDateString() : ''}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShiftManagementPage;




