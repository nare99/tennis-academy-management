export type UserRole = 'CUSTOMER' | 'TRAINER' | 'ADMIN';

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: PublicUser;
};
