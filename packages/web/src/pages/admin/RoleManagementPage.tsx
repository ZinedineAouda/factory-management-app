import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Divider,
  alpha,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import {
  Save,
  Refresh,
  Security,
  Edit,
  People,
  Group,
  Inventory,
  Description,
  Analytics,
  Add,
  Delete,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

interface RolePermissions {
  id: string;
  role: string;
  role_display_name?: string;
  can_view_users: number;
  can_edit_users: number;
  can_view_groups: number;
  can_edit_groups: number;
  can_view_products: number;
  can_edit_products: number;
  can_view_reports: number;
  can_edit_reports: number;
  can_view_analytics: number;
  max_data_reach: string;
  created_at: string;
  updated_at: string;
}

const getRoleDisplayName = (rolePerms: RolePermissions): string => {
  if (!rolePerms || !rolePerms.role) {
    return 'Unknown';
  }
  return rolePerms.role_display_name || (rolePerms.role.charAt(0).toUpperCase() + rolePerms.role.slice(1));
};

// Generate a consistent color for roles based on the role name
const generateRoleColor = (roleName: string): string => {
  let hash = 0;
  for (let i = 0; i < roleName.length; i++) {
    hash = roleName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
};

const getRoleColor = (role: string | null | undefined): string => {
  if (!role) {
    return colors.primary[500];
  }
  const defaultColors: Record<string, string> = {
    admin: colors.error[500],
    worker: colors.primary[500],
    operator: colors.warning[500],
    leader: colors.success[500],
  };
  return defaultColors[role.toLowerCase()] || generateRoleColor(role);
};

const RoleManagementPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [permissions, setPermissions] = useState<RolePermissions[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Record<string, boolean>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRoleName, setEditingRoleName] = useState<Record<string, { role: string; displayName: string }>>({});
  const [newRole, setNewRole] = useState({ role: '', role_display_name: '', max_data_reach: 'own' });

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(ApiEndpoints.ROLE_PERMISSIONS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPermissions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch role permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (role: string, field: string, value: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.role === role
          ? {
              ...p,
              [field]: value ? 1 : 0,
            }
          : p
      )
    );
  };

  const handleMaxReachChange = (role: string, value: string) => {
    setPermissions((prev) =>
      prev.map((p) => (p.role === role ? { ...p, max_data_reach: value } : p))
    );
  };

  const handleSave = async (role: string) => {
    try {
      setSaving((prev) => ({ ...prev, [role]: true }));
      setError(null);
      setSuccess((prev) => ({ ...prev, [role]: false }));

      const rolePermissions = permissions.find((p) => p.role === role);
      if (!rolePermissions) return;

      const editData = editingRoleName[role];
      await axios.put(
        ApiEndpoints.ROLE_PERMISSIONS.UPDATE(role),
        {
          role_display_name: editData?.displayName || rolePermissions.role_display_name || rolePermissions.role,
          new_role_name: editData?.role !== role ? editData?.role : undefined,
          can_view_users: rolePermissions.can_view_users === 1,
          can_edit_users: rolePermissions.can_edit_users === 1,
          can_view_groups: rolePermissions.can_view_groups === 1,
          can_edit_groups: rolePermissions.can_edit_groups === 1,
          can_view_products: rolePermissions.can_view_products === 1,
          can_edit_products: rolePermissions.can_edit_products === 1,
          can_view_reports: rolePermissions.can_view_reports === 1,
          can_edit_reports: rolePermissions.can_edit_reports === 1,
          can_view_analytics: rolePermissions.can_view_analytics === 1,
          max_data_reach: rolePermissions.max_data_reach,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEditingRoleName((prev) => {
        const newState = { ...prev };
        delete newState[role];
        return newState;
      });
      setSuccess((prev) => ({ ...prev, [role]: true }));
      setTimeout(() => {
        setSuccess((prev) => ({ ...prev, [role]: false }));
      }, 3000);
      fetchPermissions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save permissions');
    } finally {
      setSaving((prev) => ({ ...prev, [role]: false }));
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.role || !newRole.role.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, create: true }));
      setError(null);

      const roleName = String(newRole.role || '').trim().toLowerCase();
      if (!roleName) {
        setError('Role name is required');
        setSaving((prev) => ({ ...prev, create: false }));
        return;
      }

      await axios.post(
        ApiEndpoints.ROLE_PERMISSIONS.CREATE,
        {
          role: roleName,
          role_display_name: (newRole.role_display_name || '').trim() || roleName,
          max_data_reach: newRole.max_data_reach,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCreateDialogOpen(false);
      setNewRole({ role: '', role_display_name: '', max_data_reach: 'own' });
      fetchPermissions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create role');
    } finally {
      setSaving((prev) => ({ ...prev, create: false }));
    }
  };

  const handleDeleteRole = async (role: string) => {
    if (role === 'admin') {
      setError('Cannot delete admin role');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the role "${role}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting((prev) => ({ ...prev, [role]: true }));
      setError(null);

      await axios.delete(ApiEndpoints.ROLE_PERMISSIONS.DELETE(role), {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchPermissions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete role');
    } finally {
      setDeleting((prev) => ({ ...prev, [role]: false }));
    }
  };

  const startEditingRoleName = (rolePerms: RolePermissions) => {
    setEditingRoleName((prev) => ({
      ...prev,
      [rolePerms.role]: {
        role: rolePerms.role,
        displayName: rolePerms.role_display_name || rolePerms.role,
      },
    }));
  };

  const cancelEditingRoleName = (role: string) => {
    setEditingRoleName((prev) => {
      const newState = { ...prev };
      delete newState[role];
      return newState;
    });
  };

  const PermissionSection: React.FC<{ title: string; icon: React.ReactNode; role: string; viewField: string; editField: string }> = ({
    title,
    icon,
    role,
    viewField,
    editField,
  }) => {
    const rolePerms = permissions.find((p) => p.role === role);
    if (!rolePerms) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {icon}
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[200] }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, ml: 4 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={rolePerms[viewField as keyof RolePermissions] === 1}
                onChange={(e) => handlePermissionChange(role, viewField, e.target.checked)}
                sx={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& .MuiSwitch-switchBase': {
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-checked': {
                      color: colors.primary[500],
                    },
                    '&.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: colors.primary[500],
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                  },
                  '& .MuiSwitch-track': {
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '& .MuiSwitch-thumb': {
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                }}
              />
            }
            label="View"
            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem', color: colors.neutral[400] } }}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={rolePerms[editField as keyof RolePermissions] === 1}
                onChange={(e) => handlePermissionChange(role, editField, e.target.checked)}
                disabled={rolePerms[viewField as keyof RolePermissions] === 0}
                sx={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& .MuiSwitch-switchBase': {
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&.Mui-checked': {
                      color: colors.primary[500],
                    },
                    '&.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: colors.primary[500],
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    },
                  },
                  '& .MuiSwitch-track': {
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '& .MuiSwitch-thumb': {
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                }}
              />
            }
            label="Edit"
            sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem', color: colors.neutral[400] } }}
          />
        </Box>
      </Box>
    );
  };

  if (loading) {
    return (
      <PageContainer title="Role Management" subtitle="Control access and permissions for each role">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Role Management"
      subtitle="Control access, permissions, and data reach for each factory role"
      actions={
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchPermissions}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
            Add Role
          </Button>
        </Box>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {permissions
          .filter(rolePerms => rolePerms && rolePerms.role) // Filter out null/undefined roles
          .map((rolePerms) => (
          <Grid item xs={12} md={6} key={rolePerms.role}>
            <Card
              sx={{
                backgroundColor: colors.neutral[900],
                border: `1px solid ${colors.neutral[800]}`,
                borderRadius: 3,
                height: '100%',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: alpha(getRoleColor(rolePerms.role), 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getRoleColor(rolePerms.role),
                      }}
                    >
                      <Security sx={{ fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      {editingRoleName[rolePerms.role] ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <TextField
                            size="small"
                            label="Role Name"
                            value={editingRoleName[rolePerms.role].role}
                            onChange={(e) =>
                              setEditingRoleName((prev) => ({
                                ...prev,
                                [rolePerms.role]: {
                                  ...prev[rolePerms.role],
                                  role: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                                },
                              }))
                            }
                            placeholder="e.g., manager"
                            sx={{ mb: 1 }}
                            helperText="Lowercase letters, numbers, and underscores only"
                          />
                          <TextField
                            size="small"
                            label="Display Name"
                            value={editingRoleName[rolePerms.role].displayName}
                            onChange={(e) =>
                              setEditingRoleName((prev) => ({
                                ...prev,
                                [rolePerms.role]: {
                                  ...prev[rolePerms.role],
                                  displayName: e.target.value,
                                },
                              }))
                            }
                            placeholder="e.g., Manager"
                          />
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => cancelEditingRoleName(rolePerms.role)}
                            >
                              Cancel
                            </Button>
                          </Box>
                        </Box>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: colors.neutral[100] }}>
                              {getRoleDisplayName(rolePerms)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => startEditingRoleName(rolePerms)}
                              sx={{ color: colors.neutral[400] }}
                            >
                              <Edit sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                          <Chip
                            label={rolePerms.role}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              backgroundColor: alpha(getRoleColor(rolePerms.role), 0.1),
                              color: getRoleColor(rolePerms.role),
                              mt: 0.5,
                            }}
                          />
                        </>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {success[rolePerms.role] && (
                      <Chip label="Saved!" size="small" sx={{ backgroundColor: colors.success[500], color: 'white' }} />
                    )}
                    {rolePerms.role !== 'admin' && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRole(rolePerms.role)}
                        disabled={deleting[rolePerms.role]}
                        sx={{ color: colors.error[500] }}
                      >
                        {deleting[rolePerms.role] ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Delete sx={{ fontSize: 18 }} />
                        )}
                      </IconButton>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 2, borderColor: colors.neutral[800] }} />

                {/* Max Data Reach */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[200], mb: 1 }}>
                    Max Data Reach
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={rolePerms.max_data_reach}
                      onChange={(e) => handleMaxReachChange(rolePerms.role, e.target.value)}
                      sx={{
                        backgroundColor: colors.neutral[950],
                        color: colors.neutral[100],
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.neutral[800],
                        },
                      }}
                    >
                      <MenuItem value="own">Own Data Only</MenuItem>
                      <MenuItem value="department">Department Data</MenuItem>
                      <MenuItem value="group">Group Data</MenuItem>
                      <MenuItem value="all">All Data</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mt: 0.5 }}>
                    Controls how much data this role can access
                  </Typography>
                </Box>

                <Divider sx={{ my: 2, borderColor: colors.neutral[800] }} />

                {/* Permissions */}
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[200], mb: 2 }}>
                  Permissions
                </Typography>

                <PermissionSection
                  title="Users"
                  icon={<People sx={{ fontSize: 18, color: colors.neutral[400] }} />}
                  role={rolePerms.role}
                  viewField="can_view_users"
                  editField="can_edit_users"
                />

                <PermissionSection
                  title="Groups"
                  icon={<Group sx={{ fontSize: 18, color: colors.neutral[400] }} />}
                  role={rolePerms.role}
                  viewField="can_view_groups"
                  editField="can_edit_groups"
                />

                <PermissionSection
                  title="Products"
                  icon={<Inventory sx={{ fontSize: 18, color: colors.neutral[400] }} />}
                  role={rolePerms.role}
                  viewField="can_view_products"
                  editField="can_edit_products"
                />

                <PermissionSection
                  title="Reports"
                  icon={<Description sx={{ fontSize: 18, color: colors.neutral[400] }} />}
                  role={rolePerms.role}
                  viewField="can_view_reports"
                  editField="can_edit_reports"
                />

                <PermissionSection
                  title="Analytics"
                  icon={<Analytics sx={{ fontSize: 18, color: colors.neutral[400] }} />}
                  role={rolePerms.role}
                  viewField="can_view_analytics"
                  editField="can_view_analytics"
                />

                <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${colors.neutral[800]}` }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={saving[rolePerms.role] ? <CircularProgress size={16} /> : <Save />}
                    onClick={() => handleSave(rolePerms.role)}
                    disabled={saving[rolePerms.role]}
                  >
                    {saving[rolePerms.role] ? 'Saving...' : 'Save Permissions'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Role Name"
            value={newRole.role}
            onChange={(e) =>
              setNewRole({
                ...newRole,
                role: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
              })
            }
            margin="normal"
            required
            autoFocus
            placeholder="e.g., manager"
            helperText="Lowercase letters, numbers, and underscores only"
          />
          <TextField
            fullWidth
            label="Display Name"
            value={newRole.role_display_name}
            onChange={(e) => setNewRole({ ...newRole, role_display_name: e.target.value })}
            margin="normal"
            placeholder="e.g., Manager"
            helperText="How this role will be displayed in the UI"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Max Data Reach</InputLabel>
            <Select
              value={newRole.max_data_reach}
              onChange={(e) => setNewRole({ ...newRole, max_data_reach: e.target.value })}
              label="Max Data Reach"
            >
              <MenuItem value="own">Own Data Only</MenuItem>
              <MenuItem value="department">Department Data</MenuItem>
              <MenuItem value="group">Group Data</MenuItem>
              <MenuItem value="all">All Data</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} variant="outlined" disabled={saving.create}>
            Cancel
          </Button>
          <Button onClick={handleCreateRole} variant="contained" disabled={saving.create || !newRole.role.trim()}>
            {saving.create ? <CircularProgress size={20} /> : 'Create Role'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default RoleManagementPage;

