import { leaderboardService, LeaderboardEntry } from '../services/leaderboardService';
import { supabase } from '../../../utils/supabase';

describe('LeaderboardService', () => {
  const testUserId = 'test-user-id';
  const initialScore = 100;

  beforeEach(async () => {
    // Clean up and set up test data
    await supabase
      .from('users')
      .delete()
      .eq('id', testUserId);

    await supabase
      .from('users')
      .insert({
        id: testUserId,
        display_name: 'Test User',
        score: initialScore,
        privacy_level: 'public'
      });
  });

  afterEach(async () => {
    // Clean up test data
    await supabase
      .from('users')
      .delete()
      .eq('id', testUserId);
  });

  it('should fetch leaderboard data with correct ranking', async () => {
    const leaderboard = await leaderboardService.getLeaderboard(1);
    expect(Array.isArray(leaderboard)).toBe(true);
    
    const testUser = leaderboard.find(entry => entry.public_id === testUserId);
    expect(testUser).toBeDefined();
    expect(testUser?.score).toBe(initialScore);
  });

  it('should handle score updates correctly', async () => {
    const newScore = 200;
    await leaderboardService.updateScore(testUserId, newScore);

    const leaderboard = await leaderboardService.getLeaderboard(1);
    const updatedUser = leaderboard.find(entry => entry.public_id === testUserId);
    
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.score).toBe(newScore);
  });

  it('should respect privacy settings', async () => {
    // Set user to private
    await supabase
      .from('users')
      .update({ privacy_level: 'private' })
      .eq('id', testUserId);

    const leaderboard = await leaderboardService.getLeaderboard(1);
    const privateUser = leaderboard.find(entry => entry.public_id === testUserId);

    expect(privateUser?.score).toBe(0);
    expect(privateUser?.photo_url).toBeNull();
    expect(privateUser?.display_name).toMatch(/^anonymous_user_/);
  });
}); 