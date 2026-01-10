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
  LinearProgress,
  TextField,
  Paper,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  CheckCircle,
  Refresh,
  LocalShipping,
  Inventory,
  CalendarToday,
} from '@mui/icons-material';
import PageContainer from '../../components/layout/PageContainer';
import { StatCard } from '../../components/ui';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
import { RootState } from '../../store';

interface ProductionAnalytics {
  totalDeliveries: number;
  totalAmount: number;
  deliveriesByProduct: Array<{ productName: string; deliveryCount: number; totalAmount: number }>;
  deliveriesByWorker: Array<{ workerName: string; deliveryCount: number; totalAmount: number }>;
  deliveriesByDate: Array<{ date: string; amount: number }>;
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
  
  // Date range state - default to last 30 days
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  };
  
  const getDefaultEndDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState<string>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<string>(getDefaultEndDate());

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, startDate, endDate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for date filtering
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      const queryString = params.toString();
      const url = queryString ? `${ApiEndpoints.ANALYTICS.PRODUCTION}?${queryString}` : ApiEndpoints.ANALYTICS.PRODUCTION;

      if (tabValue === 0) {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data || {};
        setProductionData({
          totalDeliveries: data.totalDeliveries || 0,
          totalAmount: data.totalAmount || 0,
          deliveriesByProduct: data.deliveriesByProduct || [],
          deliveriesByWorker: data.deliveriesByWorker || [],
          deliveriesByDate: data.deliveriesByDate || [],
        });
      } else {
        const maintenanceUrl = queryString ? `${ApiEndpoints.ANALYTICS.MAINTENANCE}?${queryString}` : ApiEndpoints.ANALYTICS.MAINTENANCE;
        const response = await axios.get(maintenanceUrl, {
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
          totalDeliveries: 0,
          totalAmount: 0,
          deliveriesByProduct: [],
          deliveriesByWorker: [],
          deliveriesByDate: [],
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

  const handleResetDates = () => {
    setStartDate(getDefaultStartDate());
    setEndDate(getDefaultEndDate());
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
      {/* Date Range Picker */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: colors.neutral[900],
          border: `1px solid ${colors.neutral[800]}`,
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <CalendarToday sx={{ color: colors.neutral[400], fontSize: 20 }} />
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[300], mr: 1 }}>
            Date Range:
          </Typography>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: colors.neutral[800],
                '& fieldset': {
                  borderColor: colors.neutral[700],
                },
                '&:hover fieldset': {
                  borderColor: colors.neutral[600],
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.primary[500],
                },
              },
              '& .MuiInputBase-input': {
                color: colors.neutral[100],
              },
              '& .MuiInputLabel-root': {
                color: colors.neutral[400],
              },
            }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: colors.neutral[800],
                '& fieldset': {
                  borderColor: colors.neutral[700],
                },
                '&:hover fieldset': {
                  borderColor: colors.neutral[600],
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.primary[500],
                },
              },
              '& .MuiInputBase-input': {
                color: colors.neutral[100],
              },
              '& .MuiInputLabel-root': {
                color: colors.neutral[400],
              },
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={handleResetDates}
            sx={{
              ml: 'auto',
              borderColor: colors.neutral[700],
              color: colors.neutral[300],
              '&:hover': {
                borderColor: colors.neutral[600],
                backgroundColor: colors.neutral[800],
              },
            }}
          >
            Reset to Last 30 Days
          </Button>
        </Box>
      </Paper>

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
                title="Total Deliveries"
                value={productionData.totalDeliveries}
                icon={<LocalShipping />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Amount"
                value={productionData.totalAmount.toLocaleString()}
                icon={<CheckCircle />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Avg per Delivery"
                value={productionData.totalDeliveries > 0 
                  ? (productionData.totalAmount / productionData.totalDeliveries).toFixed(1)
                  : '0'}
                icon={<TrendingUp />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Products"
                value={productionData.deliveriesByProduct.length}
                icon={<Inventory />}
                color="warning"
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
                  Deliveries by Product
                </Typography>
                {productionData.deliveriesByProduct.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {productionData.deliveriesByProduct.map((item, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[300] }}>
                            {item.productName || 'Unknown'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[100] }}>
                              {item.deliveryCount} deliveries
                            </Typography>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.success[500] }}>
                              {item.totalAmount.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={productionData.totalAmount > 0 ? (item.totalAmount / productionData.totalAmount) * 100 : 0}
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
                    No deliveries yet
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
                  Deliveries by Worker
                </Typography>
                {productionData.deliveriesByWorker.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {productionData.deliveriesByWorker.map((item, index) => (
                      <Box key={index}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[300] }}>
                            {item.workerName || 'Unknown'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[100] }}>
                              {item.deliveryCount} deliveries
                            </Typography>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.success[500] }}>
                              {item.totalAmount.toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={productionData.totalAmount > 0 ? (item.totalAmount / productionData.totalAmount) * 100 : 0}
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
                    No deliveries yet
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
