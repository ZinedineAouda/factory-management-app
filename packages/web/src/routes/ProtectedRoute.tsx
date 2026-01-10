import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { UserRole } from '@factory-app/shared';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
  requiredPermission?: {
    view?: string; // e.g., 'Users', 'Departments', 'Products'
    edit?: string;
  };
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requiredPermission 
}) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { isAdmin, canView, canEdit } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access (if specified)
  if (allowedRoles && user && user.role && !allowedRoles.includes(user.role)) {
    // Admin always has access
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  // Check permission-based access (if specified)
  if (requiredPermission) {
    if (requiredPermission.view && !isAdmin && !canView(requiredPermission.view)) {
      return <Navigate to="/" replace />;
    }
    if (requiredPermission.edit && !isAdmin && !canEdit(requiredPermission.edit)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

