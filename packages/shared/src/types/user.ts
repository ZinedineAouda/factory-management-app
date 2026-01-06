export enum UserRole {
  ADMIN = 'admin',
  WORKER = 'worker',
  OPERATOR = 'operator',
  LEADER = 'leader',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  groupId?: string | null;
  groupName?: string | null;
  createdAt: string;
  isActive: boolean;
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

