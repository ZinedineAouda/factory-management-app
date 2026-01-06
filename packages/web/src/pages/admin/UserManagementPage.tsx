import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  Collapse,
  LinearProgress,
  Grid,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  alpha,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Assignment,
  CheckCircle,
  PlayArrow,
  Pending,
  Cancel,
  TrendingUp,
  Delete,
  Search,
  Add,
  FilterList,
  MoreVert,
  Edit,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { DataTable, StatusBadge } from '../../components/ui';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';
import { User, UserRole } from '@factory-app/shared';


interface Department {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
}

interface WorkerStatistics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  cancelledTasks: number;
  averageProgress: number;
  completionRate: number;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<Record<string, WorkerStatistics>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { token, user: currentUser } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(ApiEndpoints.USERS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allUsers = response.data;
      setUsers(allUsers);
      setWorkers(allUsers.filter((u: User) => u.role === UserRole.WORKER));
    } catch (error: any) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(ApiEndpoints.DEPARTMENTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error: any) {
      console.error('Failed to fetch departments');
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

  const fetchWorkerStatistics = async (workerId: string) => {
    if (statistics[workerId]) return;

    try {
      setLoadingStats((prev) => ({ ...prev, [workerId]: true }));
      const response = await axios.get(ApiEndpoints.USERS.STATISTICS(workerId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatistics((prev) => ({ ...prev, [workerId]: response.data }));
    } catch (error: any) {
      console.error(`Failed to fetch statistics for worker ${workerId}:`, error);
    } finally {
      setLoadingStats((prev) => ({ ...prev, [workerId]: false }));
    }
  };

  const handleToggleExpand = (workerId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(workerId)) {
      newExpanded.delete(workerId);
    } else {
      newExpanded.add(workerId);
      fetchWorkerStatistics(workerId);
    }
    setExpandedRows(newExpanded);
  };

  const handleOpenAssignDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedDepartmentId(user.departmentId || '');
    setSelectedGroupId(user.groupId || '');
    setAssignDialogOpen(true);
    setError(null);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedUser(null);
    setSelectedDepartmentId('');
    setSelectedGroupId('');
    setError(null);
  };

  const handleAssignDepartment = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      const departmentIdToSend = selectedDepartmentId === '' ? null : selectedDepartmentId;
      const groupIdToSend = selectedGroupId === '' ? null : selectedGroupId;

      await axios.put(
        ApiEndpoints.USERS.UPDATE_DEPARTMENT(selectedUser.id),
        { departmentId: departmentIdToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.put(
        ApiEndpoints.USERS.UPDATE_GROUP(selectedUser.id),
        { groupId: groupIdToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      handleCloseAssignDialog();
      fetchUsers();
      setStatistics((prev) => {
        const newStats = { ...prev };
        delete newStats[selectedUser.id];
        return newStats;
      });
    } catch (error: any) {
      console.error('Assignment error:', error);
      const errorMessage =
        error.response?.data?.error || error.message || 'Failed to assign department/group';
      setError(errorMessage);
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
    setError(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
    setError(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setError(null);
      await axios.delete(ApiEndpoints.USERS.DELETE(userToDelete.id), {
        headers: { Authorization: `Bearer ${token}` },
      });

      handleCloseDeleteDialog();
      fetchUsers();
      setStatistics((prev) => {
        const newStats = { ...prev };
        delete newStats[userToDelete.id];
        return newStats;
      });
    } catch (error: any) {
      console.error('Delete user error:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        'Failed to delete user';
      setError(errorMessage);
    }
  };

  const displayUsers = tabValue === 0 ? workers : users;
  const filteredUsers = displayUsers.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.departmentName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      id: 'expand',
      label: '',
      width: 48,
      render: (row: User) =>
        row.role === UserRole.WORKER ? (
          <IconButton size="small" onClick={() => handleToggleExpand(row.id)}>
            {expandedRows.has(row.id) ? (
              <ExpandLess sx={{ fontSize: 18 }} />
            ) : (
              <ExpandMore sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        ) : null,
    },
    {
      id: 'user',
      label: 'User',
      render: (row: User) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: row.role === 'admin' ? colors.primary[600] : colors.success[600],
              fontSize: '0.75rem',
            }}
          >
            {row.email.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[100] }}>
              {row.email}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
              Joined {new Date(row.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'role',
      label: 'Role',
      width: 100,
      render: (row: User) => (
        <StatusBadge
          status={row.role === 'admin' ? 'primary' : 'success'}
          label={row.role}
          dot={false}
        />
      ),
    },
    {
      id: 'department',
      label: 'Department',
      render: (row: User) =>
        row.departmentName ? (
          <Chip
            label={row.departmentName}
            size="small"
            sx={{
              backgroundColor: alpha(colors.success[500], 0.12),
              color: colors.success[500],
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          />
        ) : (
          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[600] }}>—</Typography>
        ),
    },
    {
      id: 'group',
      label: 'Group',
      render: (row: User) =>
        row.groupName ? (
          <Chip
            label={row.groupName}
            size="small"
            sx={{
              backgroundColor: alpha(colors.info[500], 0.12),
              color: colors.info[500],
              fontWeight: 500,
              fontSize: '0.75rem',
            }}
          />
        ) : (
          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[600] }}>—</Typography>
        ),
    },
    {
      id: 'status',
      label: 'Status',
      width: 100,
      render: (row: User) => (
        <StatusBadge status={row.isActive ? 'success' : 'default'} label={row.isActive ? 'Active' : 'Inactive'} />
      ),
    },
    {
      id: 'actions',
      label: '',
      width: 120,
      align: 'right' as const,
      render: (row: User) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          {row.role === UserRole.WORKER && (
            <Tooltip title="Assign Department">
              <IconButton size="small" onClick={() => handleOpenAssignDialog(row)}>
                <Edit sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
          {row.id !== currentUser?.id && (
            <Tooltip title="Delete User">
              <IconButton size="small" onClick={() => handleOpenDeleteDialog(row)} sx={{ color: colors.error[500] }}>
                <Delete sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <PageContainer
      title="User Management"
      subtitle="Manage users, assign departments, and view worker statistics"
      actions={
        <Button variant="contained" startIcon={<Add />}>
          Invite User
        </Button>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs & Search */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            '& .MuiTabs-indicator': {
              height: 2,
            },
          }}
        >
          <Tab label={`Workers (${workers.length})`} />
          <Tab label={`All Users (${users.length})`} />
        </Tabs>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <TextField
            placeholder="Search users..."
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
            sx={{ width: 240 }}
          />
          <Button variant="outlined" startIcon={<FilterList sx={{ fontSize: 18 }} />}>
            Filters
          </Button>
        </Box>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        rowKey={(row) => row.id}
        emptyMessage={`No ${tabValue === 0 ? 'workers' : 'users'} found`}
      />

      {/* Expanded Statistics Section - Rendered as Cards Below Table */}
      {filteredUsers.map((user) => {
        if (user.role !== UserRole.WORKER || !expandedRows.has(user.id)) return null;
        const userStats = statistics[user.id];
        const isLoadingStats = loadingStats[user.id];

        return (
          <Box
            key={`stats-${user.id}`}
            sx={{
              mt: 2,
              p: 3,
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
            }}
          >
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[100], mb: 2 }}>
              Statistics for {user.email}
            </Typography>
            {isLoadingStats ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : userStats ? (
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: colors.neutral[950], borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.neutral[100] }}>
                      {userStats.totalTasks}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>Total Tasks</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: colors.neutral[950], borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.success[500] }}>
                      {userStats.completedTasks}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>Completed</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: colors.neutral[950], borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.info[500] }}>
                      {userStats.inProgressTasks}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>In Progress</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: colors.neutral[950], borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.warning[500] }}>
                      {userStats.pendingTasks}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>Pending</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: colors.neutral[950], borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.primary[400] }}>
                      {userStats.completionRate}%
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>Completion Rate</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center', p: 2, backgroundColor: colors.neutral[950], borderRadius: 2 }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: colors.neutral[100] }}>
                      {userStats.averageProgress}%
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>Avg Progress</Typography>
                  </Box>
                </Grid>
              </Grid>
            ) : (
              <Alert severity="info" sx={{ maxWidth: 400 }}>
                {user.departmentId ? 'No statistics available yet' : 'Assign a department to see statistics'}
              </Alert>
            )}
          </Box>
        );
      })}

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Department & Group</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400], mb: 3 }}>
            Assign department and group for: <strong style={{ color: colors.neutral[100] }}>{selectedUser?.email}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              label="Department"
            >
              <MenuItem value="">
                <em>None (Remove Department)</em>
              </MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Group</InputLabel>
            <Select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              label="Group"
            >
              <MenuItem value="">
                <em>None (Remove Group)</em>
              </MenuItem>
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleAssignDepartment} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Delete sx={{ color: colors.error[500] }} />
          Delete User
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Typography sx={{ fontSize: '0.9375rem', color: colors.neutral[300], mb: 2 }}>
            Are you sure you want to delete <strong style={{ color: colors.neutral[100] }}>{userToDelete?.email}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All data associated with this user will be permanently deleted.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
            startIcon={<Delete />}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default UserManagementPage;
