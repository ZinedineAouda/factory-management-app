import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  alpha,
} from '@mui/material';
import {
  Person,
  Email,
  Badge,
  Business,
  Group,
  CalendarToday,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { colors } from '../../theme';
import { RootState } from '../../store';

const ProfilePage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  const getUserInitials = () => {
    if ((user as any)?.username) {
      return (user as any).username.charAt(0).toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const profileFields = [
    { label: 'Username', value: (user as any)?.username || '—', icon: <Person /> },
    { label: 'Email', value: (user as any)?.email || '—', icon: <Email /> },
    { label: 'Role', value: user?.role || '—', icon: <Badge /> },
    { label: 'Department', value: user?.departmentName || 'Not assigned', icon: <Business /> },
    { label: 'Group', value: (user as any)?.group_name || 'Not assigned', icon: <Group /> },
    { label: 'Member Since', value: (user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : '—', icon: <CalendarToday /> },
  ];

  return (
    <PageContainer
      title="Profile"
      subtitle="View and manage your account information"
    >
      <Grid container spacing={4}>
        {/* Profile Card */}
          <Grid item xs={12} md={4}>
          <Box
            sx={{
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
            }}
          >
                  <Avatar
                    sx={{
                width: 100,
                height: 100,
                      mx: 'auto',
                mb: 3,
                bgcolor: colors.primary[600],
                fontSize: '2.5rem',
                fontWeight: 600,
                    }}
                  >
              {getUserInitials()}
                  </Avatar>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.neutral[100] }}>
              {(user as any)?.username || 'User'}
            </Typography>
            <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500], mt: 0.5, textTransform: 'capitalize' }}>
              {user?.role}
            </Typography>
            {user?.departmentName && (
              <Box
                sx={{
                  mt: 2,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  backgroundColor: alpha(colors.primary[500], 0.1),
                  display: 'inline-flex',
                }}
              >
                <Typography sx={{ fontSize: '0.8125rem', color: colors.primary[400] }}>
                  {user.departmentName}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3, borderColor: colors.neutral[800] }} />

            <Typography sx={{ fontSize: '0.8125rem', color: colors.neutral[500], textAlign: 'center' }}>
              To edit your profile, change password, or manage settings, go to Settings from the user menu.
                    </Typography>
                  </Box>
          </Grid>

        {/* Profile Details */}
          <Grid item xs={12} md={8}>
          <Box
            sx={{
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
              p: 4,
            }}
          >
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: colors.neutral[100], mb: 3 }}>
              Account Information
                  </Typography>

            <Grid container spacing={3}>
              {profileFields.map((field) => (
                <Grid item xs={12} sm={6} key={field.label}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: colors.neutral[950],
                      border: `1px solid ${colors.neutral[800]}`,
                    }}
                      >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: alpha(colors.primary[500], 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.primary[400],
                        flexShrink: 0,
                        '& .MuiSvgIcon-root': { fontSize: 20 },
                      }}
                      >
                      {field.icon}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mb: 0.5 }}>
                        {field.label}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.9375rem',
                          fontWeight: 500,
                          color: colors.neutral[100],
                          textTransform: field.label === 'Role' ? 'capitalize' : 'none',
                        }}
                      >
                        {field.value}
                      </Typography>
                    </Box>
                    </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Activity Section */}
          <Box
            sx={{
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
              p: 4,
              mt: 3,
            }}
          >
            <Typography sx={{ fontSize: '1.125rem', fontWeight: 600, color: colors.neutral[100], mb: 3 }}>
              Recent Activity
            </Typography>
            <Box
              sx={{
                textAlign: 'center',
                py: 4,
                color: colors.neutral[500],
              }}
            >
              <Typography sx={{ fontSize: '0.9375rem' }}>
                No recent activity to display
              </Typography>
            </Box>
          </Box>
          </Grid>
        </Grid>
    </PageContainer>
  );
};

export default ProfilePage;
