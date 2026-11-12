import { apiRequest } from '../../lib/api-client';
import type { AuthResponse, LoginInput } from './auth.types';

export function getCurrentUser(): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/me');
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/auth/logout', {
    method: 'POST',
  });
}
