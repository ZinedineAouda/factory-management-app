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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleCloseSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.neutral[950] }}>
      <Sidebar 
        collapsed={isMobile ? false : sidebarCollapsed} 
        onToggle={handleToggleSidebar}
        open={isMobile ? sidebarOpen : true}
        onClose={handleCloseSidebar}
        isMobile={isMobile}
      />
      {isMobile && sidebarOpen && (
        <Box
          onClick={handleCloseSidebar}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1199,
          }}
        />
      )}
      <Topbar 
        sidebarCollapsed={isMobile ? false : sidebarCollapsed}
        onMenuClick={isMobile ? handleToggleSidebar : undefined}
      />
      
      <Box
        component="main"
        sx={{
          marginLeft: {
            xs: 0,
            md: sidebarCollapsed ? `${SIDEBAR_COLLAPSED_WIDTH}px` : `${SIDEBAR_WIDTH}px`,
          },
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
