import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress } from '@mui/material';
import { UserRole } from '@factory-app/shared';
import { colors } from '../theme';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import WorkerDashboardPage from '../pages/worker/WorkerDashboardPage';
import ProfilePage from '../pages/worker/ProfilePage';
import OperatorDashboardPage from '../pages/operator/OperatorDashboardPage';
import ReportCreatePage from '../pages/operator/ReportCreatePage';
import LeaderDashboardPage from '../pages/leader/LeaderDashboardPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import CodeGenerationPage from '../pages/admin/CodeGenerationPage';
import DepartmentManagementPage from '../pages/admin/DepartmentManagementPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import AnalyticsPage from '../pages/admin/AnalyticsPage';
import ReportsPage from '../pages/admin/ReportsPage';
import ReportDetailPage from '../pages/admin/ReportDetailPage';
import ProductsPage from '../pages/admin/ProductsPage';
import ProductViewPage from '../pages/worker/ProductViewPage';
import ProductDeliveryPage from '../pages/worker/ProductDeliveryPage';
import GroupsAndShiftsPage from '../pages/admin/GroupsAndShiftsPage';
import RoleManagementPage from '../pages/admin/RoleManagementPage';
import SettingsPage from '../pages/admin/SettingsPage';
import ProtectedRoute from './ProtectedRoute';
import { RootState } from '../store';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.neutral[950],
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
      />

      {/* Root route - redirect based on auth state */}
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <Navigate to="/login" replace />
          ) : (
            <ProtectedRoute allowedRoles={[UserRole.WORKER, UserRole.ADMIN, UserRole.OPERATOR, UserRole.LEADER]}>
              {(() => {
                // Normalize role for comparison
                const userRole = user?.role as string;
                
                if (!userRole) {
                  return <Navigate to="/login" replace />;
                }
                
                if (userRole === UserRole.ADMIN || userRole === 'admin') {
                  return <Navigate to="/admin/dashboard" replace />;
                }
                if (userRole === UserRole.OPERATOR || userRole === 'operator') {
                  return <Navigate to="/operator/dashboard" replace />;
                }
                if (userRole === UserRole.LEADER || userRole === 'leader') {
                  return <Navigate to="/leader/dashboard" replace />;
                }
                
                // Default to dashboard for worker or unknown roles
                return <Navigate to="/dashboard" replace />;
              })()}
            </ProtectedRoute>
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.WORKER]}>
            <WorkerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={[UserRole.WORKER, UserRole.ADMIN, UserRole.OPERATOR]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute allowedRoles={[UserRole.WORKER, UserRole.ADMIN, UserRole.OPERATOR, UserRole.LEADER]}>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Operator Routes */}
      <Route
        path="/operator/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.OPERATOR]}>
            <OperatorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/reports/create"
        element={
          <ProtectedRoute requiredPermission={{ edit: 'Reports' }}>
            <ReportCreatePage />
          </ProtectedRoute>
        }
      />

      {/* Leader Routes */}
      <Route
        path="/leader/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.LEADER]}>
            <LeaderDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes - Now accessible to all users with proper permissions */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute requiredPermission={{ view: 'Departments' }}>
            <DepartmentManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/codes"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <CodeGenerationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredPermission={{ view: 'Users' }}>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute requiredPermission={{ view: 'Analytics' }}>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute requiredPermission={{ view: 'Reports' }}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports/:id"
        element={
          <ProtectedRoute requiredPermission={{ view: 'Reports' }}>
            <ReportDetailPage />
          </ProtectedRoute>
        }
      />
      {/* Products Management Page - ONLY for users with EDIT permissions */}
      {/* Features: Create, Edit, Delete products */}
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute requiredPermission={{ edit: 'Products' }}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      {/* Products View Page - ONLY for users with VIEW-ONLY permissions */}
      {/* Features: View products, Enter delivery amounts (NO create/edit/delete) */}
      <Route
        path="/products"
        element={
          <ProtectedRoute requiredPermission={{ view: 'Products' }}>
            <ProductViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/delivery"
        element={
          <ProtectedRoute requiredPermission={{ view: 'Products' }}>
            <ProductDeliveryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/groups"
        element={
          <ProtectedRoute requiredPermission={{ view: 'Groups' }}>
            <GroupsAndShiftsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <RoleManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Catch all - show helpful 404 message instead of redirect */}
      <Route
        path="*"
        element={
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
            <button onClick={() => window.location.href = '/'}>Go to Home</button>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;


