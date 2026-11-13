export type Court = {
  id: string;
  name: string;
  surface: string | null;
  isIndoor: boolean;
  hasLights: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CourtInput = {
  name: string;
  surface: string | null;
  isIndoor: boolean;
};

export type UpdateCourtStatusInput = {
  isActive: boolean;
};
