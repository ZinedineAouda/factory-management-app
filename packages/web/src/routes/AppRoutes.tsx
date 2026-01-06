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

      {/* Worker/Operator Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute allowedRoles={[UserRole.WORKER, UserRole.ADMIN, UserRole.OPERATOR]}>
            {user?.role === UserRole.ADMIN ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user?.role === UserRole.OPERATOR ? (
              <Navigate to="/operator/dashboard" replace />
            ) : (
              <Navigate to="/tasks" replace />
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <TaskListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:taskId"
        element={
          <ProtectedRoute allowedRoles={['worker']}>
            <TaskDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['worker']}>
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
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/tasks"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorTaskListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/tasks/create"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorTaskCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/tasks/:taskId"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorTaskDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/operator/tasks/:taskId/report"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorReportPage />
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

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;


