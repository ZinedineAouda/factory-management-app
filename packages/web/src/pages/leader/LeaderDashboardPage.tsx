import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  alpha,
} from '@mui/material';
import {
  Description,
  ArrowForward,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { colors } from '../../theme';

const LeaderDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'View Reports',
      description: 'View and manage reports',
      icon: <Description />,
      path: '/admin/reports',
      color: colors.primary[500],
    },
  ];

  return (
    <PageContainer
      title="Leader Dashboard"
      subtitle="View reports and manage your team"
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
            <Grid item xs={12} sm={6} key={action.title}>
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
    </PageContainer>
  );
};

export default LeaderDashboardPage;
