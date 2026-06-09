export type UserRole = 'CITIZEN' | 'MUNICIPAL_RECEPTIONIST' | 'CLEANING_OPERATIONS';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  userId: number;
  profileId: number;
  role: UserRole;
  fullName: string;
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterRequest {
  firstName?: string;
  lastName?: string;
  dni?: string;
  phone?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  districtId?: number;
  address?: string;
  [key: string]: string | number | boolean | undefined;
}
