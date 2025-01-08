import { PrivacyLevel } from '../../../core/types/base';

export interface LeaderboardEntry {
  profileId: string;
  profile: {
    id: string;
    userId: string;
    displayName: string;
    photoUrl: string | null;
    privacyLevel: PrivacyLevel;
  };
  steps: number;
  distance: number;
  score: number;
  rank?: number;
  activityBlurb?: string;
}
