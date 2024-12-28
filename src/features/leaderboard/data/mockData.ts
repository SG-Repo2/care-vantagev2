import { LeaderboardEntry } from '../types/leaderboard';

const MOCK_AVATARS = [
  'https://i.pravatar.cc/150?img=47',
  'https://i.pravatar.cc/150?img=32',
  'https://i.pravatar.cc/150?img=28',
  'https://i.pravatar.cc/150?img=15',
  'https://i.pravatar.cc/150?img=56',
];

const MOCK_NAMES = [
  'Sarah Johnson',
  'Michael Chen',
  'Emma Wilson',
  'James Rodriguez',
  'Lisa Thompson',
];

export const generateMockLeaderboardData = (userScore: number): LeaderboardEntry[] => {
  // Generate mock competitors with varying scores around the user's score
  const baseEntries: LeaderboardEntry[] = MOCK_NAMES.map((name, index) => {
    // Create some variance in scores but keep them relatively close to user's score
    const scoreVariance = Math.random() * 20 - 10; // Random number between -10 and 10
    const competitorScore = Math.max(0, Math.min(100, userScore + scoreVariance));
    
    return {
      id: `mock-${index + 2}`, // Start from 2 since user will be 1
      name,
      avatarUrl: MOCK_AVATARS[index],
      metrics: {
        steps: Math.round(competitorScore * 100), // Scale steps based on score
        distance: Number((competitorScore * 0.1).toFixed(1)), // Scale distance based on score
      },
      score: {
        overall: Math.round(competitorScore),
        categories: {
          steps: Math.round(competitorScore * 0.9),
          distance: Math.round(competitorScore * 0.95),
        },
        bonusPoints: Math.round(Math.random() * 10), // Random bonus points 0-10
      },
      rank: 0, // Will be calculated after sorting
    };
  });

  // Create user entry
  const userEntry: LeaderboardEntry = {
    id: '1',
    name: 'You',
    avatarUrl: 'https://i.pravatar.cc/150?img=68',
    metrics: {
      steps: Math.round(userScore * 100),
      distance: Number((userScore * 0.1).toFixed(1)),
    },
    score: {
      overall: userScore,
      categories: {
        steps: Math.round(userScore * 0.9),
        distance: Math.round(userScore * 0.95),
      },
      bonusPoints: 5,
    },
    rank: 0,
  };

  // Combine and sort entries
  const allEntries = [userEntry, ...baseEntries];
  const sortedEntries = allEntries.sort((a, b) => b.score.overall - a.score.overall);

  // Assign ranks based on sorted position
  return sortedEntries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};
