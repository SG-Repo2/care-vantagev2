import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

let mockData = [
  { id: '3', user_id: 'test-user-3', display_name: 'Mike Hiker', score: 1500, created_at: new Date().toISOString() },
  { id: '7', user_id: 'test-user-7', display_name: 'David Gym', score: 1300, created_at: new Date().toISOString() },
  { id: '1', user_id: 'test-user-1', display_name: 'John Runner', score: 1250, created_at: new Date().toISOString() },
  { id: '4', user_id: 'test-user-4', display_name: 'Emma Cyclist', score: 1100, created_at: new Date().toISOString() },
  { id: '2', user_id: 'test-user-2', display_name: 'Sarah Walker', score: 980, created_at: new Date().toISOString() },
];

// Mock Supabase
jest.mock('./utils/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockImplementation((data) => ({
        eq: jest.fn().mockImplementation((field, value) => {
          const index = mockData.findIndex(item => item.user_id === value);
          if (index !== -1) {
            mockData[index] = { ...mockData[index], ...data };
            mockData.sort((a, b) => b.score - a.score);
          }
          return { data: null, error: null };
        })
      })),
      delete: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockImplementation(() => ({
        data: mockData,
        error: null
      }))
    }))
  }
})); 