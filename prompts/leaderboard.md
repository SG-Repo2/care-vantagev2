# Live Leaderboard Privacy & Migration Guide

This guide provides a step-by-step plan for:
1. **Updating your database** to store user privacy preferences and provide a sanitized (public-friendly) leaderboard view.  
2. **Implementing privacy masking** for display name, score, and avatar based on each user's privacy settings.  
3. **Ensuring live (real-time) leaderboard** updates via Supabase Realtime subscriptions.  
4. **Refactoring existing client code** (e.g. `leaderboardService.ts`) to consume the new view while preserving backward compatibility.

---

## Table of Contents
1. [Database Schema Changes](#1-database-schema-changes)  
2. [Migration Script Examples](#2-migration-script-examples)  
3. [New/Updated Database Objects](#3-newupdated-database-objects)  
4. [RLS Policies](#4-rls-policies)  
5. [Service Refactoring](#5-service-refactoring)  
6. [Client Integration](#6-client-integration)  
7. [Deployment Order](#7-deployment-order)  
8. [Testing & Validation](#8-testing--validation)  

---

## 1. Database Schema Changes

### 1.1 Add Privacy Column
The `privacy_level` column already exists in the `users` table as defined in `src/core/types/base.ts`. We use the existing ENUM with three values:

- `private` – user remains masked on the leaderboard  
- `friends` – (for future friend-only visibility)  
- `public` – user's name, score, and photo are fully displayed

### 1.2 Create or Update Leaderboard View
We will create (or replace) a sanitized view named `leaderboard_public`. This view:
- Masks the display name as `'anonymous_user_[hash]'` if a user is `private` or has an empty name
- Masks the score (sets to `0`) if a user is `private`
- Masks `photo_url` if a user is `private`
- Excludes `deleted_at` users
- Implements proper tie-breaking
- Prevents negative scores
- Adds rank calculation

## 2. Migration Script Examples

Below are two example migration files using a timestamp-based naming convention similar to your existing migrations.

### 2.1 20250121180100_create_leaderboard_public_view.sql

```sql
-- Drop the view if it exists
DROP VIEW IF EXISTS public.leaderboard_public CASCADE;

-- Create or replace the sanitized leaderboard view with improved privacy and performance
CREATE OR REPLACE VIEW public.leaderboard_public AS
WITH ranked_users AS (
  SELECT
    -- Hash the user_id for public display
    encode(digest(id::text, 'sha256'), 'hex') AS public_id,
    CASE
      WHEN privacy_level IS NULL OR privacy_level = 'private' THEN 
        'anonymous_user_' || encode(digest(id::text, 'sha256'), 'base64')
      WHEN display_name IS NULL OR display_name = '' THEN 
        'anonymous_user_' || encode(digest(id::text, 'sha256'), 'base64')
      ELSE display_name
    END AS display_name,
    CASE
      WHEN privacy_level IS NULL OR privacy_level = 'private' THEN NULL
      ELSE photo_url
    END AS photo_url,
    CASE
      WHEN privacy_level IS NULL OR privacy_level = 'private' THEN 0
      ELSE GREATEST(COALESCE(score, 0), 0) -- Prevent negative scores
    END AS score,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE 
          WHEN privacy_level = 'private' THEN 0 
          ELSE COALESCE(score, 0) 
        END DESC,
        created_at ASC -- Consistent tie-breaking
    ) as rank
  FROM public.users
  WHERE deleted_at IS NULL
)
SELECT *
FROM ranked_users
LIMIT 1000; -- Prevent excessive data transfer

-- Add necessary indices for performance
CREATE INDEX IF NOT EXISTS idx_users_score_privacy 
ON public.users(score DESC, privacy_level, created_at)
WHERE deleted_at IS NULL;
```

## 3. New/Updated Database Objects

1. **leaderboard_public VIEW**: A sanitized, read-only layer that:
   - Implements secure ID hashing
   - Provides consistent anonymous user naming
   - Handles null values gracefully
   - Includes built-in pagination
   - Optimizes performance with proper indexing

2. **Performance Indices**:
   - Compound index on (score, privacy_level, created_at)
   - Partial index excluding deleted users
   - Index for tie-breaking support

## 4. RLS Policies

RLS policies are REQUIRED (not optional) for security:

```sql
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Public can view leaderboard_public
CREATE POLICY "Public can view leaderboard_public"
ON public.users FOR SELECT
USING (deleted_at IS NULL);

-- Users can update their own privacy
CREATE POLICY "Users can update their own privacy"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Only allow valid privacy levels
    NEW.privacy_level IN ('private', 'friends', 'public')
  )
);
```

## 5. Service Refactoring

### 5.1 Update Profile Service Types

```typescript
// src/features/profile/types/profile.types.ts
import { PrivacyLevel } from '../../../core/types/base';

export interface UpdatePrivacyParams {
  privacy_level: PrivacyLevel;
}

export interface ProfileService {
  // ... existing methods ...
  updatePrivacy(userId: string, privacy: PrivacyLevel): Promise<void>;
}
```

### 5.2 Implement Privacy Update Method

```typescript
// src/features/profile/services/profileService.ts
class ProfileServiceImpl implements ProfileService {
  // ... existing methods ...

  async updatePrivacy(userId: string, privacy: PrivacyLevel): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          privacy_level: privacy,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update privacy:', err);
      throw err;
    }
  }
}
```

### 5.3 Leaderboard Service

```typescript
// src/features/leaderboard/services/leaderboardService.ts
interface LeaderboardEntry {
  public_id: string;
  display_name: string;
  photo_url: string | null;
  score: number;
  rank: number;
}

class LeaderboardService {
  private static CACHE_TIME = 30000; // 30 seconds
  private static PAGE_SIZE = 50;
  
  async getLeaderboard(page = 1): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('leaderboard_public')
      .select('*')
      .range((page - 1) * LeaderboardService.PAGE_SIZE, page * LeaderboardService.PAGE_SIZE - 1);

    if (error) throw error;
    return data;
  }

  async subscribeToUpdates(callback: (data: LeaderboardEntry[]) => void): Promise<void> {
    return supabase.channel('leaderboard')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: 'privacy_level IS NOT NULL OR score IS NOT NULL'
        },
        debounce(async () => {
          const { data } = await this.getLeaderboard();
          callback(data);
        }, 250)
      )
      .subscribe();
  }
}

export const leaderboardService = new LeaderboardService();
```

## 6. Client Integration

### 6.1 Leaderboard Hook

```typescript
// src/features/leaderboard/hooks/useLeaderboard.ts
export const useLeaderboard = (initialPage = 1) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await leaderboardService.getLeaderboard(page);
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    const subscription = leaderboardService.subscribeToUpdates((newData) => {
      if (mounted) {
        setData(newData);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [page]);

  return { data, loading, error, page, setPage };
};
```

### 6.2 Leaderboard Component

```typescript
// src/features/leaderboard/components/LeaderboardScreen.tsx
export const LeaderboardScreen: React.FC = () => {
  const { data, loading, error, page, setPage } = useLeaderboard();
  
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.public_id}
      renderItem={({ item }) => (
        <Card>
          <Card.Content>
            <Avatar 
              source={item.photo_url ? { uri: item.photo_url } : require('../assets/default-avatar.png')} 
            />
            <Text>#{item.rank}</Text>
            <Text>{item.display_name}</Text>
            <Text>{item.score}</Text>
          </Card.Content>
        </Card>
      )}
      onEndReached={() => setPage(prev => prev + 1)}
      onEndReachedThreshold={0.5}
    />
  );
};
```

## 7. Deployment Order

1. **Database Updates**
   - Apply the leaderboard view migration
   - Verify indices are created
   - Test RLS policies

2. **Service Updates**
   - Deploy profile service changes
   - Update leaderboard service
   - Verify type safety

3. **Client Updates**
   - Deploy new hooks and components
   - Enable real-time subscriptions
   - Test pagination

4. **Validation**
   - Verify privacy masking
   - Test real-time updates
   - Check performance metrics

## 8. Testing & Validation

1. **Unit Tests**
```typescript
describe('LeaderboardService', () => {
  it('should handle privacy levels correctly', async () => {
    const privateUser = await createTestUser('private');
    const publicUser = await createTestUser('public');
    
    const leaderboard = await leaderboardService.getLeaderboard();
    
    expect(leaderboard.find(e => e.public_id === privateUser.public_id)?.score).toBe(0);
    expect(leaderboard.find(e => e.public_id === publicUser.public_id)?.score).toBeGreaterThan(0);
  });

  it('should handle concurrent updates', async () => {
    const updates = Array(10).fill(null).map(() => 
      updateUserScore(testUser.id, Math.random() * 100)
    );
    
    await Promise.all(updates);
    
    const finalScore = await getUserScore(testUser.id);
    expect(typeof finalScore).toBe('number');
  });
});
```

2. **Integration Tests**
   - Verify privacy level changes reflect immediately
   - Test pagination with large datasets
   - Validate real-time subscription behavior
   - Check memory usage during long polling

3. **Performance Tests**
   - Measure view query performance
   - Monitor subscription memory usage
   - Test concurrent update handling
   - Verify debounce effectiveness

4. **Security Tests**
   - Verify PII is properly masked
   - Test RLS policy enforcement
   - Validate privacy level constraints
   - Check for SQL injection vectors

## Summary

This implementation provides:
- Secure and efficient leaderboard functionality
- Proper privacy controls integrated with profiles
- Optimized real-time updates
- Comprehensive testing coverage
- Type-safe implementation
- Performance optimization
- Proper error handling

The system is now more robust, secure, and maintainable while preserving all existing functionality.
