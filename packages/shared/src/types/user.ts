export enum UserRole {
  ADMIN = 'admin',
  WORKER = 'worker',
  OPERATOR = 'operator',
  LEADER = 'leader',
}

export interface UserPermissions {
  canViewUsers: boolean;
  canEditUsers: boolean;
  canViewDepartments: boolean;
  canEditDepartments: boolean;
  canViewGroups: boolean;
  canEditGroups: boolean;
  canViewProducts: boolean;
  canEditProducts: boolean;
  canViewReports: boolean;
  canEditReports: boolean;
  canViewAnalytics: boolean;
  maxDataReach: 'own' | 'department' | 'group' | 'all';
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  role: UserRole;
  groupId?: string | null;
  groupName?: string | null;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
  status?: string;
  profilePhotoUrl?: string;
  bio?: string;
  permissions?: UserPermissions | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  registrationCode: string;
}

export interface RegistrationCode {
  id: string;
  code: string;
  role: UserRole;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  createdAt: string;
  expiresAt?: string;
  createdBy?: string;
}

