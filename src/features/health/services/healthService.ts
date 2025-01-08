import { HealthMetrics, WeeklyMetrics } from '../types/health';

class HealthService {
  async getHealthData(userId: string): Promise<HealthMetrics & WeeklyMetrics> {
    // Mock data for development
    return {
      id: 'mock-id',
      profileId: userId,
      date: new Date().toISOString().split('T')[0],
      steps: 8500,
      distance: 6.2,
      calories: 2200,
      score: 85,
      source: 'apple_health',
      createdAt: new Date(),
      updatedAt: new Date(),
      weeklySteps: [7500, 8000, 8200, 8400, 8500, 8600, 8500],
      weekStartDate: new Date(),
    };
  }
}

export default new HealthService(); 