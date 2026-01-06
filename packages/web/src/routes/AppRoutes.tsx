import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { UserRole } from '@factory-app/shared';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import TaskListPage from '../pages/worker/TaskListPage';
import TaskDetailPage from '../pages/worker/TaskDetailPage';
import WorkerDashboardPage from '../pages/worker/WorkerDashboardPage';
import ProfilePage from '../pages/worker/ProfilePage';
import OperatorDashboardPage from '../pages/operator/OperatorDashboardPage';
import OperatorTaskListPage from '../pages/operator/OperatorTaskListPage';
import OperatorTaskDetailPage from '../pages/operator/OperatorTaskDetailPage';
import OperatorTaskCreatePage from '../pages/operator/OperatorTaskCreatePage';
import OperatorReportPage from '../pages/operator/OperatorReportPage';
import LeaderDashboardPage from '../pages/leader/LeaderDashboardPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import TaskManagementPage from '../pages/admin/TaskManagementPage';
import TaskCreatePage from '../pages/admin/TaskCreatePage';
import CodeGenerationPage from '../pages/admin/CodeGenerationPage';
import DepartmentManagementPage from '../pages/admin/DepartmentManagementPage';
import UserManagementPage from '../pages/admin/UserManagementPage';
import AnalyticsPage from '../pages/admin/AnalyticsPage';
import ReportsPage from '../pages/admin/ReportsPage';
import ProductsPage from '../pages/admin/ProductsPage';
import GroupsAndShiftsPage from '../pages/admin/GroupsAndShiftsPage';
import RoleManagementPage from '../pages/admin/RoleManagementPage';
import SettingsPage from '../pages/admin/SettingsPage';
import ProtectedRoute from './ProtectedRoute';
import { RootState } from '../store';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

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
                
                // Default to tasks for worker or unknown roles
                return <Navigate to="/tasks" replace />;
              })()}
            </ProtectedRoute>
          )
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute allowedRoles={[UserRole.WORKER, UserRole.LEADER]}>
            <TaskListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:taskId"
        element={
          <ProtectedRoute allowedRoles={[UserRole.WORKER]}>
            <TaskDetailPage />
          </ProtectedRoute>
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
        path="/operator/tasks"
        element={
          <ProtectedRoute allowedRoles={[UserRole.OPERATOR]}>
            <OperatorTaskListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/tasks/create"
        element={
          <ProtectedRoute allowedRoles={[UserRole.OPERATOR]}>
            <OperatorTaskCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/tasks/:taskId"
        element={
          <ProtectedRoute allowedRoles={[UserRole.OPERATOR]}>
            <OperatorTaskDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/tasks/:taskId/report"
        element={
          <ProtectedRoute allowedRoles={[UserRole.OPERATOR]}>
            <OperatorReportPage />
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

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <TaskManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks/create"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <TaskCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks/create/:taskId"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <TaskCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/departments"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
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
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/groups"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
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


