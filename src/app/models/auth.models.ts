export type UserRole = 'CITIZEN' | 'MUNICIPAL_RECEPTIONIST' | 'CLEANING_OPERATIONS';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: number;
  profileId: number;
  role: UserRole;
  fullName: string;
  email: string;
}

export interface AuthSession extends LoginResponse {}

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

export type MunicipalUnit = 'CITIZEN_SERVICE' | 'DOCUMENTARY_PROCESSING' | 'NEIGHBORHOOD_PLATFORM';

export type Shift = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export interface RegisterCitizenRequest {
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  districtId: number | null;
  districtName: string | null;
  province: string | null;
  homeAddress: string;
}

export interface RegisterMunicipalReceptionistRequest {
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  municipalityId: number | null;
  municipalityName: string | null;
  districtId: number | null;
  districtName: string | null;
  province: string | null;
  municipalUnit: MunicipalUnit;
  workerCode: string;
}

export interface RegisterCleaningOperationsStaffRequest {
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  municipalityId: number | null;
  municipalityName: string | null;
  districtId: number | null;
  districtName: string | null;
  province: string | null;
  workerCode: string;
  shift: Shift;
}
