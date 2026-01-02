import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  alpha,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  CheckCircle,
  Schedule,
  Refresh,
  Pending,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { StatCard } from '../../components/ui';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

interface ProductionAnalytics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionRate: number;
  averageProgress: number;
  tasksByProduct: Array<{ productName: string; count: number }>;
  tasksByGroup: Array<{ groupName: string; count: number }>;
}

interface MaintenanceAnalytics {
  totalReports: number;
  reportsByGroup: Array<{ groupName: string; count: number }>;
  averageResponseTime: number;
}

const AnalyticsPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productionData, setProductionData] = useState<ProductionAnalytics | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceAnalytics | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [tabValue]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (tabValue === 0) {
        const response = await axios.get(ApiEndpoints.ANALYTICS.PRODUCTION, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data || {};
        setProductionData({
          totalTasks: data.totalTasks || 0,
          completedTasks: data.completedTasks || 0,
          inProgressTasks: data.inProgressTasks || 0,
          pendingTasks: data.pendingTasks || 0,
          completionRate: data.completionRate || 0,
          averageProgress: data.averageProgress || 0,
          tasksByProduct: data.tasksByProduct || [],
          tasksByGroup: data.tasksByGroup || [],
        });
      } else {
        const response = await axios.get(ApiEndpoints.ANALYTICS.MAINTENANCE, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data || {};
        setMaintenanceData({
          totalReports: data.totalReports || 0,
          reportsByGroup: data.reportsByGroup || [],
          averageResponseTime: data.averageResponseTime || 0,
        });
      }
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch analytics');
      if (tabValue === 0) {
        setProductionData({
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          pendingTasks: 0,
          completionRate: 0,
          averageProgress: 0,
          tasksByProduct: [],
          tasksByGroup: [],
        });
      } else {
        setMaintenanceData({
          totalReports: 0,
          reportsByGroup: [],
          averageResponseTime: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await axios.post(
        ApiEndpoints.ANALYTICS.REFRESH,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchAnalytics();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to refresh analytics');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <PageContainer
      title="Analytics"
      subtitle="Track production and maintenance performance metrics"
      actions={
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} /> : <Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Refresh
        </Button>
      }
    >
      {/* Tabs */}
      <Box
        sx={{
          backgroundColor: colors.neutral[900],
          border: `1px solid ${colors.neutral[800]}`,
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Production Analytics" />
          <Tab label="Maintenance Analytics" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : tabValue === 0 && productionData ? (
        <>
          {/* Stats Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Tasks"
                value={productionData.totalTasks}
                icon={<Assignment />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Completed"
                value={productionData.completedTasks}
                icon={<CheckCircle />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="In Progress"
                value={productionData.inProgressTasks}
                icon={<Schedule />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Completion Rate"
                value={`${productionData.completionRate.toFixed(1)}%`}
                icon={<TrendingUp />}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  backgroundColor: colors.neutral[900],
                  border: `1px solid ${colors.neutral[800]}`,
                  borderRadius: 3,
                  p: 3,
                }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 3 }}>
                  Tasks by Product
                </Typography>
                {productionData.tasksByProduct.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {productionData.tasksByProduct.map((item, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[300] }}>
                            {item.productName || 'Unassigned'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[100] }}>
                            {item.count}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={productionData.totalTasks > 0 ? (item.count / productionData.totalTasks) * 100 : 0}
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            backgroundColor: colors.neutral[800],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: colors.primary[500],
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500], textAlign: 'center', py: 4 }}>
                    No data available
                  </Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  backgroundColor: colors.neutral[900],
                  border: `1px solid ${colors.neutral[800]}`,
                  borderRadius: 3,
                  p: 3,
                }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 3 }}>
                  Tasks by Group
                </Typography>
                {productionData.tasksByGroup.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {productionData.tasksByGroup.map((item, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[300] }}>
                            {item.groupName || 'Unassigned'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[100] }}>
                            {item.count}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={productionData.totalTasks > 0 ? (item.count / productionData.totalTasks) * 100 : 0}
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            backgroundColor: colors.neutral[800],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: colors.success[500],
                            },
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500], textAlign: 'center', py: 4 }}>
                    No data available
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </>
      ) : tabValue === 1 && maintenanceData ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Total Reports"
              value={maintenanceData.totalReports}
              icon={<Assignment />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                backgroundColor: colors.neutral[900],
                border: `1px solid ${colors.neutral[800]}`,
                borderRadius: 3,
                p: 3,
              }}
            >
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 3 }}>
                Reports by Group
              </Typography>
              {maintenanceData.reportsByGroup.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {maintenanceData.reportsByGroup.map((item, index) => (
                    <Box key={index}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[300] }}>
                          {item.groupName || 'Unassigned'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[100] }}>
                          {item.count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={maintenanceData.totalReports > 0 ? (item.count / maintenanceData.totalReports) * 100 : 0}
                        sx={{
                          height: 6,
                          borderRadius: 1,
                          backgroundColor: colors.neutral[800],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: colors.warning[500],
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500], textAlign: 'center', py: 4 }}>
                  No data available
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Alert severity="info">No data available</Alert>
      )}
    </PageContainer>
  );
};

export default AnalyticsPage;
