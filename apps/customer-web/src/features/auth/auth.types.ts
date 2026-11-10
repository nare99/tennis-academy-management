
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'TRAINER' | 'ADMIN';
  isActive: boolean;
};
