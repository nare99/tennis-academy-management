export type TrainerStatus = 'ACTIVE' | 'INVITED' | 'INVITATION_EXPIRED' | 'INACTIVE';

export type Trainer = {
  id: string;
  email: string;
  name: string;
  role: 'TRAINER';
  isActive: boolean;
  status: TrainerStatus;
  invitationExpiresAt: string | null;
  trainerProfile: {
    id: string;
    bio: string | null;
    hourlyRateMinor: number | null;
    currency: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type TrainerInput = {
  email: string;
  name: string;
  bio: string | null;
  hourlyRateMinor: number | null;
  currency: string;
};

export type TrainerInvitationResult = {
  trainer: Trainer;
  invitationUrl: string;
  invitationExpiresAt: string;
};
