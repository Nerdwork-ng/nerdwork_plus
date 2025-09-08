export type APIProfile = {
  role: string;
  profile: Profile;
};

export type Profile = {
  id: string;
  userId: string;
  fullName: string;
  genres: string[];
  walletId: string;
  walletBalance?: number;
  pinHash?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export interface ProfileStore {
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
}
