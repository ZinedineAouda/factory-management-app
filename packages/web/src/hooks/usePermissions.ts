import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { UserPermissions } from '@factory-app/shared';

export const usePermissions = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Admin always has all permissions
  const isAdmin = user?.role === 'admin';
  
  // Get permissions from user object (set by backend)
  const permissions: UserPermissions | null | undefined = user?.permissions;
  
  // Default permissions for admin (if permissions not loaded yet)
  const defaultAdminPermissions: UserPermissions = {
    canViewUsers: true,
    canEditUsers: true,
    canViewDepartments: true,
    canEditDepartments: true,
    canViewGroups: true,
    canEditGroups: true,
    canViewProducts: true,
    canEditProducts: true,
    canViewReports: true,
    canEditReports: true,
    canViewTasks: true,
    canEditTasks: true,
    canViewAnalytics: true,
    maxDataReach: 'all',
  };
  
  // If admin and permissions not loaded, use default admin permissions
  const effectivePermissions: UserPermissions | null = isAdmin && !permissions 
    ? defaultAdminPermissions 
    : (permissions || null);
  
  return {
    permissions: effectivePermissions,
    isAdmin,
    canView: (resource: string) => {
      if (isAdmin) return true;
      if (!effectivePermissions) return false;
      const viewKey = `canView${resource}` as keyof UserPermissions;
      return effectivePermissions[viewKey] === true;
    },
    canEdit: (resource: string) => {
      if (isAdmin) return true;
      if (!effectivePermissions) return false;
      const editKey = `canEdit${resource}` as keyof UserPermissions;
      return effectivePermissions[editKey] === true;
    },
  };
};

