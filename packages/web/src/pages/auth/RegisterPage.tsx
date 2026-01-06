import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { ApiEndpoints } from '../../api/endpoints-override';
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
import { Lock, Visibility, VisibilityOff, Person, VpnKey } from '@mui/icons-material';
import { register, clearError } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { colors } from '../../theme';
import { UserRole } from '@factory-app/shared';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading, error, user } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    registrationCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [usernameStatus, setUsernameStatus] = useState<{ checking: boolean; available: boolean | null; message: string }>({
    checking: false,
    available: null,
    message: '',
  });
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Memoize redirect path calculation
  const redirectPath = useMemo(() => {
    if (!user?.role) return null;
    const userRole = user.role as string;
    
    if (userRole === UserRole.ADMIN || userRole === 'admin') return '/admin/dashboard';
    if (userRole === UserRole.OPERATOR || userRole === 'operator') return '/operator/dashboard';
    if (userRole === UserRole.LEADER || userRole === 'leader') return '/leader/dashboard';
    if (userRole === UserRole.WORKER || userRole === 'worker') return '/tasks';
    
    return '/';
  }, [user?.role]);

  useEffect(() => {
    if (isAuthenticated && redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, redirectPath, navigate]);

  // Real-time validation
  const validationError = useMemo(() => {
    if (!touched.password && !touched.confirmPassword) return null;
    
    if (touched.password && formData.password.length > 0 && formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    
    if (touched.confirmPassword && formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    return null;
  }, [formData.password, formData.confirmPassword, touched]);

  const isFormValid = useMemo(() => {
    return (
      formData.username.trim().length >= 3 &&
      usernameStatus.available === true &&
      !usernameStatus.checking &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword &&
      formData.registrationCode.trim().length > 0
    );
  }, [formData, usernameStatus]);

  // Check username availability
  const checkUsernameAvailability = useCallback(async (username: string) => {
    if (!username.trim() || username.trim().length < 3) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: 'Checking availability...' });

    try {
      const response = await axios.get(
        ApiEndpoints.AUTH.CHECK_USERNAME(username.trim())
      );
      setUsernameStatus({
        checking: false,
        available: response.data.available,
        message: response.data.message,
      });
    } catch (error: any) {
      setUsernameStatus({
        checking: false,
        available: false,
        message: error.response?.data?.message || 'Error checking username',
      });
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));

    // Check username availability with debounce
    if (name === 'username') {
      // Clear previous timeout
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }

      // Reset status if username is cleared
      if (!value.trim()) {
        setUsernameStatus({ checking: false, available: null, message: '' });
        return;
      }

      // Debounce username check (wait 500ms after user stops typing)
      usernameCheckTimeoutRef.current = setTimeout(() => {
        checkUsernameAvailability(value);
      }, 500);
    }
  }, [checkUsernameAvailability]);

  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      // Mark all fields as touched to show validation errors
      setTouched({
        username: true,
        password: true,
        confirmPassword: true,
        registrationCode: true,
      });
      return;
    }

    dispatch(
      register({
        username: formData.username.trim(),
        password: formData.password,
        registrationCode: formData.registrationCode.trim(),
      })
    );
  }, [formData, isFormValid, dispatch]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const getPasswordStrength = useMemo(() => {
    if (!formData.password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (formData.password.length >= 6) strength++;
    if (formData.password.length >= 8) strength++;
    if (/[A-Z]/.test(formData.password)) strength++;
    if (/[0-9]/.test(formData.password)) strength++;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength++;
    
    if (strength <= 2) return { strength, label: 'Weak', color: colors.error[500] };
    if (strength <= 3) return { strength, label: 'Fair', color: colors.warning[500] };
    if (strength <= 4) return { strength, label: 'Good', color: colors.info[500] };
    return { strength, label: 'Strong', color: colors.success[500] };
  }, [formData.password]);

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
          background: `linear-gradient(135deg, ${colors.success[600]} 0%, ${colors.primary[700]} 50%, ${colors.neutral[900]} 100%)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '200%',
            height: '200%',
            top: '-50%',
            left: '-50%',
            background: `radial-gradient(circle at 30% 70%, ${alpha(colors.success[500], 0.15)} 0%, transparent 50%)`,
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
            Join Factory MES
          </Typography>
            <Typography
            sx={{
              color: alpha('#fff', 0.8),
              fontSize: '1.125rem',
              lineHeight: 1.7,
            }}
          >
            Create your account and start managing your manufacturing operations
            with our powerful enterprise platform.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              mt: 6,
              textAlign: 'left',
            }}
          >
            {[
              'Real-time task tracking and management',
              'Department and team organization',
              'Comprehensive analytics and reporting',
              'Secure role-based access control',
            ].map((feature) => (
              <Box key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                    }}
                  />
                </Box>
                <Typography sx={{ color: alpha('#fff', 0.9), fontSize: '0.9375rem' }}>
                  {feature}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right Panel - Register Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
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
            Create account
          </Typography>
          <Typography
            sx={{
              color: colors.neutral[400],
              mb: 4,
              fontSize: '0.9375rem',
            }}
          >
            Enter your details to get started
          </Typography>

          {(error || (validationError && Object.keys(touched).length > 0)) && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => {
                dispatch(clearError());
                setTouched({});
              }}
            >
              {validationError || (typeof error === 'string' ? error : ((error as any)?.message || (error as any)?.error || 'An error occurred'))}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onBlur={() => {
                handleBlur('username');
                if (formData.username.trim().length >= 3) {
                  checkUsernameAvailability(formData.username);
                }
              }}
              required
              autoFocus
              error={
                (touched.username && !formData.username.trim()) ||
                (touched.username && formData.username.trim().length > 0 && usernameStatus.available === false)
              }
              helperText={
                touched.username
                  ? formData.username.trim().length === 0
                    ? 'Username is required'
                    : formData.username.trim().length < 3
                    ? 'Username must be at least 3 characters'
                    : usernameStatus.checking
                    ? 'Checking availability...'
                    : usernameStatus.available === false
                    ? usernameStatus.message || 'Username already taken'
                    : usernameStatus.available === true
                    ? '✓ Username is available'
                    : ''
                  : 'Username must be at least 3 characters'
              }
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
              onBlur={() => handleBlur('password')}
              required
              error={touched.password && (formData.password.length > 0 && formData.password.length < 6)}
              helperText={
                touched.password && formData.password.length > 0 && formData.password.length < 6
                  ? 'Password must be at least 6 characters'
                  : formData.password && touched.password
                  ? `Password strength: ${getPasswordStrength.label}`
                  : ''
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ fontSize: 20, color: colors.neutral[500] }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={togglePasswordVisibility}
                      edge="end"
                      size="small"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              sx={{ mb: 2 }}
            />
            {formData.password && touched.password && (
              <Box sx={{ mb: 2, mt: -1 }}>
                <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Box
                      key={level}
                      sx={{
                        flex: 1,
                        height: 4,
                        borderRadius: 1,
                        backgroundColor:
                          level <= getPasswordStrength.strength
                            ? getPasswordStrength.color
                            : colors.neutral[800],
                        transition: 'background-color 0.2s',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => handleBlur('confirmPassword')}
              required
              error={
                touched.confirmPassword &&
                formData.confirmPassword.length > 0 &&
                formData.password !== formData.confirmPassword
              }
              helperText={
                touched.confirmPassword &&
                formData.confirmPassword.length > 0 &&
                formData.password !== formData.confirmPassword
                  ? 'Passwords do not match'
                  : touched.confirmPassword &&
                    formData.confirmPassword.length > 0 &&
                    formData.password === formData.confirmPassword
                  ? 'Passwords match'
                  : ''
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ fontSize: 20, color: colors.neutral[500] }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Registration Code"
              name="registrationCode"
              value={formData.registrationCode}
              onChange={handleChange}
              onBlur={() => handleBlur('registrationCode')}
              required
              error={touched.registrationCode && !formData.registrationCode.trim()}
              helperText={
                touched.registrationCode && !formData.registrationCode.trim()
                  ? 'Registration code is required'
                  : 'Enter the code provided by your administrator'
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKey sx={{ fontSize: 20, color: colors.neutral[500] }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !isFormValid}
              sx={{
                py: 1.5,
                fontSize: '0.9375rem',
                fontWeight: 600,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
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
            Already have an account?{' '}
            <Typography
              component={RouterLink}
              to="/login"
              sx={{
                color: colors.primary[400],
                fontWeight: 500,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Sign in
            </Typography>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;
