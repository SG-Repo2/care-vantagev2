export interface LeaderboardMetrics {
  steps: number;
  distance: number;
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  FRIENDS_ONLY = 'friends_only',
  PRIVATE = 'private'
}

export interface CategoryScores {
  steps: number;
  distance: number;
}

export interface UserScore {
  overall: number;
  categories: CategoryScores;
  bonusPoints: number;
}

export interface UserProfile {
  id: string;
  userId: string; // Links to auth user
  displayName: string;
  photoUrl: string | null;
  privacyLevel: PrivacyLevel;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  profileId: string;
  profile: UserProfile;
  metrics: LeaderboardMetrics;
  score: UserScore;
  rank: number;
}

export interface LeaderboardState {
  entries: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  selectedEntry: string | null;
}
