export type UserRole = "USER" | "ADMIN";

export interface UserDTO {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: UserDTO;
}
