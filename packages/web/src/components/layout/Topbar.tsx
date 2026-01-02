import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  IconButton,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  ListItemIcon,
  alpha,
  Tooltip,
  InputBase,
  Popover,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  Search,
  Logout,
  Person,
  Settings,
  HelpOutline,
  KeyboardCommandKey,
  CheckCircle,
  Info,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, TOPBAR_HEIGHT } from './Sidebar';
import { colors } from '../../theme';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

const Topbar: React.FC<TopbarProps> = ({ sidebarCollapsed }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleMenuClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    handleMenuClose();
  };

  useEffect(() => {
    if (!token) return;
    
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const response = await axios.get(ApiEndpoints.NOTIFICATIONS.UNREAD_COUNT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      setLoadingNotifications(true);
      const response = await axios.get(ApiEndpoints.NOTIFICATIONS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    try {
      await axios.put(
        ApiEndpoints.NOTIFICATIONS.MARK_READ(id),
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      await axios.put(
        ApiEndpoints.NOTIFICATIONS.MARK_ALL_READ,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
      case 'task_completed':
        return <CheckCircle sx={{ fontSize: 18, color: colors.success[500] }} />;
      case 'warning':
      case 'report_created':
        return <Warning sx={{ fontSize: 18, color: colors.warning[500] }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 18, color: colors.error[500] }} />;
      default:
        return <Info sx={{ fontSize: 18, color: colors.primary[500] }} />;
    }
  };

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
    return `${diffDays}d ago`;
  };

  const getUserInitials = () => {
    if ((user as any)?.username) {
      return (user as any).username.charAt(0).toUpperCase();
    }
    if ((user as any)?.email) {
      return (user as any).email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        right: 0,
        height: TOPBAR_HEIGHT,
        backgroundColor: colors.neutral[950],
        borderBottom: `1px solid ${colors.neutral[800]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        transition: 'left 0.2s ease',
        zIndex: 1100,
      }}
    >
      {/* Search */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: searchFocused ? colors.neutral[900] : colors.neutral[900],
          border: `1px solid ${searchFocused ? colors.neutral[700] : colors.neutral[800]}`,
          borderRadius: 2,
          px: 1.5,
          py: 0.75,
          width: 320,
          transition: 'all 0.15s ease',
        }}
      >
        <Search sx={{ fontSize: 18, color: colors.neutral[500], mr: 1 }} />
        <InputBase
          placeholder="Search..."
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          sx={{
            flex: 1,
            fontSize: '0.875rem',
            color: colors.neutral[100],
            '& ::placeholder': {
              color: colors.neutral[500],
              opacity: 1,
            },
          }}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: colors.neutral[600],
            fontSize: '0.75rem',
            ml: 1,
          }}
        >
          <KeyboardCommandKey sx={{ fontSize: 12 }} />
          <Typography sx={{ fontSize: '0.75rem' }}>K</Typography>
        </Box>
      </Box>

      {/* Right Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title="Help">
          <IconButton
            size="small"
            sx={{
              color: colors.neutral[400],
              '&:hover': { backgroundColor: alpha(colors.neutral[500], 0.08) },
            }}
          >
            <HelpOutline sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Notifications">
          <IconButton
            size="small"
            onClick={handleNotificationClick}
            sx={{
              color: colors.neutral[400],
              '&:hover': { backgroundColor: alpha(colors.neutral[500], 0.08) },
            }}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.625rem',
                  height: 16,
                  minWidth: 16,
                },
              }}
            >
              <Notifications sx={{ fontSize: 20 }} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Notifications Popover */}
        <Popover
          open={Boolean(notificationAnchorEl)}
          anchorEl={notificationAnchorEl}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              width: 380,
              maxHeight: 500,
              backgroundColor: colors.neutral[900],
              border: `1px solid ${colors.neutral[800]}`,
              borderRadius: 2,
              mt: 1,
            },
          }}
        >
          <Box sx={{ p: 2, borderBottom: `1px solid ${colors.neutral[800]}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.neutral[100] }}>
                Notifications
              </Typography>
              {unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllAsRead} sx={{ fontSize: '0.75rem' }}>
                  Mark all read
                </Button>
              )}
            </Box>
          </Box>
          {loadingNotifications ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.875rem', color: colors.neutral[500] }}>
                No notifications
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
              {notifications.slice(0, 10).map((notification) => (
                <ListItem
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id)}
                  sx={{
                    backgroundColor: notification.is_read === 0 ? alpha(colors.primary[500], 0.05) : 'transparent',
                    borderBottom: `1px solid ${colors.neutral[800]}`,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(colors.neutral[500], 0.08),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: notification.is_read === 0 ? 600 : 400, color: colors.neutral[100] }}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[400], mt: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: colors.neutral[600], mt: 0.5 }}>
                          {formatTimeAgo(notification.created_at)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Popover>

        <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: colors.neutral[800] }} />

        {/* User Menu */}
        <Box
          onClick={handleMenuOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            cursor: 'pointer',
            p: 0.75,
            borderRadius: 2,
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: alpha(colors.neutral[500], 0.08),
            },
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: colors.primary[600],
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            {getUserInitials()}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: colors.neutral[100],
                lineHeight: 1.2,
              }}
            >
              {(user as any)?.username || 'User'}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.75rem',
                color: colors.neutral[500],
                textTransform: 'capitalize',
                lineHeight: 1.2,
              }}
            >
              {user?.role}
            </Typography>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{
            sx: {
              minWidth: 200,
              mt: 1,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: colors.neutral[100] }}>
              {(user as any)?.username || 'User'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
              {(user as any)?.email}
            </Typography>
          </Box>
          <Divider sx={{ borderColor: colors.neutral[800] }} />
          <MenuItem onClick={handleProfile} sx={{ mt: 0.5 }}>
            <ListItemIcon>
              <Person sx={{ fontSize: 18 }} />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <Settings sx={{ fontSize: 18 }} />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider sx={{ borderColor: colors.neutral[800], my: 0.5 }} />
          <MenuItem onClick={handleLogout} sx={{ color: colors.error[500] }}>
            <ListItemIcon>
              <Logout sx={{ fontSize: 18, color: colors.error[500] }} />
            </ListItemIcon>
            Sign out
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;

