import React from 'react';
import { Box, Typography, Breadcrumbs, Link, alpha } from '@mui/material';
import { NavigateNext, Home } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import { colors } from '../../theme';

interface PageContainerProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; path?: string }>;
  actions?: React.ReactNode;
  fullWidth?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  actions,
  fullWidth = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const autoBreadcrumbs = React.useMemo(() => {
    if (breadcrumbs) return breadcrumbs;
    
    const pathParts = location.pathname.split('/').filter(Boolean);
    const crumbs = pathParts.map((part, index) => {
      const path = '/' + pathParts.slice(0, index + 1).join('/');
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      return { label, path };
    });
    
    return [{ label: 'Home', path: '/' }, ...crumbs];
  }, [location.pathname, breadcrumbs]);

  return (
    <MainLayout>
      <Box
        sx={{
          minHeight: '100%',
          backgroundColor: colors.neutral[950],
        }}
      >
        {/* Page Header */}
        {(title || breadcrumbs || actions) && (
          <Box
            sx={{
              borderBottom: `1px solid ${colors.neutral[800]}`,
              backgroundColor: colors.neutral[950],
              position: 'sticky',
              top: 56,
              zIndex: 10,
            }}
          >
            <Box
              sx={{
                maxWidth: fullWidth ? 'none' : 1400,
                mx: 'auto',
                px: 4,
                py: 2.5,
              }}
            >
              {/* Breadcrumbs */}
              {autoBreadcrumbs.length > 0 && (
                <Breadcrumbs
                  separator={<NavigateNext sx={{ fontSize: 16, color: colors.neutral[600] }} />}
                  sx={{ mb: 1.5 }}
                >
                  {autoBreadcrumbs.map((crumb, index) => {
                    const isLast = index === autoBreadcrumbs.length - 1;
                    const isFirst = index === 0;
                    
                    if (isLast) {
                      return (
                        <Typography
                          key={crumb.label}
                          sx={{
                            fontSize: '0.8125rem',
                            color: colors.neutral[300],
                            fontWeight: 500,
                          }}
                        >
                          {crumb.label}
                        </Typography>
                      );
                    }
                    
                    return (
                      <Link
                        key={crumb.label}
                        component="button"
                        onClick={() => crumb.path && navigate(crumb.path)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          fontSize: '0.8125rem',
                          color: colors.neutral[500],
                          textDecoration: 'none',
                          transition: 'color 0.15s ease',
                          '&:hover': {
                            color: colors.neutral[300],
                          },
                        }}
                      >
                        {isFirst && <Home sx={{ fontSize: 16 }} />}
                        {!isFirst && crumb.label}
                      </Link>
                    );
                  })}
                </Breadcrumbs>
              )}
              
              {/* Title & Actions */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 3,
                }}
              >
                <Box>
                  {title && (
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: colors.neutral[50],
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {title}
                    </Typography>
                  )}
                  {subtitle && (
                    <Typography
                      sx={{
                        fontSize: '0.9375rem',
                        color: colors.neutral[400],
                        mt: 0.5,
                      }}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </Box>
                {actions && (
                  <Box sx={{ display: 'flex', gap: 1.5, flexShrink: 0 }}>
                    {actions}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}

        {/* Page Content */}
        <Box
          sx={{
            maxWidth: fullWidth ? 'none' : 1400,
            mx: 'auto',
            px: 4,
            py: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default PageContainer;
