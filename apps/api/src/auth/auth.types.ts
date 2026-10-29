import { UserRole } from '@prisma/client';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthenticatedRequest {
  cookies?: Record<string, string | undefined>;
  user?: PublicUser;
}
