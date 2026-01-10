import React, { useEffect, useState, useCallback } from 'react';
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
  Delete,
  Search,
  Add,
  FilterList,
  Edit,
  Lock,
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
  const [operators, setOperators] = useState<User[]>([]);
  const [leaders, setLeaders] = useState<User[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [approving, setApproving] = useState(false);
  const [statistics, setStatistics] = useState<Record<string, WorkerStatistics>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editCredentialsDialogOpen, setEditCredentialsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.WORKER);
  const [editingUsername, setEditingUsername] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const { token, user: currentUser } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchUsers();
    fetchPendingUsers();
    fetchDepartments();
    fetchGroups();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[FETCH USERS] Fetching active users...');
      const response = await axios.get(ApiEndpoints.USERS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allUsers = response.data || [];
      console.log('[FETCH USERS] Received users:', allUsers.length);
      setUsers(allUsers);
      setWorkers(allUsers.filter((u: User) => u.role === UserRole.WORKER));
      setOperators(allUsers.filter((u: User) => u.role === UserRole.OPERATOR));
      setLeaders(allUsers.filter((u: User) => u.role === UserRole.LEADER));
      setAdmins(allUsers.filter((u: User) => u.role === UserRole.ADMIN));
    } catch (error: any) {
      console.error('[FETCH USERS] Error:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoadingPending(true);
      const response = await axios.get(ApiEndpoints.USERS.PENDING, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingUsers(response.data);
    } catch (error: any) {
      console.error('Failed to fetch pending users:', error);
    } finally {
      setLoadingPending(false);
    }
  }, [token]);

  const handleOpenApproveDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole((user.role as UserRole) || UserRole.WORKER);
    setSelectedDepartmentId('');
    setSelectedGroupId('');
    setApproveDialogOpen(true);
    setError(null);
  };

  const handleCloseApproveDialog = useCallback(() => {
    setApproveDialogOpen(false);
    setSelectedUser(null);
    setSelectedDepartmentId('');
    setSelectedGroupId('');
    setSelectedRole(UserRole.WORKER);
    setError(null);
  }, []);

  const handleApproveUser = useCallback(async () => {
    // Validation
    if (!selectedUser) {
      setError('❌ No user selected. Please try again.');
      return;
    }

    if (!selectedRole) {
      setError('❌ Please select a role before approving.');
      return;
    }

    // Start approval process
    setError(null);
    setApproving(true);

    try {
      // Prepare payload
      const roleString = String(selectedRole).toLowerCase().trim();
      const validRoles = ['admin', 'worker', 'operator', 'leader'];
      
      if (!validRoles.includes(roleString)) {
        setError(`❌ Invalid role: ${roleString}. Must be one of: ${validRoles.join(', ')}`);
        setApproving(false);
        return;
      }

      const payload = {
        role: roleString,
        departmentId: selectedDepartmentId?.trim() || null,
        groupId: selectedGroupId?.trim() || null,
      };

      console.log('[APPROVE] Starting approval:', {
        userId: selectedUser.id,
        username: (selectedUser as any).username || selectedUser.email || 'Unknown',
        payload,
        endpoint: ApiEndpoints.USERS.APPROVE(selectedUser.id),
      });

      // Make API call
      const response = await axios.post(
        ApiEndpoints.USERS.APPROVE(selectedUser.id),
        payload,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log('[APPROVE] ✅ Success:', response.data);

      // Success - close dialog first
      handleCloseApproveDialog();
      
      // Small delay to ensure dialog closes smoothly
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Refresh data - ensure we get the latest from server
      try {
        console.log('[APPROVE] Refreshing user lists...');
        await Promise.all([
          fetchUsers(),
          fetchPendingUsers(),
        ]);
        console.log('[APPROVE] ✅ Data refreshed successfully');
        
        // Switch to appropriate tab based on role
        setTimeout(() => {
          const approvedRole = roleString;
          if (approvedRole === 'worker') setTabValue(1);
          else if (approvedRole === 'operator') setTabValue(2);
          else if (approvedRole === 'leader') setTabValue(3);
          else if (approvedRole === 'admin') setTabValue(4);
          else setTabValue(5); // All Users
        }, 300);
      } catch (refreshError) {
        console.error('[APPROVE] ⚠️ Error refreshing data:', refreshError);
        // Still show success even if refresh fails
      }

      // Clear any errors
      setError(null);
      
    } catch (error: any) {
      console.error('[APPROVE] ❌ Error:', error);
      
      // Extract error message
      let errorMessage = 'Failed to approve user. ';
      
      if (error.response) {
        // Server responded with error
        const errorData = error.response.data;
        errorMessage += errorData?.error || errorData?.message || `HTTP ${error.response.status}`;
        
        if (errorData?.code) {
          errorMessage += ` (Code: ${errorData.code})`;
        }
        
        if (errorData?.details && process.env.NODE_ENV === 'development') {
          errorMessage += ` - ${errorData.details}`;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage += 'No response from server. Please check your connection.';
      } else {
        // Error setting up request
        errorMessage += error.message || 'Unknown error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setApproving(false);
    }
  }, [selectedUser, selectedRole, selectedDepartmentId, selectedGroupId, token, handleCloseApproveDialog, fetchUsers, fetchPendingUsers]);

  // Keyboard shortcuts for approval dialog (must be after handleApproveUser and handleCloseApproveDialog declarations)
  useEffect(() => {
    if (!approveDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Enter key - approve user
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        const target = event.target as HTMLElement;
        // Don't trigger if typing in an input field or select is open
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.closest('.MuiPopover-root')) {
          event.preventDefault();
          if (!approving && selectedRole) {
            handleApproveUser();
          }
        }
      }
      
      // Escape key - close dialog
      if (event.key === 'Escape' && !approving) {
        event.preventDefault();
        handleCloseApproveDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [approveDialogOpen, approving, selectedRole, handleApproveUser, handleCloseApproveDialog]);

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
    setSelectedRole(user.role);
    setAssignDialogOpen(true);
    setError(null);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedUser(null);
    setSelectedDepartmentId('');
    setSelectedGroupId('');
    setSelectedRole(UserRole.WORKER);
    setError(null);
  };

  const handleAssignDepartment = async () => {
    if (!selectedUser) return;

    try {
      setError(null);
      const departmentIdToSend = selectedDepartmentId === '' ? null : selectedDepartmentId;
      const groupIdToSend = selectedGroupId === '' ? null : selectedGroupId;

      // Update role if changed
      if (selectedRole !== selectedUser.role) {
        await axios.put(
          ApiEndpoints.USERS.UPDATE_ROLE(selectedUser.id),
          { role: selectedRole },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Update department
      await axios.put(
        ApiEndpoints.USERS.UPDATE_DEPARTMENT(selectedUser.id),
        { departmentId: departmentIdToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update group
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
        error.response?.data?.error || error.message || 'Failed to assign role/department/group';
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

  const handleSaveCredentials = async () => {
    if (!selectedUser) return;

    try {
      setSavingCredentials(true);
      setError(null);

      const updates: Promise<any>[] = [];

      // Update username if changed
      if (editingUsername.trim() && editingUsername.trim() !== (selectedUser as any).username) {
        if (editingUsername.trim().length < 3) {
          setError('Username must be at least 3 characters long');
          setSavingCredentials(false);
          return;
        }
        updates.push(
          axios.put(
            ApiEndpoints.USERS.UPDATE_USERNAME(selectedUser.id),
            { username: editingUsername.trim() },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
      }

      // Update password if provided
      if (editingPassword.trim()) {
        if (editingPassword.length < 6) {
          setError('Password must be at least 6 characters long');
          setSavingCredentials(false);
          return;
        }
        updates.push(
          axios.put(
            ApiEndpoints.USERS.UPDATE_PASSWORD(selectedUser.id),
            { password: editingPassword },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
      }

      if (updates.length === 0) {
        setError('No changes to save');
        setSavingCredentials(false);
        return;
      }

      await Promise.all(updates);
      setEditCredentialsDialogOpen(false);
      setEditingUsername('');
      setEditingPassword('');
      await fetchUsers();
      await fetchPendingUsers();
    } catch (error: any) {
      console.error('Save credentials error:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        'Failed to update credentials';
      setError(errorMessage);
    } finally {
      setSavingCredentials(false);
    }
  };

  // Tab mapping: 0=Pending, 1=Workers, 2=Operators, 3=Leaders, 4=Admins, 5=All Users
  const displayUsers = 
    tabValue === 0 ? pendingUsers :
    tabValue === 1 ? workers :
    tabValue === 2 ? operators :
    tabValue === 3 ? leaders :
    tabValue === 4 ? admins :
    users;
  
  // Only apply filters if they've been explicitly set (activeFilters has items) or search query exists
  const hasActiveFilters = activeFilters.size > 0 || searchQuery.trim().length > 0;
  
  const filteredUsers = displayUsers.filter((user) => {
    // On pending tab, only show pending users (this is not a filter, it's tab logic)
    if (tabValue === 0) {
      const userStatus = (user as any).status || (user.isActive ? 'active' : 'inactive');
      if (userStatus !== 'pending') return false;
    }
    
    // If no filters are active, show all users (except pending tab logic above)
    if (!hasActiveFilters) {
      return true;
    }
    
    // Search filter - only apply if search query exists
    if (searchQuery.trim().length > 0) {
      const matchesSearch =
        ((user as any).username?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (user.departmentName?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
    }
    
    // Role filter - only apply if filter has been explicitly set
    if (activeFilters.size > 0 && filterRole !== 'all' && user.role !== filterRole) return false;
    
    // Department filter - only apply if filter has been explicitly set
    if (activeFilters.size > 0 && filterDepartment !== 'all') {
      if (filterDepartment === 'none' && user.departmentId) return false;
      if (filterDepartment !== 'none' && user.departmentId !== filterDepartment) return false;
    }
    
    // Status filter - only apply if filter has been explicitly set (disabled on pending tab)
    if (activeFilters.size > 0 && tabValue !== 0 && filterStatus !== 'all') {
      const userStatus = (user as any).status || (user.isActive ? 'active' : 'inactive');
      if (filterStatus === 'active' && userStatus !== 'active') return false;
      if (filterStatus === 'inactive' && userStatus === 'active') return false;
      if (filterStatus === 'pending' && userStatus !== 'pending') return false;
    }
    
    return true;
  });

  const handleOpenFilterDialog = () => {
    setFilterDialogOpen(true);
  };

  const handleCloseFilterDialog = () => {
    setFilterDialogOpen(false);
  };

  // Reset filters when switching tabs
  useEffect(() => {
    // Clear all filters when switching tabs
    setFilterRole('all');
    setFilterDepartment('all');
    setFilterStatus('all');
    setActiveFilters(new Set());
    setSearchQuery('');
  }, [tabValue]);

  const handleApplyFilters = () => {
    const filters: string[] = [];
    if (filterRole !== 'all') filters.push(`Role: ${filterRole}`);
    if (filterDepartment !== 'all') {
      filters.push(`Dept: ${filterDepartment === 'none' ? 'None' : departments.find(d => d.id === filterDepartment)?.name || filterDepartment}`);
    }
    if (filterStatus !== 'all') filters.push(`Status: ${filterStatus}`);
    setActiveFilters(new Set(filters));
    handleCloseFilterDialog();
  };

  const handleClearFilters = () => {
    setFilterRole('all');
    setFilterDepartment('all');
    setFilterStatus('all');
    setActiveFilters(new Set());
    setSearchQuery(''); // Also clear search when clearing filters
    handleCloseFilterDialog();
  };

  const handleInviteUser = () => {
    setInviteDialogOpen(true);
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
  };

  const handleNavigateToCodeGeneration = () => {
    window.location.href = '/admin/codes';
  };

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
            {((row as any).username || row.email || 'U').charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[100] }}>
              @{((row as any).username || row.email || 'Unknown User')}
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
      render: (row: User) => {
        const status = (row as any).status || (row.isActive ? 'active' : 'inactive');
        if (status === 'pending') {
          return <StatusBadge status="warning" label="Pending" />;
        }
        return <StatusBadge status={row.isActive ? 'success' : 'default'} label={row.isActive ? 'Active' : 'Inactive'} />;
      },
    },
    {
      id: 'actions',
      label: '',
      width: 120,
      align: 'right' as const,
      render: (row: User) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
          {(row as any).status === 'pending' ? (
            <Tooltip title="Approve User">
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={() => handleOpenApproveDialog(row)}
                sx={{ textTransform: 'none', fontSize: '0.75rem' }}
              >
                Approve
              </Button>
            </Tooltip>
          ) : (
            <>
              <Tooltip title="Edit Role, Department & Group">
                <IconButton size="small" onClick={() => handleOpenAssignDialog(row)}>
                  <Edit sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Username & Password">
                <IconButton 
                  size="small" 
                  onClick={() => {
                    setSelectedUser(row);
                    setEditingUsername((row as any).username || '');
                    setEditingPassword('');
                    setEditCredentialsDialogOpen(true);
                    setError(null);
                  }}
                  sx={{ color: colors.info[500] }}
                >
                  <Lock sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              {row.id !== currentUser?.id && (
                <Tooltip title="Delete User">
                  <IconButton size="small" onClick={() => handleOpenDeleteDialog(row)} sx={{ color: colors.error[500] }}>
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
            </>
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
        <Button variant="contained" startIcon={<Add />} onClick={handleInviteUser}>
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
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Pending Approval
                {pendingUsers.length > 0 && (
                  <Chip
                    label={pendingUsers.length}
                    size="small"
                    sx={{
                      height: 20,
                      minWidth: 20,
                      backgroundColor: colors.warning[500],
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            } 
          />
          <Tab label={`Workers (${workers.length})`} />
          <Tab label={`Operators (${operators.length})`} />
          <Tab label={`Leaders (${leaders.length})`} />
          <Tab label={`Admins (${admins.length})`} />
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
          <Button 
            variant="outlined" 
            startIcon={<FilterList sx={{ fontSize: 18 }} />}
            onClick={handleOpenFilterDialog}
            sx={{
              ...(activeFilters.size > 0 && {
                backgroundColor: alpha(colors.primary[500], 0.1),
                borderColor: colors.primary[500],
                color: colors.primary[400],
              }),
            }}
          >
            Filters
            {activeFilters.size > 0 && (
              <Chip
                label={activeFilters.size}
                size="small"
                sx={{
                  ml: 1,
                  height: 20,
                  minWidth: 20,
                  backgroundColor: colors.primary[500],
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              />
            )}
          </Button>
          {activeFilters.size > 0 && (
            <Button
              variant="text"
              size="small"
              onClick={handleClearFilters}
              sx={{ color: colors.neutral[400], fontSize: '0.75rem' }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading || (tabValue === 0 && loadingPending)}
        rowKey={(row) => row.id}
        emptyMessage={
          tabValue === 0 
            ? 'No pending users. All registrations have been approved.' 
            : tabValue === 1
            ? 'No workers found'
            : tabValue === 2
            ? 'No operators found'
            : tabValue === 3
            ? 'No leaders found'
            : tabValue === 4
            ? 'No admins found'
            : 'No users found'
        }
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
              Statistics for @{((user as any).username || user.email || 'Unknown User')}
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

      {/* Approve Dialog - COMPLETE REBUILD */}
      <Dialog 
        open={approveDialogOpen} 
        onClose={approving ? undefined : handleCloseApproveDialog}
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown={approving}
        PaperProps={{
          sx: {
            backgroundColor: colors.neutral[900],
            border: `1px solid ${colors.neutral[800]}`,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle 
          sx={{ 
            color: colors.neutral[100], 
            borderBottom: `1px solid ${colors.neutral[800]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Approve User & Assign Role
            </Typography>
            <Typography variant="caption" sx={{ color: colors.neutral[500], mt: 0.5, display: 'block' }}>
              Press Enter to approve • Esc to cancel
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ mt: 2 }}>
          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2 }} 
              onClose={() => setError(null)}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setError(null)}
                >
                  <Delete sx={{ fontSize: 18 }} />
                </IconButton>
              }
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {error}
              </Typography>
            </Alert>
          )}

          {/* User Info */}
          <Box sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: colors.neutral[950], 
            borderRadius: 1,
            border: `1px solid ${colors.neutral[800]}`,
          }}>
            <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mb: 1 }}>
              Approving User:
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100] }}>
              @{((selectedUser as any)?.username || selectedUser?.email || 'Unknown User')}
            </Typography>
            {selectedUser?.email && (
              <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400], mt: 0.5 }}>
                {selectedUser.email}
              </Typography>
            )}
          </Box>

          {/* Info Alert */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              The user account will be <strong>approved and activated</strong>. Make sure to assign the correct role, department, and group.
            </Typography>
          </Alert>

          {/* Role Selection */}
          <FormControl fullWidth sx={{ mb: 2 }} required>
            <InputLabel 
              sx={{ color: colors.neutral[400] }}
              required
            >
              Role *
            </InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value as UserRole);
                setError(null);
              }}
              label="Role *"
              required
              autoFocus
              disabled={approving}
              sx={{
                color: colors.neutral[100],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[700],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[600],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[500],
                },
              }}
            >
              <MenuItem value={UserRole.WORKER}>
                <Box>
                  <Typography>Worker</Typography>
                  <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                    Basic user access
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value={UserRole.OPERATOR}>
                <Box>
                  <Typography>Operator</Typography>
                  <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                    Can create reports
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value={UserRole.LEADER}>
                <Box>
                  <Typography>Leader</Typography>
                  <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                    Team management access
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value={UserRole.ADMIN}>
                <Box>
                  <Typography>Admin</Typography>
                  <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                    Full system access
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Department Selection */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: colors.neutral[400] }}>
              Department
            </InputLabel>
            <Select
              value={selectedDepartmentId}
              onChange={(e) => {
                setSelectedDepartmentId(e.target.value);
                setError(null);
              }}
              label="Department"
              disabled={approving || departments.length === 0}
              sx={{
                color: colors.neutral[100],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[700],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[600],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[500],
                },
              }}
            >
              <MenuItem value="">
                <em>None (Optional)</em>
              </MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
            {departments.length === 0 && (
              <Typography variant="caption" sx={{ color: colors.warning[500], mt: 0.5, display: 'block' }}>
                No departments available. Create departments first.
              </Typography>
            )}
          </FormControl>

          {/* Group Selection */}
          <FormControl fullWidth>
            <InputLabel sx={{ color: colors.neutral[400] }}>
              Group
            </InputLabel>
            <Select
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setError(null);
              }}
              label="Group"
              disabled={approving || groups.length === 0}
              sx={{
                color: colors.neutral[100],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[700],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[600],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[500],
                },
              }}
            >
              <MenuItem value="">
                <em>None (Optional)</em>
              </MenuItem>
              {groups.map((group) => (
                <MenuItem key={group.id} value={group.id}>
                  {group.name}
                </MenuItem>
              ))}
            </Select>
            {groups.length === 0 && (
              <Typography variant="caption" sx={{ color: colors.warning[500], mt: 0.5, display: 'block' }}>
                No groups available. Create groups first.
              </Typography>
            )}
          </FormControl>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neutral[800]}` }}>
          <Button 
            onClick={handleCloseApproveDialog} 
            variant="outlined"
            disabled={approving}
            sx={{ 
              color: colors.neutral[300], 
              borderColor: colors.neutral[700],
              '&:hover': {
                borderColor: colors.neutral[600],
                backgroundColor: colors.neutral[800],
              },
            }}
          >
            Cancel (Esc)
          </Button>
          <Button 
            onClick={handleApproveUser} 
            variant="contained"
            color="success"
            disabled={!selectedRole || approving}
            sx={{
              backgroundColor: colors.success[500],
              '&:hover': {
                backgroundColor: colors.success[600],
              },
              '&:disabled': {
                backgroundColor: colors.neutral[700],
                color: colors.neutral[500],
              },
              minWidth: 140,
            }}
            startIcon={approving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {approving ? 'Approving...' : 'Approve & Assign (Enter)'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onClose={handleCloseAssignDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Role, Department & Group</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400], mb: 3 }}>
            Assign role, department and group for: <strong style={{ color: colors.neutral[100] }}>@{((selectedUser as any)?.username || selectedUser?.email || 'Unknown User')}</strong>
            {selectedUser?.email && (
              <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mt: 0.5 }}>
                Email: {selectedUser.email}
              </Typography>
            )}
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              label="Role"
            >
              <MenuItem value={UserRole.WORKER}>Worker</MenuItem>
              <MenuItem value={UserRole.OPERATOR}>Operator</MenuItem>
              <MenuItem value={UserRole.LEADER}>Leader</MenuItem>
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
            </Select>
          </FormControl>
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
            Are you sure you want to delete <strong style={{ color: colors.neutral[100] }}>@{((userToDelete as any)?.username || userToDelete?.email || 'Unknown User')}</strong>?
            {userToDelete?.email && (
              <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400], mt: 0.5 }}>
                Email: {userToDelete.email}
              </Typography>
            )}
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

      {/* Filter Dialog */}
      <Dialog 
        open={filterDialogOpen} 
        onClose={handleCloseFilterDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: colors.neutral[900],
            border: `1px solid ${colors.neutral[800]}`,
          },
        }}
      >
        <DialogTitle sx={{ color: colors.neutral[100], borderBottom: `1px solid ${colors.neutral[800]}` }}>
          Filter Users
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: colors.neutral[400] }}>Role</InputLabel>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              label="Role"
              sx={{
                color: colors.neutral[100],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[700],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[600],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[500],
                },
              }}
            >
              <MenuItem value="all">All Roles</MenuItem>
              <MenuItem value={UserRole.WORKER}>Worker</MenuItem>
              <MenuItem value={UserRole.OPERATOR}>Operator</MenuItem>
              <MenuItem value={UserRole.LEADER}>Leader</MenuItem>
              <MenuItem value={UserRole.ADMIN}>Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: colors.neutral[400] }}>Department</InputLabel>
            <Select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              label="Department"
              sx={{
                color: colors.neutral[100],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[700],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[600],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[500],
                },
              }}
            >
              <MenuItem value="all">All Departments</MenuItem>
              <MenuItem value="none">No Department</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ color: colors.neutral[400] }}>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
              disabled={tabValue === 0}
              sx={{
                color: colors.neutral[100],
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[700],
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.neutral[600],
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.primary[500],
                },
              }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
            {tabValue === 0 && (
              <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mt: 0.5 }}>
                Status filter is disabled on Pending Approval tab
              </Typography>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neutral[800]}` }}>
          <Button 
            onClick={handleCloseFilterDialog} 
            variant="outlined"
            sx={{ color: colors.neutral[300], borderColor: colors.neutral[700] }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleClearFilters} 
            variant="text" 
            sx={{ color: colors.neutral[400] }}
          >
            Clear All
          </Button>
          <Button 
            onClick={handleApplyFilters} 
            variant="contained"
            sx={{
              backgroundColor: colors.primary[500],
              '&:hover': {
                backgroundColor: colors.primary[600],
              },
            }}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Credentials Dialog */}
      <Dialog 
        open={editCredentialsDialogOpen} 
        onClose={() => {
          if (!savingCredentials) {
            setEditCredentialsDialogOpen(false);
            setEditingUsername('');
            setEditingPassword('');
            setError(null);
          }
        }}
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: colors.neutral[900],
            border: `1px solid ${colors.neutral[800]}`,
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: colors.neutral[100], borderBottom: `1px solid ${colors.neutral[800]}` }}>
          Edit User Credentials
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ 
            p: 2, 
            mb: 3, 
            backgroundColor: colors.neutral[950], 
            borderRadius: 1,
            border: `1px solid ${colors.neutral[800]}`,
          }}>
            <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mb: 1 }}>
              Editing credentials for:
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100] }}>
              @{((selectedUser as any)?.username || selectedUser?.email || 'Unknown User')}
            </Typography>
            {selectedUser?.email && (
              <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400], mt: 0.5 }}>
                Email: {selectedUser.email}
              </Typography>
            )}
          </Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Leave fields empty if you don't want to change them. Username must be at least 3 characters, password must be at least 6 characters.
            </Typography>
          </Alert>
          <TextField
            fullWidth
            label="Username"
            value={editingUsername}
            onChange={(e) => {
              setEditingUsername(e.target.value);
              setError(null);
            }}
            disabled={savingCredentials}
            sx={{ mb: 2 }}
            helperText={editingUsername.trim().length > 0 && editingUsername.trim().length < 3 ? 'Username must be at least 3 characters' : ''}
            error={editingUsername.trim().length > 0 && editingUsername.trim().length < 3}
          />
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={editingPassword}
            onChange={(e) => {
              setEditingPassword(e.target.value);
              setError(null);
            }}
            disabled={savingCredentials}
            helperText={editingPassword.length > 0 && editingPassword.length < 6 ? 'Password must be at least 6 characters' : 'Leave empty to keep current password'}
            error={editingPassword.length > 0 && editingPassword.length < 6}
            placeholder="Enter new password or leave empty"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${colors.neutral[800]}` }}>
          <Button 
            onClick={() => {
              setEditCredentialsDialogOpen(false);
              setEditingUsername('');
              setEditingPassword('');
              setError(null);
            }}
            variant="outlined"
            disabled={savingCredentials}
            sx={{ color: colors.neutral[300], borderColor: colors.neutral[700] }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCredentials}
            variant="contained"
            disabled={savingCredentials || (editingUsername.trim().length > 0 && editingUsername.trim().length < 3) || (editingPassword.length > 0 && editingPassword.length < 6)}
            sx={{
              backgroundColor: colors.primary[500],
              '&:hover': {
                backgroundColor: colors.primary[600],
              },
            }}
          >
            {savingCredentials ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onClose={handleCloseInviteDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9375rem', color: colors.neutral[300], mb: 3, mt: 1 }}>
            To invite a new user, generate a registration code. Users will use this code to register and create their account.
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Registration codes are role-specific. Make sure to generate the appropriate code for the user's intended role.
          </Alert>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleNavigateToCodeGeneration}
              sx={{ py: 1.5 }}
            >
              Go to Code Generation
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={handleCloseInviteDialog}
            >
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default UserManagementPage;
