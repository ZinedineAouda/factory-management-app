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
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  TrendingUp,
  Assignment,
  CheckCircle,
  Refresh,
  LocalShipping,
  Inventory,
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  Today,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
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

interface GroupPerformance {
  id: string;
  group_name: string;
  total_deliveries: number;
  total_amount: number;
  active_workers: number;
  products_handled: number;
  avg_delivery_amount: number;
  efficiency_score: number;
}

interface ReportsAnalytics {
  totalReports: number;
  reportsByGroup: Array<{ groupName: string; count: number }>;
  averageResponseTime: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductAnalytics {
  product: Product;
  totalDeliveries: number;
  totalAmount: number;
  averageAmount: number;
  bestGroup: { groupName: string; totalAmount: number } | null;
  groupsPerformance: Array<{ groupName: string; totalAmount: number; totalDeliveries: number; avgAmount: number }>;
  topWorkers: Array<{ username: string; totalAmount: number; totalDeliveries: number }>;
  deliveriesByDate: Array<{ date: string; amount: number }>;
  deliveries: Array<any>;
}

const AnalyticsPage: React.FC = () => {
  const { token } = useSelector((state: RootState) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productionData, setProductionData] = useState<ProductionAnalytics | null>(null);
  const [reportsData, setReportsData] = useState<ReportsAnalytics | null>(null);
  const [groupsData, setGroupsData] = useState<GroupPerformance[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Date range state - default to last 30 days
  type PeriodType = 'today' | '7days' | '30days' | '90days';
  const [period, setPeriod] = useState<PeriodType>('30days');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const getStartDate = (periodType: PeriodType, endDateStr: string) => {
    const end = new Date(endDateStr);
    const start = new Date(end);
    
    switch (periodType) {
      case 'today':
        return endDateStr; // Same day
      case '7days':
        start.setDate(start.getDate() - 6); // Last 7 days (including today)
        break;
      case '30days':
        start.setDate(start.getDate() - 29); // Last 30 days (including today)
        break;
      case '90days':
        start.setDate(start.getDate() - 89); // Last 90 days (including today)
        break;
    }
    return start.toISOString().split('T')[0];
  };
  
  const startDate = getStartDate(period, endDate);
  
  const handlePreviousPeriod = () => {
    const current = new Date(endDate);
    const days = period === 'today' ? 1 : period === '7days' ? 7 : period === '30days' ? 30 : 90;
    current.setDate(current.getDate() - days);
    setEndDate(current.toISOString().split('T')[0]);
  };
  
  const handleNextPeriod = () => {
    const current = new Date(endDate);
    const maxDate = new Date().toISOString().split('T')[0];
    if (current.toISOString().split('T')[0] >= maxDate) return; // Can't go beyond today
    
    const days = period === 'today' ? 1 : period === '7days' ? 7 : period === '30days' ? 30 : 90;
    current.setDate(current.getDate() + days);
    const max = new Date();
    if (current > max) {
      setEndDate(maxDate);
    } else {
      setEndDate(current.toISOString().split('T')[0]);
    }
  };
  
  const handleGoToToday = () => {
    setEndDate(new Date().toISOString().split('T')[0]);
  };
  
  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
    // Keep endDate as is, just change the period
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      fetchProductAnalytics();
    } else {
      fetchAnalytics();
      if (tabValue === 0) {
        fetchGroupsAnalytics();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, startDate, endDate, selectedProductId, period]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await axios.get(ApiEndpoints.PRODUCTS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data || []);
    } catch (err: any) {
      console.error('Fetch products error:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchProductAnalytics = async () => {
    if (!selectedProductId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      const queryString = params.toString();
      const url = queryString 
        ? `${ApiEndpoints.ANALYTICS.PRODUCT(selectedProductId)}?${queryString}`
        : ApiEndpoints.ANALYTICS.PRODUCT(selectedProductId);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = response.data;
      // Normalize: backend returns avgAmount, but interface expects averageAmount
      setProductAnalytics({
        ...data,
        averageAmount: data.avgAmount || data.averageAmount || 0,
        groupsPerformance: data.groupsByPerformance || data.groupsPerformance || [],
      });
    } catch (err: any) {
      console.error('Product analytics fetch error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch product analytics');
      setProductAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

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
        const reportsUrl = queryString ? `${ApiEndpoints.ANALYTICS.MAINTENANCE}?${queryString}` : ApiEndpoints.ANALYTICS.MAINTENANCE;
        const response = await axios.get(reportsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = response.data || {};
        setReportsData({
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
        setReportsData({
          totalReports: 0,
          reportsByGroup: [],
          averageResponseTime: 0,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupsAnalytics = async () => {
    try {
      setLoadingGroups(true);
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      const queryString = params.toString();
      const url = queryString ? `${ApiEndpoints.ANALYTICS.GROUPS}?${queryString}` : ApiEndpoints.ANALYTICS.GROUPS;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroupsData(response.data.groups || []);
    } catch (err: any) {
      console.error('Fetch groups analytics error:', err);
      setGroupsData([]);
    } finally {
      setLoadingGroups(false);
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


  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setProductAnalytics(null);
  };

  return (
    <PageContainer
      title="Analytics"
      subtitle="Track production and reports performance metrics"
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
          
          {/* Period Selector Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant={period === 'today' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handlePeriodChange('today')}
              sx={{
                minWidth: 70,
                ...(period === 'today' ? {
                  backgroundColor: colors.primary[600],
                  '&:hover': { backgroundColor: colors.primary[700] },
                } : {
                  borderColor: colors.neutral[700],
                  color: colors.neutral[300],
                  '&:hover': {
                    borderColor: colors.neutral[600],
                    backgroundColor: colors.neutral[800],
                  },
                }),
              }}
            >
              Today
            </Button>
            <Button
              variant={period === '7days' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handlePeriodChange('7days')}
              sx={{
                minWidth: 90,
                ...(period === '7days' ? {
                  backgroundColor: colors.primary[600],
                  '&:hover': { backgroundColor: colors.primary[700] },
                } : {
                  borderColor: colors.neutral[700],
                  color: colors.neutral[300],
                  '&:hover': {
                    borderColor: colors.neutral[600],
                    backgroundColor: colors.neutral[800],
                  },
                }),
              }}
            >
              Last 7 Days
            </Button>
            <Button
              variant={period === '30days' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handlePeriodChange('30days')}
              sx={{
                minWidth: 100,
                ...(period === '30days' ? {
                  backgroundColor: colors.primary[600],
                  '&:hover': { backgroundColor: colors.primary[700] },
                } : {
                  borderColor: colors.neutral[700],
                  color: colors.neutral[300],
                  '&:hover': {
                    borderColor: colors.neutral[600],
                    backgroundColor: colors.neutral[800],
                  },
                }),
              }}
            >
              Last 30 Days
            </Button>
            <Button
              variant={period === '90days' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => handlePeriodChange('90days')}
              sx={{
                minWidth: 100,
                ...(period === '90days' ? {
                  backgroundColor: colors.primary[600],
                  '&:hover': { backgroundColor: colors.primary[700] },
                } : {
                  borderColor: colors.neutral[700],
                  color: colors.neutral[300],
                  '&:hover': {
                    borderColor: colors.neutral[600],
                    backgroundColor: colors.neutral[800],
                  },
                }),
              }}
            >
              Last 90 Days
            </Button>
          </Box>
          
          {/* Date Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <IconButton
              size="small"
              onClick={handlePreviousPeriod}
              sx={{
                color: colors.neutral[300],
                '&:hover': {
                  backgroundColor: colors.neutral[800],
                  color: colors.primary[400],
                },
              }}
            >
              <ChevronLeft />
            </IconButton>
            <Typography
              sx={{
                minWidth: 140,
                textAlign: 'center',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: colors.neutral[200],
                px: 2,
              }}
            >
              {new Date(endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Typography>
            <IconButton
              size="small"
              onClick={handleNextPeriod}
              disabled={endDate >= new Date().toISOString().split('T')[0]}
              sx={{
                color: colors.neutral[300],
                '&:hover': {
                  backgroundColor: colors.neutral[800],
                  color: colors.primary[400],
                },
                '&:disabled': {
                  color: colors.neutral[600],
                },
              }}
            >
              <ChevronRight />
            </IconButton>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Today />}
              onClick={handleGoToToday}
              sx={{
                ml: 1,
                borderColor: colors.neutral[700],
                color: colors.neutral[300],
                '&:hover': {
                  borderColor: colors.neutral[600],
                  backgroundColor: colors.neutral[800],
                },
              }}
            >
              Today
            </Button>
          </Box>
          
          {/* Product Selector */}
          <FormControl 
            sx={{ 
              minWidth: 200,
              ml: 'auto',
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
          >
            <InputLabel id="product-select-label">Product (Optional)</InputLabel>
            <Select
              labelId="product-select-label"
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              label="Product (Optional)"
              disabled={loadingProducts}
            >
              <MenuItem value="">
                <em>All Products</em>
              </MenuItem>
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
          <Tab label="Reports Analytics" />
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
      ) : tabValue === 0 && selectedProductId && productAnalytics ? (
        <>
          {/* Product-specific analytics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Deliveries"
                value={productAnalytics.totalDeliveries}
                icon={<LocalShipping />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Total Amount"
                value={productAnalytics.totalAmount.toLocaleString()}
                icon={<CheckCircle />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Average Amount"
                value={productAnalytics.averageAmount.toFixed(1)}
                icon={<TrendingUp />}
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Best Group"
                value={productAnalytics.bestGroup?.groupName || 'N/A'}
                icon={<Inventory />}
                color="warning"
              />
            </Grid>
          </Grid>
          <Alert severity="info" sx={{ mb: 3 }}>
            Showing analytics for: <strong>{productAnalytics.product.name}</strong>
          </Alert>

          {/* Groups Performance */}
          {productAnalytics.groupsPerformance && productAnalytics.groupsPerformance.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 2 }}>
                Performance by Group
              </Typography>
              <Grid container spacing={2}>
                {productAnalytics.groupsPerformance.slice(0, 3).map((group: any, index: number) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: colors.neutral[900],
                        border: `1px solid ${index === 0 ? colors.warning[500] : colors.neutral[800]}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[100] }}>
                          {group.groupName}
                        </Typography>
                        {index === 0 && (
                          <Chip label="Best" size="small" sx={{ backgroundColor: colors.warning[500], color: colors.neutral[950], fontSize: '0.7rem', height: 20 }} />
                        )}
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                        {group.totalDeliveries} deliveries
                      </Typography>
                      <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.success[500] }}>
                        {group.totalAmount?.toLocaleString() || '0'} total
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Delivery History Table */}
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 2 }}>
            Delivery History
          </Typography>
          {productAnalytics.deliveries && productAnalytics.deliveries.length > 0 ? (
            <TableContainer component={Paper} sx={{ backgroundColor: colors.neutral[900], border: `1px solid ${colors.neutral[800]}` }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Worker</TableCell>
                    <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Group</TableCell>
                    <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }} align="right">Amount</TableCell>
                    <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Time</TableCell>
                    <TableCell sx={{ color: colors.neutral[300], fontWeight: 600 }}>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productAnalytics.deliveries.map((delivery: any) => (
                    <TableRow key={delivery.id} hover>
                      <TableCell sx={{ color: colors.neutral[100] }}>{delivery.worker_username || 'Unknown'}</TableCell>
                      <TableCell sx={{ color: colors.neutral[300] }}>{delivery.group_name || 'No Group'}</TableCell>
                      <TableCell align="right" sx={{ color: colors.success[500], fontWeight: 600 }}>
                        {delivery.amount?.toLocaleString() || '0'}
                      </TableCell>
                      <TableCell sx={{ color: colors.neutral[300] }}>
                        {delivery.delivery_date ? new Date(delivery.delivery_date).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: colors.primary[400], fontWeight: 500, fontFamily: 'monospace' }}>
                        {delivery.delivery_hour || 'N/A'}
                      </TableCell>
                      <TableCell sx={{ color: colors.neutral[400], maxWidth: 150 }}>
                        {delivery.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No delivery history available for this product.</Alert>
          )}
        </>
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

            {/* Groups Performance Chart */}
            <Grid item xs={12}>
              <Box
                sx={{
                  backgroundColor: colors.neutral[900],
                  border: `1px solid ${colors.neutral[800]}`,
                  borderRadius: 3,
                  p: 3,
                  mb: 3,
                }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 3 }}>
                  Groups Performance Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  {groupsData.length > 0 ? (
                    <BarChart data={groupsData.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[800]} />
                      <XAxis
                        dataKey="group_name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: colors.neutral[500], fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: colors.neutral[500], fontSize: 12 }}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: colors.neutral[800],
                          border: `1px solid ${colors.neutral[700]}`,
                          borderRadius: 8,
                        }}
                        labelStyle={{ color: colors.neutral[100], fontWeight: 500 }}
                        itemStyle={{ color: colors.neutral[300] }}
                      />
                      <Bar dataKey="total_amount" fill={colors.success[500]} radius={[4, 4, 0, 0]} name="Total Amount" />
                    </BarChart>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <Typography sx={{ color: colors.neutral[500], fontSize: '0.875rem' }}>
                        No group data available
                      </Typography>
                    </Box>
                  )}
                </ResponsiveContainer>
              </Box>
            </Grid>

            {/* Best Performing Groups */}
            <Grid item xs={12}>
              <Box
                sx={{
                  backgroundColor: colors.neutral[900],
                  border: `1px solid ${colors.neutral[800]}`,
                  borderRadius: 3,
                  p: 3,
                }}
              >
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 3 }}>
                  Best Performing Groups
                </Typography>
                {loadingGroups ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : groupsData.length > 0 ? (
                  <Grid container spacing={2}>
                    {groupsData.slice(0, 6).map((group, index) => (
                      <Grid item xs={12} sm={6} md={4} key={group.id}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: colors.neutral[950],
                            border: `1px solid ${index === 0 ? colors.warning[500] : colors.neutral[800]}`,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: index === 0 ? colors.warning[500] : colors.neutral[700],
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Box>
                              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.neutral[100], mb: 0.5 }}>
                                {group.group_name}
                              </Typography>
                              {index === 0 && (
                                <Chip 
                                  label="Top Performer" 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: colors.warning[500], 
                                    color: colors.neutral[950], 
                                    fontSize: '0.7rem', 
                                    height: 20,
                                    fontWeight: 600,
                                  }} 
                                />
                              )}
                            </Box>
                          </Box>
                          <Grid container spacing={1.5}>
                            <Grid item xs={6}>
                              <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                                Total Amount
                              </Typography>
                              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.success[500] }}>
                                {group.total_amount?.toLocaleString() || '0'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                                Deliveries
                              </Typography>
                              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.primary[500] }}>
                                {group.total_deliveries || 0}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                                Workers
                              </Typography>
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[300] }}>
                                {group.active_workers || 0}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                                Avg/Delivery
                              </Typography>
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.info[500] }}>
                                {typeof group.avg_delivery_amount === 'number' ? group.avg_delivery_amount.toFixed(0) : parseFloat(String(group.avg_delivery_amount || '0')).toFixed(0)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Box sx={{ mt: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mb: 0.5 }}>
                                  Efficiency: {group.efficiency_score?.toFixed(2) || '0'} deliveries/worker
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={groupsData.length > 0 && groupsData[0].efficiency_score > 0 
                                    ? (group.efficiency_score / groupsData[0].efficiency_score) * 100 
                                    : 0}
                                  sx={{
                                    height: 4,
                                    borderRadius: 1,
                                    backgroundColor: colors.neutral[800],
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: index === 0 ? colors.warning[500] : colors.info[500],
                                    },
                                  }}
                                />
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500], textAlign: 'center', py: 4 }}>
                    No group performance data available
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </>
      ) : tabValue === 1 && reportsData ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard
              title="Total Reports"
              value={reportsData.totalReports}
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
              {reportsData.reportsByGroup.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {reportsData.reportsByGroup.map((item, index) => (
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
                        value={reportsData.totalReports > 0 ? (item.count / reportsData.totalReports) * 100 : 0}
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
