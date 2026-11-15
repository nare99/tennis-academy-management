import { apiRequest } from '../../lib/api-client';
import type { Trainer, TrainerInput, TrainerInvitationResult } from './trainers.types';

export function getTrainers(): Promise<Trainer[]> {
  return apiRequest<Trainer[]>('/api/trainers/admin');
}

export function createTrainer(input: TrainerInput): Promise<TrainerInvitationResult> {
  return apiRequest<TrainerInvitationResult>('/api/trainers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateTrainer(id: string, input: TrainerInput): Promise<Trainer> {
  return apiRequest<Trainer>(`/api/trainers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function updateTrainerStatus(id: string, isActive: boolean): Promise<unknown> {
  return apiRequest(`/api/trainers/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function reissueTrainerInvitation(id: string): Promise<{ invitationUrl: string; invitationExpiresAt: string }> {
  return apiRequest(`/api/trainers/${encodeURIComponent(id)}/invitation`, {
    method: 'POST',
  });
}

export function acceptTrainerInvitation(token: string, password: string): Promise<{ user: { id: string; email: string; name: string; role: string; isActive: boolean } }> {
  return apiRequest('/api/trainers/invitations/accept', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}
