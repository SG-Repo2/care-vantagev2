import { LeaderboardEntry } from '../types/leaderboard';

export class LeaderboardService {
  private mockData: LeaderboardEntry[] = [];

  async getLeaderboard(date: string): Promise<LeaderboardEntry[]> {
    const activityBlurbs = [
      "I love morning yoga sessions!",
      "Running with my dog keeps me going",
      "Dance workouts are my favorite",
      "Swimming laps every evening",
      "Hiking on weekends energizes me",
      "Basketball with friends is my jam",
      "Daily meditation and stretching",
      "Rock climbing keeps me strong"
    ];

    const mockEntries: LeaderboardEntry[] = [
      {
        profileId: 'current-user',
        profile: {
          id: 'current-user',
          userId: 'current-user',
          displayName: 'You',
          photoUrl: 'https://i.pravatar.cc/150?img=68',
          privacyLevel: 'public'
        },
        steps: 0,
        distance: 0,
        score: 850,
        rank: 3,
        activityBlurb: activityBlurbs[0]
      },
      {
        profileId: 'user-1',
        profile: {
          id: 'user-1',
          userId: 'user-1',
          displayName: 'Sarah',
          photoUrl: 'https://i.pravatar.cc/150?img=47',
          privacyLevel: 'public'
        },
        steps: 0,
        distance: 0,
        score: 1000,
        rank: 1,
        activityBlurb: activityBlurbs[1]
      },
      {
        profileId: 'user-2',
        profile: {
          id: 'user-2',
          userId: 'user-2',
          displayName: 'Michael',
          photoUrl: 'https://i.pravatar.cc/150?img=32',
          privacyLevel: 'public'
        },
        steps: 0,
        distance: 0,
        score: 925,
        rank: 2,
        activityBlurb: activityBlurbs[2]
      },
      {
        profileId: 'user-3',
        profile: {
          id: 'user-3',
          userId: 'user-3',
          displayName: 'Private',
          photoUrl: null,
          privacyLevel: 'private'
        },
        steps: 0,
        distance: 0,
        score: 800,
        rank: 4,
        activityBlurb: activityBlurbs[3]
      },
      {
        profileId: 'user-4',
        profile: {
          id: 'user-4',
          userId: 'user-4',
          displayName: 'Emma',
          photoUrl: 'https://i.pravatar.cc/150?img=45',
          privacyLevel: 'public'
        },
        steps: 0,
        distance: 0,
        score: 750,
        rank: 5,
        activityBlurb: activityBlurbs[4]
      },
      {
        profileId: 'user-5',
        profile: {
          id: 'user-5',
          userId: 'user-5',
          displayName: 'James',
          photoUrl: 'https://i.pravatar.cc/150?img=53',
          privacyLevel: 'public'
        },
        steps: 0,
        distance: 0,
        score: 675,
        rank: 6,
        activityBlurb: activityBlurbs[5]
      },
      {
        profileId: 'user-6',
        profile: {
          id: 'user-6',
          userId: 'user-6',
          displayName: 'Private',
          photoUrl: null,
          privacyLevel: 'private'
        },
        steps: 0,
        distance: 0,
        score: 600,
        rank: 7,
        activityBlurb: activityBlurbs[6]
      },
      {
        profileId: 'user-7',
        profile: {
          id: 'user-7',
          userId: 'user-7',
          displayName: 'Lisa',
          photoUrl: 'https://i.pravatar.cc/150?img=44',
          privacyLevel: 'public'
        },
        steps: 0,
        distance: 0,
        score: 500,
        rank: 8,
        activityBlurb: activityBlurbs[7]
      }
    ];

    this.mockData = mockEntries;
    return mockEntries;
  }

  async getWeeklyLeaderboard(startDate: string, endDate: string): Promise<LeaderboardEntry[]> {
    return this.mockData;
  }

  async getUserRank(userId: string): Promise<number> {
    const userEntry = this.mockData.find(entry => entry.profileId === userId);
    return userEntry?.rank || 3;
  }
}

export default new LeaderboardService();
