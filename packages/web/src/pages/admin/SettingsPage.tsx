import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Grid,
  alpha,
} from '@mui/material';
import {
  Person,
  Lock,
  Notifications,
  Save,
  CheckCircle,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState, AppDispatch } from '../../store';
import { refreshUser } from '../../store/slices/authSlice';

interface NotificationPreferences {
  notifyOnProfileUpdate: boolean;
  notifyOnPasswordChange: boolean;
  notifyOnUsernameChange: boolean;
  notifyOnTaskAssigned: boolean;
  notifyOnTaskCompleted: boolean;
  notifyOnReportCreated: boolean;
  notifyOnUserRegistered: boolean;
  notifyOnDepartmentChanges: boolean;
}

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Record<string, boolean>>({});

  // Password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Username
  const [usernameData, setUsernameData] = useState({
    newUsername: '',
    password: '',
  });

  // Notifications
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    notifyOnProfileUpdate: true,
    notifyOnPasswordChange: true,
    notifyOnUsernameChange: true,
    notifyOnTaskAssigned: true,
    notifyOnTaskCompleted: true,
    notifyOnReportCreated: true,
    notifyOnUserRegistered: false,
    notifyOnDepartmentChanges: false,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await axios.get(ApiEndpoints.SETTINGS.PREFERENCES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data);
    } catch (err: any) {
      console.error('Failed to fetch preferences:', err);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, password: true }));
      setError(null);

      await axios.put(
        ApiEndpoints.SETTINGS.CHANGE_PASSWORD,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess((prev) => ({ ...prev, password: true }));
      setTimeout(() => setSuccess((prev) => ({ ...prev, password: false })), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving((prev) => ({ ...prev, password: false }));
    }
  };

  const handleChangeUsername = async () => {
    if (usernameData.newUsername.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, username: true }));
      setError(null);

      const response = await axios.put(
        ApiEndpoints.SETTINGS.CHANGE_USERNAME,
        {
          newUsername: usernameData.newUsername,
          password: usernameData.password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh user data from backend
      await dispatch(refreshUser());
      setUsernameData({ newUsername: '', password: '' });
      setSuccess((prev) => ({ ...prev, username: true }));
      setTimeout(() => setSuccess((prev) => ({ ...prev, username: false })), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to change username');
    } finally {
      setSaving((prev) => ({ ...prev, username: false }));
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving((prev) => ({ ...prev, notifications: true }));
      setError(null);

      await axios.put(
        ApiEndpoints.SETTINGS.PREFERENCES,
        notifications,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess((prev) => ({ ...prev, notifications: true }));
      setTimeout(() => setSuccess((prev) => ({ ...prev, notifications: false })), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save notification preferences');
    } finally {
      setSaving((prev) => ({ ...prev, notifications: false }));
    }
  };

  return (
    <PageContainer
      title="Settings"
      subtitle="Manage your account settings, preferences, and notifications"
    >
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Lock sx={{ fontSize: 24, color: colors.primary[400] }} />
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: colors.neutral[100] }}>
                  Change Password
                </Typography>
                {success.password && (
                  <CheckCircle sx={{ fontSize: 20, color: colors.success[500], ml: 'auto' }} />
                )}
              </Box>

              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                margin="normal"
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                margin="normal"
              />

              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                startIcon={saving.password ? <CircularProgress size={16} /> : <Save />}
                onClick={handleChangePassword}
                disabled={saving.password}
              >
                {saving.password ? 'Changing...' : 'Change Password'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Username */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Person sx={{ fontSize: 24, color: colors.primary[400] }} />
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: colors.neutral[100] }}>
                  Change Username
                </Typography>
                {success.username && (
                  <CheckCircle sx={{ fontSize: 20, color: colors.success[500], ml: 'auto' }} />
                )}
              </Box>

              <TextField
                fullWidth
                label="Current Username"
                value={(user as any)?.username || ''}
                margin="normal"
                disabled
              />
              <TextField
                fullWidth
                label="New Username"
                value={usernameData.newUsername}
                onChange={(e) => setUsernameData({ ...usernameData, newUsername: e.target.value })}
                margin="normal"
                placeholder="Enter new username"
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm with Password"
                value={usernameData.password}
                onChange={(e) => setUsernameData({ ...usernameData, password: e.target.value })}
                margin="normal"
                helperText="Enter your current password to confirm"
              />

              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                startIcon={saving.username ? <CircularProgress size={16} /> : <Save />}
                onClick={handleChangeUsername}
                disabled={saving.username}
              >
                {saving.username ? 'Changing...' : 'Change Username'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Preferences */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Notifications sx={{ fontSize: 24, color: colors.primary[400] }} />
                <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: colors.neutral[100] }}>
                  Notification Preferences
                </Typography>
                {success.notifications && (
                  <CheckCircle sx={{ fontSize: 20, color: colors.success[500], ml: 'auto' }} />
                )}
              </Box>

              <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400], mb: 2 }}>
                Choose which notifications you want to receive
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={notifications.notifyOnProfileUpdate}
                      onChange={(e) =>
                        setNotifications({ ...notifications, notifyOnProfileUpdate: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
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
                  label="Profile Updates"
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: '0.875rem', 
                      color: colors.neutral[400],
                      ml: 2,
                      cursor: 'default',
                      userSelect: 'none',
                    },
                    '& .MuiFormControlLabel-root': {
                      marginRight: 0,
                    }
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={notifications.notifyOnPasswordChange}
                      onChange={(e) =>
                        setNotifications({ ...notifications, notifyOnPasswordChange: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
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
                  label="Password Changes"
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: '0.875rem', 
                      color: colors.neutral[400],
                      ml: 2,
                      cursor: 'default',
                      userSelect: 'none',
                    },
                    '& .MuiFormControlLabel-root': {
                      marginRight: 0,
                    }
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={notifications.notifyOnUsernameChange}
                      onChange={(e) =>
                        setNotifications({ ...notifications, notifyOnUsernameChange: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
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
                  label="Username Changes"
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: '0.875rem', 
                      color: colors.neutral[400],
                      ml: 2,
                      cursor: 'default',
                      userSelect: 'none',
                    },
                    '& .MuiFormControlLabel-root': {
                      marginRight: 0,
                    }
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={notifications.notifyOnTaskAssigned}
                      onChange={(e) =>
                        setNotifications({ ...notifications, notifyOnTaskAssigned: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
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
                  label="Task Assignments"
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: '0.875rem', 
                      color: colors.neutral[400],
                      ml: 2,
                      cursor: 'default',
                      userSelect: 'none',
                    },
                    '& .MuiFormControlLabel-root': {
                      marginRight: 0,
                    }
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={notifications.notifyOnTaskCompleted}
                      onChange={(e) =>
                        setNotifications({ ...notifications, notifyOnTaskCompleted: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
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
                  label="Task Completions"
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: '0.875rem', 
                      color: colors.neutral[400],
                      ml: 2,
                      cursor: 'default',
                      userSelect: 'none',
                    },
                    '& .MuiFormControlLabel-root': {
                      marginRight: 0,
                    }
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={notifications.notifyOnReportCreated}
                      onChange={(e) =>
                        setNotifications({ ...notifications, notifyOnReportCreated: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
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
                  label="New Reports"
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: '0.875rem', 
                      color: colors.neutral[400],
                      ml: 2,
                      cursor: 'default',
                      userSelect: 'none',
                    },
                    '& .MuiFormControlLabel-root': {
                      marginRight: 0,
                    }
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={notifications.notifyOnUserRegistered}
                      onChange={(e) =>
                        setNotifications({ ...notifications, notifyOnUserRegistered: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
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
                  label="New User Registrations"
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: '0.875rem', 
                      color: colors.neutral[400],
                      ml: 2,
                      cursor: 'default',
                      userSelect: 'none',
                    },
                    '& .MuiFormControlLabel-root': {
                      marginRight: 0,
                    }
                  }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={notifications.notifyOnDepartmentChanges}
                      onChange={(e) =>
                        setNotifications({ ...notifications, notifyOnDepartmentChanges: e.target.checked })
                      }
                      onClick={(e) => e.stopPropagation()}
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
                  label="Department Changes"
                  onClick={(e) => e.preventDefault()}
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: '0.875rem', 
                      color: colors.neutral[400],
                      ml: 2,
                      cursor: 'default',
                      userSelect: 'none',
                    },
                    '& .MuiFormControlLabel-root': {
                      marginRight: 0,
                    }
                  }}
                />
              </Box>

              <Button
                variant="contained"
                fullWidth
                sx={{ mt: 3 }}
                startIcon={saving.notifications ? <CircularProgress size={16} /> : <Save />}
                onClick={handleSaveNotifications}
                disabled={saving.notifications}
              >
                {saving.notifications ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default SettingsPage;

