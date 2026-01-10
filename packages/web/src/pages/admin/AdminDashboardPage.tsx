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
  Business,
  TrendingUp,
  ArrowForward,
  MoreVert,
  Inventory,
  Description,
  Delete,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import PageContainer from '../../components/layout/PageContainer';
import { StatCard } from '../../components/ui';
import { colors } from '../../theme';
import { RootState } from '../../store';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';


interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  action?: string;
  username?: string;
  created_at?: string;
  user?: string;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepartments: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [clearingActivity, setClearingActivity] = useState(false);
  const [activityData, setActivityData] = useState<Array<{ name: string; tasks: number }>>([]);
  const [departmentData, setDepartmentData] = useState<Array<{ name: string; value: number; color: string }>>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [usersRes, deptsRes, activityRes] = await Promise.all([
          axios.get(ApiEndpoints.USERS.LIST, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })),
          axios.get(ApiEndpoints.DEPARTMENTS.LIST, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })),
          axios.get(ApiEndpoints.ACTIVITY_LOG.LIST, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })),
        ]);
        
        setStats({
          totalUsers: usersRes.data?.length || 0,
          totalDepartments: deptsRes.data?.length || 0,
          totalTasks: 0,
          completedTasks: 0,
        });
        setRecentActivity(activityRes.data || []);

        // Generate weekly activity data from activity log (last 7 days)
        const now = new Date();
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weeklyData = [];
        const activities = activityRes.data || [];
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          date.setHours(0, 0, 0, 0);
          
          const dayOfWeek = date.getDay();
          const dayName = weekDays[dayOfWeek];

          const dayActivities = activities.filter((activity: Activity) => {
            if (!activity.timestamp && !activity.created_at) return false;
            const activityDate = new Date(activity.timestamp || activity.created_at || '');
            activityDate.setHours(0, 0, 0, 0);
            return activityDate.getTime() === date.getTime();
          });

          weeklyData.push({
            name: dayName,
            tasks: dayActivities.length,
            completed: 0,
          });
        }

        setActivityData(weeklyData);

        // Generate department distribution from departments
        const departments = deptsRes.data || [];
        if (departments.length === 0) {
          setDepartmentData([
            { name: 'No Departments', value: 100, color: colors.neutral[600] },
          ]);
        } else {
          const deptColors = [
            colors.primary[500],
            colors.success[500],
            colors.warning[500],
            colors.info[500],
            colors.error[500],
          ];
          
          const total = departments.length;
          const deptArray = departments.map((dept: any, index: number) => ({
            name: dept.name || 'Unknown',
            value: Math.round((1 / total) * 100),
            color: deptColors[index % deptColors.length],
          }));

          setDepartmentData(deptArray);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  const handleClearActivity = async () => {
    if (!window.confirm('Are you sure you want to clear all recent activity? This action cannot be undone.')) {
      return;
    }

    try {
      setClearingActivity(true);
      await axios.delete(ApiEndpoints.ACTIVITY_LOG.CLEAR, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentActivity([]);
    } catch (error) {
      console.error('Error clearing activity:', error);
    } finally {
      setClearingActivity(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: <People />,
      path: '/admin/users',
      color: colors.primary[500],
    },
    {
      title: 'Departments',
      description: 'Organize departments',
      icon: <Business />,
      path: '/admin/departments',
      color: colors.success[500],
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

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Welcome back! Here's an overview of your factory operations."
    >
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
          {loading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              title="Departments"
              value={stats.totalDepartments}
              icon={<Business />}
              color="success"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          {loading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              title="Products"
              value={0}
              icon={<Inventory />}
              color="warning"
            />
          )}
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          {loading ? (
            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3 }} />
          ) : (
            <StatCard
              title="Reports"
              value={0}
              icon={<Description />}
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
                  Weekly Activity
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: colors.neutral[500], mt: 0.5 }}>
                  Activity this week
                </Typography>
              </Box>
              <Tooltip title="More options">
                <IconButton size="small" sx={{ color: colors.neutral[500] }}>
                  <MoreVert sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <ResponsiveContainer width="100%" height={280}>
              {activityData.length > 0 ? (
                <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary[500]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={colors.primary[500]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.neutral[800]} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: colors.neutral[500], fontSize: 12 }}
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
                />
                <Area
                  type="monotone"
                  dataKey="tasks"
                  stroke={colors.primary[500]}
                  fill="url(#colorTasks)"
                  strokeWidth={2}
                  name="Activity"
                />
              </AreaChart>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography sx={{ color: colors.neutral[500], fontSize: '0.875rem' }}>
                    No activity data available
                  </Typography>
                </Box>
              )}
            </ResponsiveContainer>
          </Box>
        </Grid>

        {/* Department Distribution */}
        <Grid item xs={12} lg={4}>
          <Box
            sx={{
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 3,
              p: 3,
              height: '100%',
            }}
          >
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100], mb: 3 }}>
              Task Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              {departmentData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography sx={{ color: colors.neutral[500], fontSize: '0.875rem' }}>
                    No department data available
                  </Typography>
                </Box>
              )}
            </ResponsiveContainer>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mt: 2 }}>
              {departmentData.map((item) => (
                <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[400] }}>
                    {item.name} ({item.value}%)
                  </Typography>
                </Box>
              ))}
            </Box>
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
                Recent Activity
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {recentActivity.length > 0 && (
                  <Button
                    size="small"
                    startIcon={clearingActivity ? <CircularProgress size={14} /> : <Delete sx={{ fontSize: 14 }} />}
                    onClick={handleClearActivity}
                    disabled={clearingActivity}
                    sx={{ fontSize: '0.8125rem', color: colors.error[500] }}
                  >
                    Clear
                  </Button>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentActivity.length === 0 ? (
                <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500], textAlign: 'center', py: 4 }}>
                  No recent activity
                </Typography>
              ) : (
                recentActivity.slice(0, 5).map((activity: Activity) => (
                  <Box
                    key={activity.id}
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
                          backgroundColor: colors.primary[500],
                        }}
                      />
                      <Box>
                        <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[100] }}>
                          {activity.action}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                          {activity.username || 'System'}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[600] }}>
                      {activity.created_at ? formatTimeAgo(activity.created_at) : 'Just now'}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default AdminDashboardPage;
