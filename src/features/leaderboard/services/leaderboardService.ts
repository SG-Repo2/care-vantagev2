import { LeaderboardEntry } from '../types/leaderboard';
import { PrivacyLevel } from '../../../core/types/base';

class LeaderboardService {
  private mockData: LeaderboardEntry[] = [];

  async getLeaderboard(date: string): Promise<LeaderboardEntry[]> {
    // Generate mock data
    const mockEntries: LeaderboardEntry[] = [
      {
        profileId: 'current-user',
        profile: {
          id: 'current-user',
          userId: 'current-user',
          displayName: 'You',
          photoUrl: null,
          privacyLevel: 'public'
        },
        steps: 8500,
        distance: 6.2,
        score: 85,
        rank: 3
      },
      {
        profileId: 'user-1',
        profile: {
          id: 'user-1',
          userId: 'user-1',
          displayName: 'Sarah Johnson',
          photoUrl: 'https://i.pravatar.cc/150?img=47',
          privacyLevel: 'public'
        },
        steps: 9200,
        distance: 7.1,
        score: 92,
        rank: 1
      },
      {
        profileId: 'user-2',
        profile: {
          id: 'user-2',
          userId: 'user-2',
          displayName: 'Michael Chen',
          photoUrl: 'https://i.pravatar.cc/150?img=32',
          privacyLevel: 'public'
        },
        steps: 8800,
        distance: 6.8,
        score: 88,
        rank: 2
      },
      {
        profileId: 'user-3',
        profile: {
          id: 'user-3',
          userId: 'user-3',
          displayName: 'Private User',
          photoUrl: null,
          privacyLevel: 'private'
        },
        steps: 7500,
        distance: 5.5,
        score: 75,
        rank: 4
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