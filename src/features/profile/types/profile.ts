export interface Profile {
  id: string;
  email: string;
  display_name: string;
  photo_url: string;
  settings: {
    measurementSystem: 'metric' | 'imperial';
    notifications: boolean;
    privacyLevel: 'private' | 'friends' | 'public';
    dailyGoals: {
      steps: number;
      sleep: number;  // in minutes
      water: number;  // in milliliters
    };
  };
  created_at?: string;
  updated_at?: string;
}
