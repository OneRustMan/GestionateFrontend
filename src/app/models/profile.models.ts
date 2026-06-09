export interface UserProfile {
  userId?: number;
  profileId?: number;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  districtId?: number;
  districtName?: string;
  [key: string]: string | number | boolean | undefined;
}

export type UpdateProfileRequest = Partial<UserProfile>;
