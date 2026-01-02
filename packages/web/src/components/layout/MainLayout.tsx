import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, TOPBAR_HEIGHT } from './Sidebar';
import Topbar from './Topbar';
import { colors } from '../../theme';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.neutral[950] }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <Topbar sidebarCollapsed={sidebarCollapsed} />
      
      <Box
        component="main"
        sx={{
          marginLeft: sidebarCollapsed ? `${SIDEBAR_COLLAPSED_WIDTH}px` : `${SIDEBAR_WIDTH}px`,
          marginTop: `${TOPBAR_HEIGHT}px`,
          minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          backgroundColor: colors.neutral[950],
          transition: 'margin-left 0.2s ease',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
