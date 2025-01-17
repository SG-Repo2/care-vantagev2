import { supabase } from '../../../utils/supabase';

export interface TestProfile {
  user_id: string;
  display_name: string;
  score: number;
}

const TEST_PROFILES: TestProfile[] = [
  { user_id: 'test-user-1', display_name: 'John Runner', score: 1250 },
  { user_id: 'test-user-2', display_name: 'Sarah Walker', score: 980 },
  { user_id: 'test-user-3', display_name: 'Mike Hiker', score: 1500 },
  { user_id: 'test-user-4', display_name: 'Emma Cyclist', score: 1100 },
  { user_id: 'test-user-5', display_name: 'Tom Swimmer', score: 850 },
  { user_id: 'test-user-6', display_name: 'Lisa Yoga', score: 920 },
  { user_id: 'test-user-7', display_name: 'David Gym', score: 1300 },
  { user_id: 'test-user-8', display_name: 'Amy Dancer', score: 750 },
];

export const testUtils = {
  async populateTestData() {
    try {
      console.log('Starting to populate test data...');
      
      // Insert test profiles
      const { error: insertError } = await supabase
        .from('profiles')
        .upsert(
          TEST_PROFILES.map(profile => ({
            ...profile,
            email: `${profile.display_name.toLowerCase().replace(' ', '.')}@test.com`,
            created_at: new Date().toISOString(),
          }))
        );

      if (insertError) {
        throw insertError;
      }

      console.log('Successfully populated test data');
      return true;
    } catch (error) {
      console.error('Error populating test data:', error);
      return false;
    }
  },

  async clearTestData() {
    try {
      console.log('Starting to clear test data...');
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .in('user_id', TEST_PROFILES.map(p => p.user_id));

      if (error) {
        throw error;
      }

      console.log('Successfully cleared test data');
      return true;
    } catch (error) {
      console.error('Error clearing test data:', error);
      return false;
    }
  },

  async verifyTestData() {
    try {
      console.log('Verifying test data...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', TEST_PROFILES.map(p => p.user_id))
        .order('score', { ascending: false });

      if (error) {
        throw error;
      }

      console.log('Test data verification results:');
      console.log(`Found ${data.length} test profiles`);
      console.log('Top 3 scores:', data.slice(0, 3).map(p => ({
        name: p.display_name,
        score: p.score
      })));

      return data;
    } catch (error) {
      console.error('Error verifying test data:', error);
      return null;
    }
  }
}; 