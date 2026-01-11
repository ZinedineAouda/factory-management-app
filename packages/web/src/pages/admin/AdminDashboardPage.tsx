import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Grid,
  alpha,
  Skeleton,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  People,
  TrendingUp,
  ArrowForward,
  MoreVert,
  Inventory,
  AccessTime,
  CalendarToday,
  LocalShipping,
  Refresh,
  ChevronLeft,
  ChevronRight,
  Today,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
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
import { RootState } from '../../store';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';


interface Delivery {
  id: string;
  product_id: string;
  product_name?: string;
  worker_id: string;
  worker_username?: string;
  group_name?: string;
  amount: number;
  delivery_date: string;
  delivery_hour?: string;
  notes?: string | null;
  created_at: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

interface ProductionAnalytics {
  totalDeliveries: number;
  totalAmount: number;
  deliveriesByProduct: Array<{ productName: string; deliveryCount: number; totalAmount: number }>;
  deliveriesByWorker: Array<{ workerName: string; deliveryCount: number; totalAmount: number }>;
  deliveriesByDate: Array<{ date: string; amount: number }>;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
  });
  const [recentDeliveries, setRecentDeliveries] = useState<Delivery[]>([]);
  const [groupsData, setGroupsData] = useState<any[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [productionAnalytics, setProductionAnalytics] = useState<ProductionAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Date range state - default to last 30 days (same as analytics page)
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

  // Update date and time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch analytics in parallel with other stats
  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      
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
      
      const groupsParams = new URLSearchParams();
      if (startDate) {
        groupsParams.append('startDate', startDate);
      }
      if (endDate) {
        groupsParams.append('endDate', endDate);
      }
      const groupsQueryString = groupsParams.toString();
      const groupsUrl = groupsQueryString ? `${ApiEndpoints.ANALYTICS.GROUPS}?${groupsQueryString}` : ApiEndpoints.ANALYTICS.GROUPS;
      
      const [productionResponse, groupsResponse] = await Promise.all([
        axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: {} })),
        axios.get(groupsUrl, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { groups: [] } })),
      ]);
      
      const data = productionResponse.data || {};
      setProductionAnalytics({
        totalDeliveries: data.totalDeliveries || 0,
        totalAmount: data.totalAmount || 0,
        deliveriesByProduct: data.deliveriesByProduct || [],
        deliveriesByWorker: data.deliveriesByWorker || [],
        deliveriesByDate: data.deliveriesByDate || [],
      });

      // Set groups data for charts
      setGroupsData(groupsResponse.data?.groups || []);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setProductionAnalytics({
        totalDeliveries: 0,
        totalAmount: 0,
        deliveriesByProduct: [],
        deliveriesByWorker: [],
        deliveriesByDate: [],
      });
      setGroupsData([]);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [usersRes, deliveriesRes] = await Promise.all([
          axios.get(ApiEndpoints.USERS.LIST, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })),
          axios.get(ApiEndpoints.PRODUCT_DELIVERIES.LIST, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })),
        ]);
        
        setStats({
          totalUsers: usersRes.data?.length || 0,
        });
        // Sort deliveries by created_at descending and take the most recent
        const deliveries = deliveriesRes.data || [];
        deliveries.sort((a: Delivery, b: Delivery) => {
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        setRecentDeliveries(deliveries);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();
      fetchAnalytics(); // Fetch analytics in parallel
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, startDate, endDate, period]);


  const quickActions: QuickAction[] = [
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: <People />,
      path: '/admin/users',
      color: colors.primary[500],
    },
    {
      title: 'Analytics',
      description: 'View production metrics',
      icon: <TrendingUp />,
      path: '/admin/analytics',
      color: colors.warning[500],
    },
    {
      title: 'Products',
      description: 'Manage inventory',
      icon: <Inventory />,
      path: '/admin/products',
      color: colors.info[500],
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Welcome back! Here's an overview of your factory operations."
    >
      {/* Date and Time Display */}
      <Box
        sx={{
          mb: 3,
          p: 2.5,
          backgroundColor: colors.neutral[900],
          border: `1px solid ${colors.neutral[800]}`,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flex: 1,
            minWidth: { xs: '100%', sm: 'auto' },
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: alpha(colors.primary[500], 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary[500],
            }}
          >
            <CalendarToday sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: '0.875rem',
                color: colors.neutral[400],
                fontWeight: 500,
                mb: 0.25,
              }}
            >
              {formatDate(currentDateTime)}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: colors.neutral[500],
              }}
            >
              Current Date
            </Typography>
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flex: 1,
            minWidth: { xs: '100%', sm: 'auto' },
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: alpha(colors.success[500], 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.success[500],
            }}
          >
            <AccessTime sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: '1.125rem',
                color: colors.neutral[100],
                fontWeight: 600,
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                mb: 0.25,
              }}
            >
              {formatTime(currentDateTime)}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: colors.neutral[500],
              }}
            >
              Current Time
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Analytics Date Range Picker */}
      <Box
        sx={{
          mb: 3,
          p: 2,
          backgroundColor: colors.neutral[900],
          border: `1px solid ${colors.neutral[800]}`,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
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
        <Button
          variant="outlined"
          size="small"
          startIcon={loadingAnalytics ? <CircularProgress size={16} /> : <Refresh />}
          onClick={fetchAnalytics}
          disabled={loadingAnalytics}
          sx={{
            borderColor: colors.primary[700],
            color: colors.primary[300],
            '&:hover': {
              borderColor: colors.primary[600],
              backgroundColor: alpha(colors.primary[500], 0.1),
            },
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          {loading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<People />}
              change={{ value: 12, label: 'vs last month', positive: true }}
              color="primary"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          {loadingAnalytics ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              title="Total Deliveries"
              value={productionAnalytics?.totalDeliveries || 0}
              icon={<LocalShipping />}
              color="warning"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          {loadingAnalytics ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              title="Total Amount"
              value={productionAnalytics?.totalAmount?.toLocaleString() || '0'}
              icon={<TrendingUp />}
              color="info"
            />
          )}
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Activity Chart */}
        <Grid item xs={12} lg={8}>
          <Box
            sx={{
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100] }}>
                  Weekly Deliveries Trend
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: colors.neutral[500], mt: 0.5 }}>
                  Delivery amounts (last 7 days)
                </Typography>
              </Box>
              <Tooltip title="More options">
                <IconButton size="small" sx={{ color: colors.neutral[500] }}>
                  <MoreVert sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height={280}>
              {productionAnalytics?.deliveriesByDate && productionAnalytics.deliveriesByDate.length > 0 ? (
                <AreaChart data={productionAnalytics.deliveriesByDate.slice(-7)}>
                <defs>
                  <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary[500]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.primary[500]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[800]} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.neutral[500], fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  }}
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
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                  labelStyle={{ color: colors.neutral[100], fontWeight: 500 }}
                  itemStyle={{ color: colors.neutral[300] }}
                  formatter={(value: any) => [value?.toLocaleString() || value, 'Total Amount']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={colors.primary[500]}
                  fill="url(#colorDeliveries)"
                  strokeWidth={2}
                  name="Deliveries"
                />
              </AreaChart>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography sx={{ color: colors.neutral[500], fontSize: '0.875rem' }}>
                    No delivery data available
                  </Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Groups Comparison Chart */}
        <Grid item xs={12} lg={4}>
          <Box
            sx={{
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
              p: 3,
            }}
          >
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 3 }}>
              Top Groups Performance
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              {groupsData.length > 0 ? (
                <BarChart data={groupsData.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[800]} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: colors.neutral[500], fontSize: 12 }} />
                  <YAxis 
                    type="category" 
                    dataKey="group_name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: colors.neutral[500], fontSize: 11 }}
                    width={80}
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
                  <Bar dataKey="total_amount" fill={colors.success[500]} radius={[0, 4, 4, 0]} name="Total Amount" />
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
      </Grid>

      {/* Quick Actions & Activity */}
      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} lg={6}>
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
                <Grid item xs={6} key={action.title}>
                  <Box
                    onClick={() => navigate(action.path)}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: `1px solid ${colors.neutral[800]}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: action.color,
                        backgroundColor: alpha(action.color, 0.04),
                        '& .action-icon': {
                          transform: 'scale(1.1)',
                        },
                        '& .action-arrow': {
                          opacity: 1,
                          transform: 'translateX(0)',
                        },
                      },
                    }}
                  >
                    <Box
                      className="action-icon"
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        backgroundColor: alpha(action.color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: action.color,
                        mb: 1.5,
                        transition: 'transform 0.2s ease',
                        '& .MuiSvgIcon-root': { fontSize: 20 },
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.neutral[100] }}>
                          {action.title}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500], mt: 0.25 }}>
                          {action.description}
                        </Typography>
                      </Box>
                      <ArrowForward
                        className="action-arrow"
                        sx={{
                          fontSize: 16,
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
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Box
            sx={{
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100] }}>
                Recent Deliveries
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentDeliveries.length === 0 ? (
                <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500], textAlign: 'center', py: 4 }}>
                  No deliveries yet
                </Typography>
              ) : (
                recentDeliveries.slice(0, 5).map((delivery: Delivery) => {
                  const formatTimeAgo = (dateString: string) => {
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins}m ago`;
                    if (diffHours < 24) return `${diffHours}h ago`;
                    if (diffDays < 7) return `${diffDays}d ago`;
                    return date.toLocaleDateString();
                  };

                  return (
                    <Box
                      key={delivery.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: colors.neutral[950],
                        border: `1px solid ${colors.neutral[800]}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: colors.success[500],
                          }}
                        />
                        <Box>
                          <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[100] }}>
                            {delivery.product_name || 'Unknown Product'} - {delivery.amount.toLocaleString()} units
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                            {delivery.worker_username || 'Unknown'} {delivery.group_name ? `(${delivery.group_name})` : ''}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[600] }}>
                        {formatTimeAgo(delivery.created_at)}
                      </Typography>
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default AdminDashboardPage;
