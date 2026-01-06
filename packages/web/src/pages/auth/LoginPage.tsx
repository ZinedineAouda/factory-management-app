import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  alpha,
} from '@mui/material';
import { Person, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { login, clearError } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { colors } from '../../theme';
import { UserRole } from '@factory-app/shared';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading, error, user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    // Only redirect if not loading and authenticated
    if (!loading && isAuthenticated && user && user.role) {
      // Normalize role to handle both enum and string values
      const userRole = user.role as string;
      
      let redirectPath = '/';
      
      // Check against both enum values and string values for robustness
      if (userRole === UserRole.ADMIN || userRole === 'admin') {
        redirectPath = '/admin/dashboard';
      } else if (userRole === UserRole.OPERATOR || userRole === 'operator') {
        redirectPath = '/operator/dashboard';
      } else if (userRole === UserRole.LEADER || userRole === 'leader') {
        redirectPath = '/leader/dashboard';
      } else if (userRole === UserRole.WORKER || userRole === 'worker') {
        redirectPath = '/tasks';
      } else {
        // Fallback: redirect to root which will handle the redirect
        redirectPath = '/';
        console.warn('Unknown user role:', userRole, 'Redirecting to root');
      }
      
      // Small delay to ensure state is fully updated
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 100);
    }
  }, [isAuthenticated, user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: colors.neutral[950],
      }}
    >
      {/* Left Panel - Branding */}
      <Box
        sx={{
          width: '50%',
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 6,
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 50%, ${colors.neutral[900]} 100%)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: `radial-gradient(circle at 30% 70%, ${alpha(colors.primary[400], 0.15)} 0%, transparent 50%)`,
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 480, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 4,
            }}
          >
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '2rem' }}>F</Typography>
          </Box>
          <Typography
            variant="h2"
            sx={{
              color: '#fff',
              fontWeight: 700,
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            Factory MES
          </Typography>
          <Typography
            sx={{
              color: alpha('#fff', 0.8),
              fontSize: '1.125rem',
              lineHeight: 1.7,
            }}
          >
            Streamline your manufacturing operations with our modern enterprise platform.
            Track tasks, manage departments, and boost productivity.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 4,
              justifyContent: 'center',
              mt: 6,
            }}
          >
            {[
              { value: '99.9%', label: 'Uptime' },
              { value: '50k+', label: 'Tasks' },
              { value: '24/7', label: 'Support' },
            ].map((stat) => (
              <Box key={stat.label} sx={{ textAlign: 'center' }}>
                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem' }}>
                  {stat.value}
                </Typography>
                <Typography sx={{ color: alpha('#fff', 0.6), fontSize: '0.875rem' }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right Panel - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 4 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', sm: 400 } }}>
          {/* Mobile Logo */}
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              alignItems: 'center',
              gap: 2,
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>F</Typography>
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: colors.neutral[50] }}>
              Factory MES
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.neutral[50],
              mb: 1,
            }}
          >
            Welcome back
          </Typography>
          <Typography
            sx={{
              color: colors.neutral[400],
              mb: 4,
              fontSize: '0.9375rem',
            }}
          >
            Sign in to your account to continue
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                '& .MuiAlert-message': {
                  width: '100%',
                },
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                  {(() => {
                    if (typeof error === 'string') {
                      // Check for specific error messages
                      if (error.includes('Account not found') || error.includes('does not exist')) {
                        return 'Account Not Found';
                      }
                      if (error.includes('Incorrect password') || error.includes('password') && error.includes('incorrect')) {
                        return 'Incorrect Password';
                      }
                      if (error.includes('pending approval')) {
                        return 'Account Pending Approval';
                      }
                      return 'Login Failed';
                    }
                    const errorObj = error as any;
                    if (errorObj?.errorCode === 'ACCOUNT_NOT_FOUND' || errorObj?.message?.includes('does not exist')) {
                      return 'Account Not Found';
                    }
                    if (errorObj?.errorCode === 'INVALID_PASSWORD' || errorObj?.message?.includes('password')) {
                      return 'Incorrect Password';
                    }
                    if (errorObj?.errorCode === 'ACCOUNT_PENDING' || errorObj?.message?.includes('pending')) {
                      return 'Account Pending Approval';
                    }
                    return errorObj?.message || errorObj?.error || 'Login Failed';
                  })()}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: 'inherit', opacity: 0.9 }}>
                  {(() => {
                    if (typeof error === 'string') {
                      if (error.includes('Account not found') || error.includes('does not exist')) {
                        return 'The username you entered does not exist. Please check your username and try again.';
                      }
                      if (error.includes('Incorrect password') || error.includes('password') && error.includes('incorrect')) {
                        return 'The password you entered is incorrect. Please check your password and try again.';
                      }
                      if (error.includes('pending approval')) {
                        return 'Your account is waiting for administrator approval. Please contact your administrator.';
                      }
                      return error;
                    }
                    const errorObj = error as any;
                    return errorObj?.message || errorObj?.error || 'An unexpected error occurred. Please try again.';
                  })()}
                </Typography>
              </Box>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ fontSize: 20, color: colors.neutral[500] }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ fontSize: 20, color: colors.neutral[500] }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: 20 }} />
                      ) : (
                        <Visibility sx={{ fontSize: 20 }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Typography
                component={RouterLink}
                to="/forgot-password"
                sx={{
                  fontSize: '0.875rem',
                  color: colors.primary[400],
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Forgot password?
              </Typography>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '0.9375rem',
                fontWeight: 600,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in'}
            </Button>
          </form>

          <Typography
            sx={{
              mt: 4,
              textAlign: 'center',
              fontSize: '0.875rem',
              color: colors.neutral[400],
            }}
          >
            Don't have an account?{' '}
            <Typography
              component={RouterLink}
              to="/register"
              sx={{
                color: colors.primary[400],
                fontWeight: 500,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Create account
            </Typography>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
