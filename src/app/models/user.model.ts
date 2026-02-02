export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  createdAt: Date;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}
