import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  alpha,
} from '@mui/material';
import {
  Assignment,
  ArrowForward,
  Inventory,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { colors } from '../../theme';
import { RootState } from '../../store';

const WorkerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const isProduction = user?.departmentName?.toLowerCase() === 'production';

  const quickActions = isProduction
    ? [
        {
          title: 'View Products',
          description: 'Track production items',
          icon: <Inventory />,
          path: '/products',
          color: colors.primary[500],
        },
        {
          title: 'Product Delivery',
          description: 'Manage deliveries',
          icon: <Assignment />,
          path: '/products/delivery',
          color: colors.success[500],
        },
      ]
    : [
        {
          title: 'My Profile',
          description: 'View and edit your profile',
          icon: <Assignment />,
          path: '/profile',
          color: colors.primary[500],
        },
      ];

  return (
    <PageContainer
      title="Dashboard"
      subtitle={`Welcome back! ${user?.departmentName ? `You're assigned to ${user.departmentName} department.` : 'Contact admin to get assigned to a department.'}`}
    >

      {/* Quick Actions */}
      <Box
        sx={{
          backgroundColor: colors.neutral[900],
          border: `1px solid ${colors.neutral[800]}`,
          borderRadius: 3,
          p: 3,
        }}
      >
        <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          {quickActions.map((action) => (
            <Grid item xs={12} sm={6} md={4} key={action.title}>
              <Box
                onClick={() => navigate(action.path)}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${colors.neutral[800]}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: action.color,
                    backgroundColor: alpha(action.color, 0.04),
                    '& .action-arrow': {
                      opacity: 1,
                      transform: 'translateX(0)',
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    backgroundColor: alpha(action.color, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: action.color,
                    mb: 2,
                    '& .MuiSvgIcon-root': { fontSize: 24 },
                  }}
                >
                  {action.icon}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.neutral[100] }}>
                      {action.title}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8125rem', color: colors.neutral[500], mt: 0.5 }}>
                      {action.description}
                    </Typography>
                  </Box>
                  <ArrowForward
                    className="action-arrow"
                    sx={{
                      fontSize: 18,
                      color: action.color,
                      opacity: 0,
                      transform: 'translateX(-8px)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Department Status */}
      {!user?.departmentName && (
        <Box
          sx={{
            mt: 3,
            p: 3,
            backgroundColor: alpha(colors.warning[500], 0.08),
            border: `1px solid ${alpha(colors.warning[500], 0.2)}`,
            borderRadius: 2,
          }}
        >
          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500, color: colors.warning[500], mb: 1 }}>
            No Department Assigned
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[400] }}>
            You haven't been assigned to a department yet. Please contact your administrator to get assigned
            to either Production or Maintenance department.
          </Typography>
        </Box>
      )}
    </PageContainer>
  );
};

export default WorkerDashboardPage;
