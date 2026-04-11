export type UserRole = "USER" | "ADMIN";

export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: UserDTO;
}
