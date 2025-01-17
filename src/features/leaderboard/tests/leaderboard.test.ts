import { testUtils } from '../utils/testData';
import { leaderboardService } from '../services/leaderboardService';

describe('Leaderboard Tests', () => {
  beforeAll(async () => {
    // Populate test data before running tests
    await testUtils.clearTestData(); // Clear any existing test data
    const success = await testUtils.populateTestData();
    if (!success) {
      throw new Error('Failed to populate test data');
    }
  });

  afterAll(async () => {
    // Clean up test data after tests
    await testUtils.clearTestData();
  });

  it('should fetch leaderboard data in correct order', async () => {
    const leaderboard = await leaderboardService.fetchLeaderboard();
    
    expect(leaderboard).toBeDefined();
    expect(leaderboard.length).toBeGreaterThan(0);
    
    // Verify sorting
    for (let i = 1; i < leaderboard.length; i++) {
      expect(leaderboard[i-1].score).toBeGreaterThanOrEqual(leaderboard[i].score);
    }
  });

  it('should have correct rank assignments', async () => {
    const leaderboard = await leaderboardService.fetchLeaderboard();
    
    leaderboard.forEach((entry, index) => {
      expect(entry.rank).toBe(index + 1);
    });
  });

  it('should update user score correctly', async () => {
    const testUserId = 'test-user-1';
    const newScore = 2000;
    
    await leaderboardService.updateScore(testUserId, newScore);
    
    const updatedLeaderboard = await leaderboardService.fetchLeaderboard();
    const updatedUser = updatedLeaderboard.find(entry => entry.user_id === testUserId);
    
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.score).toBe(newScore);
  });
}); 