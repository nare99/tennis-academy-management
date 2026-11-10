
import { apiRequest } from '../../lib/api-client';
import type { PublicUser } from './auth.types';

export function getCurrentUser(): Promise<{ user: PublicUser }> {
  return apiRequest<{ user: PublicUser }>('/api/auth/me');
}

export function login(input: {
  email: string;
  password: string;
}): Promise<{ user: PublicUser }> {
  return apiRequest<{ user: PublicUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: PublicUser }> {
  return apiRequest<{ user: PublicUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>('/api/auth/logout', {
    method: 'POST',
  });
}
