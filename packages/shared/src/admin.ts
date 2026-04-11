import type { UserRole } from "./auth";

export interface AdminResortSummary {
  id: string;
  name: string;
  moneyCents: number;
  liftsCount: number;
}

export interface AdminUserDTO {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  resort: AdminResortSummary | null;
}

export interface CreateAdminUserRequest {
  username: string;
  email?: string;
}

export interface CreateAdminUserResponse {
  user: AdminUserDTO;
  password: string;
}

export interface ResetPasswordResponse {
  password: string;
}
