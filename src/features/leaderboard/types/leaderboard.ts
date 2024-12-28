import { MD3Theme } from 'react-native-paper/lib/typescript/types';

export interface ExtendedTheme extends MD3Theme {
  metrics: {
    steps: string;
    distance: string;
    score: string;
    calories: string;
    sleep: string;
  };
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl: string;
  metrics: {
    steps: number;
    distance: number;
  };
  score: {
    overall: number;
    categories: {
      steps: number;
      distance: number;
    };
    bonusPoints: number;
  };
  rank: number;
}

export interface LeaderboardItemProps {
  entry: LeaderboardEntry;
  isUser: boolean;
}

// Enhanced dummy data with realistic metrics and scores
export const DUMMY_DATA: LeaderboardEntry[] = [
  {
    id: '1',
    name: 'You',
    avatarUrl: 'https://i.pravatar.cc/150?img=68',
    metrics: { steps: 12000, distance: 8.5 },
    score: {
      overall: 95,
      categories: { steps: 90, distance: 95 },
      bonusPoints: 5
    },
    rank: 1
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
    metrics: { steps: 11500, distance: 8.2 },
    score: {
      overall: 92,
      categories: { steps: 85, distance: 94 },
      bonusPoints: 5
    },
    rank: 2
  },
  {
    id: '3',
    name: 'Mike Chen',
    avatarUrl: 'https://i.pravatar.cc/150?img=11',
    metrics: { steps: 10800, distance: 7.8 },
    score: {
      overall: 88,
      categories: { steps: 80, distance: 91 },
      bonusPoints: 5
    },
    rank: 3
  },
  {
    id: '4',
    name: 'Emma Wilson',
    avatarUrl: 'https://i.pravatar.cc/150?img=23',
    metrics: { steps: 9500, distance: 7.2 },
    score: {
      overall: 82,
      categories: { steps: 75, distance: 84 },
      bonusPoints: 5
    },
    rank: 4
  },
  {
    id: '5',
    name: 'James Smith',
    avatarUrl: 'https://i.pravatar.cc/150?img=3',
    metrics: { steps: 8800, distance: 6.5 },
    score: {
      overall: 76,
      categories: { steps: 70, distance: 77 },
      bonusPoints: 5
    },
    rank: 5
  },
  {
    id: '6',
    name: 'Lisa Brown',
    avatarUrl: 'https://i.pravatar.cc/150?img=32',
    metrics: { steps: 7500, distance: 5.8 },
    score: {
      overall: 70,
      categories: { steps: 65, distance: 70 },
      bonusPoints: 5
    },
    rank: 6
  },
  {
    id: '7',
    name: 'David Lee',
    avatarUrl: 'https://i.pravatar.cc/150?img=15',
    metrics: { steps: 6800, distance: 5.2 },
    score: {
      overall: 65,
      categories: { steps: 60, distance: 65 },
      bonusPoints: 5
    },
    rank: 7
  },
  {
    id: '8',
    name: 'Anna Garcia',
    avatarUrl: 'https://i.pravatar.cc/150?img=44',
    metrics: { steps: 6200, distance: 4.8 },
    score: {
      overall: 60,
      categories: { steps: 55, distance: 60 },
      bonusPoints: 5
    },
    rank: 8
  },
  {
    id: '9',
    name: 'Tom Wilson',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    metrics: { steps: 5500, distance: 4.2 },
    score: {
      overall: 55,
      categories: { steps: 50, distance: 55 },
      bonusPoints: 5
    },
    rank: 9
  },
  {
    id: '10',
    name: 'Rachel Kim',
    avatarUrl: 'https://i.pravatar.cc/150?img=41',
    metrics: { steps: 5000, distance: 3.8 },
    score: {
      overall: 50,
      categories: { steps: 45, distance: 50 },
      bonusPoints: 5
    },
    rank: 10
  },
];
