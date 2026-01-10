import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Collapse,
  Tooltip,
  alpha,
  IconButton,
} from '@mui/material';
import {
  Dashboard,
  People,
  Business,
  Analytics,
  Inventory,
  Description,
  VpnKey,
  Group,
  ExpandLess,
  ExpandMore,
  Settings,
  ChevronLeft,
  ChevronRight,
  Security,
} from '@mui/icons-material';
import { RootState } from '../../store';
import { colors } from '../../theme';
import { usePermissions } from '../../hooks/usePermissions';

// Layout Constants
export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
export const TOPBAR_HEIGHT = 56;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: NavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  open?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, open = true, onClose, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const { permissions, isAdmin, canView, canEdit } = usePermissions();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const getNavItems = (): NavItem[] => {
    if (!user) return [];

    const items: NavItem[] = [];
    
    // Dashboard - always visible
    if (isAdmin) {
      items.push({ label: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' });
    } else if (user.role === 'operator') {
      items.push({ label: 'Dashboard', icon: <Dashboard />, path: '/operator/dashboard' });
    } else if (user.role === 'leader') {
      items.push({ label: 'Dashboard', icon: <Dashboard />, path: '/leader/dashboard' });
    } else {
      items.push({ label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' });
    }

    // Users - show if can view users
    if (isAdmin || (permissions && canView('Users'))) {
      if (isAdmin) {
        items.push({ label: 'Users', icon: <People />, path: '/admin/users' });
      } else {
        items.push({ label: 'Users', icon: <People />, path: '/admin/users' });
      }
    }

    // Departments - show if can view departments
    if (isAdmin || (permissions && canView('Departments'))) {
      if (isAdmin) {
        items.push({ label: 'Departments', icon: <Business />, path: '/admin/departments' });
      } else {
        items.push({ label: 'Departments', icon: <Business />, path: '/admin/departments' });
      }
    }

    // Groups & Shifts - show if can view groups
    if (isAdmin || (permissions && canView('Groups'))) {
      if (isAdmin) {
        items.push({ label: 'Groups & Shifts', icon: <Group />, path: '/admin/groups' });
      } else {
        items.push({ label: 'Groups & Shifts', icon: <Group />, path: '/admin/groups' });
      }
    }

    // Products - route based on permissions
    // IMPORTANT: View-only users see different page than edit users
    if (isAdmin || (permissions && canView('Products'))) {
      // Users with EDIT permissions → Full management page with create/edit/delete
      if (isAdmin || (permissions && canEdit('Products'))) {
        items.push({ label: 'Products', icon: <Inventory />, path: '/admin/products' });
      } else {
        // Users with VIEW-ONLY permissions → View-only page (no create/edit/delete buttons)
        items.push({ label: 'Products', icon: <Inventory />, path: '/products' });
      }
    }

    // Reports - show if can view reports
    if (isAdmin || (permissions && canView('Reports'))) {
      if (isAdmin) {
        items.push({ label: 'Reports', icon: <Description />, path: '/admin/reports' });
      } else {
        items.push({ label: 'Reports', icon: <Description />, path: '/admin/reports' });
      }
    }

    // Analytics - show if can view analytics
    if (isAdmin || (permissions && canView('Analytics'))) {
      if (isAdmin) {
        items.push({ label: 'Analytics', icon: <Analytics />, path: '/admin/analytics' });
      } else {
        items.push({ label: 'Analytics', icon: <Analytics />, path: '/admin/analytics' });
      }
    }


    // Admin-only items
    if (isAdmin) {
      items.push({ label: 'Role Management', icon: <Security />, path: '/admin/roles' });
      items.push({ label: 'Reg. Codes', icon: <VpnKey />, path: '/admin/codes' });
    }

    return items;
  };

  const navItems = getNavItems();

  const handleToggleExpand = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);
    const active = isActive(item.path);

    const button = (
      <ListItemButton
        onClick={() => {
          if (hasChildren) {
            handleToggleExpand(item.label);
          } else {
            navigate(item.path);
            // Close sidebar on mobile after navigation
            if (isMobile && onClose) {
              onClose();
            }
          }
        }}
        sx={{
          minHeight: 44,
          px: 2,
          py: 1,
          mx: 1.5,
          mb: 0.5,
          borderRadius: 2,
          transition: 'all 0.15s ease',
          backgroundColor: active ? alpha(colors.primary[500], 0.12) : 'transparent',
          '&:hover': {
            backgroundColor: active 
              ? alpha(colors.primary[500], 0.16) 
              : alpha(colors.neutral[500], 0.08),
          },
          ...(collapsed && {
            justifyContent: 'center',
            px: 0,
            mx: 1,
          }),
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? 0 : 40,
            color: active ? colors.primary[400] : colors.neutral[400],
            justifyContent: 'center',
            '& .MuiSvgIcon-root': {
              fontSize: 20,
            },
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 400,
                color: active ? colors.neutral[50] : colors.neutral[300],
              }}
            />
            {hasChildren && (
              isExpanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />
            )}
          </>
        )}
      </ListItemButton>
    );

    return (
      <React.Fragment key={item.path}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          {collapsed ? (
            <Tooltip title={item.label} placement="right" arrow>
              {button}
            </Tooltip>
          ) : (
            button
          )}
        </ListItem>
        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List disablePadding>
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const getUserInitials = () => {
    if ((user as any)?.username) {
      return (user as any).username.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };
  
  const getUserDisplayName = () => {
    return (user as any)?.username ? `@${(user as any).username}` : (user?.email || 'User');
  };

  return (
    <Box
      sx={{
        width: {
          xs: isMobile ? SIDEBAR_WIDTH : 0,
          md: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        },
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        backgroundColor: colors.neutral[950],
        borderRight: `1px solid ${colors.neutral[800]}`,
        display: {
          xs: isMobile && open ? 'flex' : 'none',
          md: 'flex',
        },
        flexDirection: 'column',
        transition: 'width 0.2s ease, transform 0.2s ease',
        zIndex: 1200,
        transform: {
          xs: isMobile && open ? 'translateX(0)' : 'translateX(-100%)',
          md: 'translateX(0)',
        },
        overflowX: 'hidden',
      }}
    >
      {/* Logo Section */}
      <Box
        sx={{
          height: TOPBAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0 : 2.5,
          borderBottom: `1px solid ${colors.neutral[800]}`,
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>F</Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.neutral[50] }}>
              Factory
            </Typography>
          </Box>
        )}
        {collapsed && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>F</Typography>
          </Box>
        )}
        {!collapsed && (
          <IconButton
            onClick={onToggle}
            size="small"
            sx={{
              color: colors.neutral[400],
              '&:hover': { backgroundColor: alpha(colors.neutral[500], 0.08) },
            }}
          >
            <ChevronLeft sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        <List disablePadding>
          {navItems.map((item) => renderNavItem(item))}
        </List>
      </Box>

      {/* User Section */}
      <Box
        sx={{
          borderTop: `1px solid ${colors.neutral[800]}`,
          p: collapsed ? 1.5 : 2,
        }}
      >
        {collapsed ? (
          <Tooltip title={getUserDisplayName()} placement="right">
            <Avatar
              sx={{
                width: 36,
                height: 36,
                mx: 'auto',
                bgcolor: colors.primary[600],
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              {getUserInitials()}
            </Avatar>
          </Tooltip>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: colors.primary[600],
                fontSize: '0.875rem',
              }}
            >
              {getUserInitials()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: colors.neutral[100],
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {getUserDisplayName()}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.75rem',
                  color: colors.neutral[500],
                  textTransform: 'capitalize',
                }}
              >
                {user?.role}
              </Typography>
            </Box>
            <IconButton
              size="small"
              sx={{ color: colors.neutral[500] }}
              onClick={() => navigate('/profile')}
            >
              <Settings sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        )}
      </Box>

      {/* Collapse Button (when collapsed) */}
      {collapsed && (
        <Box sx={{ p: 1.5, borderTop: `1px solid ${colors.neutral[800]}` }}>
          <IconButton
            onClick={onToggle}
            size="small"
            sx={{
              width: '100%',
              color: colors.neutral[400],
              '&:hover': { backgroundColor: alpha(colors.neutral[500], 0.08) },
            }}
          >
            <ChevronRight sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;
