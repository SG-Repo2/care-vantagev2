# CareVantage Implementation Analysis

## 1. Authentication & Profile Management Discrepancies

### 1.1 Duplicate Auth State Management
**Issue**: Multiple components manage auth state independently
- `src/core/auth/useAuth.ts`
- `src/health-metrics/contexts/AuthContext.tsx`
- `src/health-metrics/components/SignInScreen.tsx`

**Impact**: 
- Potential race conditions
- Inconsistent auth state
- Redundant API calls

**Solution**:
```typescript
// Consolidate auth logic into AuthContext.tsx and remove duplicate state management
// Other components should use useAuth() hook exclusively

// In SignInScreen.tsx
export const SignInScreen = () => {
  const { signIn, status, error } = useAuth();
  // Remove local auth state management
  // Use centralized auth methods
};

// In useAuth.ts
// Remove this hook entirely and use AuthContext.tsx
```

### 1.2 Profile Service Initialization
**Issue**: Profile initialization happens in multiple places
- AuthContext.tsx: `initializeUserServices`
- SignInScreen.tsx: `initializeUser`
- useAuth.ts: `ensureUserProfile`

**Solution**:
```typescript
// Centralize in AuthContext.tsx
const initializeUserServices = async (currentUser: User) => {
  try {
    const profile = await profileService.getProfile(currentUser.id);
    if (!profile) {
      await profileService.createProfile(currentUser);
    }
    await initializeHealthProvider();
    return true;
  } catch (err) {
    handleInitializationError(err);
    return false;
  }
};
```

## 2. Health Metrics & Leaderboard Redundancy

### 2.1 Score Update Logic Duplication
**Issue**: Score updates happen in multiple services
- `profileService.updateScore`
- `leaderboardService.updateScore`

**Impact**:
- Potential data inconsistency
- Multiple database writes
- Race conditions

**Solution**:
```typescript
// Create a centralized scoring service
// src/features/scoring/services/scoringService.ts

export class ScoringService {
  private static instance: ScoringService;
  
  static getInstance(): ScoringService {
    if (!this.instance) {
      this.instance = new ScoringService();
    }
    return this.instance;
  }

  async updateScore(userId: string, newScore: number): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({
        score: newScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }

  async calculateScore(metrics: HealthMetricsUpdate): number {
    // Centralized score calculation logic
    return calculatedScore;
  }
}

export const scoringService = ScoringService.getInstance();
```

### 2.2 Leaderboard Subscription Management
**Issue**: Leaderboard updates don't properly handle health metric changes

**Solution**:
```typescript
// Update LeaderboardService
class LeaderboardService {
  async subscribeToUpdates(callback: (data: LeaderboardEntry[]) => void): Promise<{ unsubscribe: () => void }> {
    const channel = supabase.channel('leaderboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_metrics',
          filter: 'daily_score IS NOT NULL'
        },
        async () => {
          const updated = await this.getLeaderboard(1);
          callback(updated);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => channel.unsubscribe()
    };
  }
}
```

## 3. Error Handling & State Updates

### 3.1 Inconsistent Error Handling
**Issue**: Different error handling patterns across components

**Solution**:
```typescript
// Create centralized error handling utility
// src/utils/error/ErrorHandler.ts

export class ErrorHandler {
  static handle(error: unknown, context: string): Error {
    console.error(`[${context}] Error:`, error);
    
    if (error instanceof Error) {
      return error;
    }
    
    return new Error(
      typeof error === 'string' ? error : 'An unexpected error occurred'
    );
  }

  static async handleAsync<T>(
    promise: Promise<T>,
    context: string
  ): Promise<[T | null, Error | null]> {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      return [null, this.handle(error, context)];
    }
  }
}
```

### 3.2 Profile Update Race Conditions
**Issue**: Multiple components updating profile simultaneously

**Solution**:
```typescript
// Add request coalescing to ProfileService
class ProfileService {
  private updateQueue = new Map<string, Promise<void>>();

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const existing = this.updateQueue.get(userId);
    if (existing) {
      await existing;
    }

    const updatePromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } finally {
        this.updateQueue.delete(userId);
      }
    })();

    this.updateQueue.set(userId, updatePromise);
    return updatePromise;
  }
}
```

## 4. Implementation Priorities

1. **High Priority**
   - Consolidate auth state management
   - Centralize profile initialization
   - Implement request coalescing for profile updates

2. **Medium Priority**
   - Create centralized scoring service
   - Improve leaderboard subscription handling
   - Standardize error handling

3. **Low Priority**
   - Add comprehensive logging
   - Implement performance monitoring
   - Add retry strategies for non-critical operations

## 5. Testing Strategy

```typescript
// Example test structure for critical paths

describe('Profile Management', () => {
  test('handles concurrent profile updates correctly', async () => {
    const updates = Array(5).fill(null).map(() => 
      profileService.updateProfile(testUser.id, { score: Math.random() * 100 })
    );
    
    const results = await Promise.all(updates);
    const finalScore = results[results.length - 1].score;
    
    expect(results.every(r => r.id === testUser.id)).toBe(true);
    expect(results[0].updated_at).not.toBe(results[results.length - 1].updated_at);
  });
});

describe('Auth Flow', () => {
  test('initializes user services in correct order', async () => {
    const events: string[] = [];
    
    // Mock services to track initialization order
    jest.spyOn(profileService, 'createProfile').mockImplementation(async () => {
      events.push('profile_created');
      return mockProfile;
    });
    
    jest.spyOn(HealthProviderFactory, 'createProvider').mockImplementation(async () => {
      events.push('health_provider_initialized');
      return mockProvider;
    });

    await initializeUserServices(mockUser);
    
    expect(events).toEqual([
      'profile_created',
      'health_provider_initialized'
    ]);
  });
});
```

## 6. Migration Steps

1. **Phase 1: Auth Consolidation**
   - Move all auth logic to AuthContext
   - Update components to use useAuth hook
   - Add comprehensive error handling

2. **Phase 2: Service Optimization**
   - Implement ScoringService
   - Update ProfileService with request coalescing
   - Improve LeaderboardService subscriptions

3. **Phase 3: Testing & Validation**
   - Add integration tests for critical paths
   - Validate concurrent operations
   - Test error scenarios

## 7. Success Metrics

- Zero auth state inconsistencies
- No duplicate profile updates
- Reduced API calls
- Improved error handling coverage
- Consistent leaderboard updates
- Better test coverage for critical paths

This implementation guide addresses the major discrepancies and redundancies while providing a clear path forward for improvements. The changes are designed to be implemented incrementally while maintaining backward compatibility.
