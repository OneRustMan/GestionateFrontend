import { MunicipalUnit, Shift, UserRole } from './auth.models';

export interface UserProfileResponse {
  userId: number;
  profileId: number;
  role: UserRole;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
  email: string;
  districtId: number | null;
  districtName: string | null;
  province: string | null;
  homeAddress: string | null;
  municipalityId: number | null;
  municipalityName: string | null;
  municipalUnit: MunicipalUnit | null;
  workerCode: string | null;
  shift: Shift | null;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  districtId: number | null;
  districtName: string | null;
  province: string | null;
  homeAddress: string | null;
  municipalityId: number | null;
  municipalityName: string | null;
  municipalUnit: MunicipalUnit | null;
  shift: Shift | null;
}
