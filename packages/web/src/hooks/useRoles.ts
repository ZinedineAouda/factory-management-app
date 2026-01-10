import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { ApiEndpoints } from '../api/endpoints-override';
import { RootState } from '../store';

export interface Role {
  id: string;
  role: string;
  role_display_name: string;
  can_view_users: number;
  can_edit_users: number;
  can_view_departments: number;
  can_edit_departments: number;
  can_view_groups: number;
  can_edit_groups: number;
  can_view_products: number;
  can_edit_products: number;
  can_view_reports: number;
  can_edit_reports: number;
  can_view_analytics: number;
  max_data_reach: string;
  created_at: string;
  updated_at: string;
}

// Default colors for built-in roles
const DEFAULT_ROLE_COLORS: Record<string, string> = {
  admin: '#ef4444',     // red
  worker: '#3b82f6',    // blue
  operator: '#f59e0b',  // amber
  leader: '#22c55e',    // green
};

// Generate a consistent color for custom roles based on the role name
const generateRoleColor = (roleName: string): string => {
  // Use a hash to generate a hue value for consistency
  let hash = 0;
  for (let i = 0; i < roleName.length; i++) {
    hash = roleName.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate hue from 0-360 and use fixed saturation/lightness for good colors
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
};

export const getRoleColor = (role: string): string => {
  return DEFAULT_ROLE_COLORS[role.toLowerCase()] || generateRoleColor(role);
};

export const getRoleDisplayName = (role: Role | string): string => {
  if (typeof role === 'string') {
    // Capitalize first letter
    return role.charAt(0).toUpperCase() + role.slice(1);
  }
  return role.role_display_name || role.role.charAt(0).toUpperCase() + role.role.slice(1);
};

interface UseRolesReturn {
  roles: Role[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getRoleByName: (roleName: string) => Role | undefined;
  roleNames: string[];
}

export const useRoles = (): UseRolesReturn => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useSelector((state: RootState) => state.auth);

  const fetchRoles = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(ApiEndpoints.ROLE_PERMISSIONS.LIST, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRoles(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch roles:', err);
      setError(err.response?.data?.error || 'Failed to fetch roles');
      // Set default roles as fallback
      setRoles([
        { id: '1', role: 'admin', role_display_name: 'Administrator', can_view_users: 1, can_edit_users: 1, can_view_departments: 1, can_edit_departments: 1, can_view_groups: 1, can_edit_groups: 1, can_view_products: 1, can_edit_products: 1, can_view_reports: 1, can_edit_reports: 1, can_view_analytics: 1, max_data_reach: 'all', created_at: '', updated_at: '' },
        { id: '2', role: 'worker', role_display_name: 'Worker', can_view_users: 0, can_edit_users: 0, can_view_departments: 0, can_edit_departments: 0, can_view_groups: 0, can_edit_groups: 0, can_view_products: 1, can_edit_products: 0, can_view_reports: 0, can_edit_reports: 0, can_view_analytics: 0, max_data_reach: 'own', created_at: '', updated_at: '' },
        { id: '3', role: 'operator', role_display_name: 'Operator', can_view_users: 0, can_edit_users: 0, can_view_departments: 0, can_edit_departments: 0, can_view_groups: 0, can_edit_groups: 0, can_view_products: 0, can_edit_products: 0, can_view_reports: 1, can_edit_reports: 1, can_view_analytics: 0, max_data_reach: 'own', created_at: '', updated_at: '' },
        { id: '4', role: 'leader', role_display_name: 'Leader', can_view_users: 0, can_edit_users: 0, can_view_departments: 0, can_edit_departments: 0, can_view_groups: 0, can_edit_groups: 0, can_view_products: 0, can_edit_products: 0, can_view_reports: 1, can_edit_reports: 0, can_view_analytics: 0, max_data_reach: 'department', created_at: '', updated_at: '' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const getRoleByName = useCallback((roleName: string): Role | undefined => {
    return roles.find(r => r.role.toLowerCase() === roleName.toLowerCase());
  }, [roles]);

  const roleNames = roles.map(r => r.role);

  return {
    roles,
    loading,
    error,
    refetch: fetchRoles,
    getRoleByName,
    roleNames,
  };
};

export default useRoles;

