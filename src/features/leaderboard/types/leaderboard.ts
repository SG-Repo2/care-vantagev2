export interface LeaderboardMetrics {
  steps: number;
  distance: number;
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

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl: string;
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
