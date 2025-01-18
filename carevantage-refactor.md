# CareVantage App Refactoring Guide

## Core Principle
The `src/health-metrics/` directory is the source of truth. All duplicate or conflicting functionality outside this directory should be consolidated or removed.

## Phase 1: Authentication Consolidation

### Target Files to Remove
```
src/core/auth/               -> Use src/health-metrics/core/auth/
src/features/auth/           -> Use src/health-metrics/components/SignInScreen.tsx
src/features/authUI/         -> Use src/health-metrics/components/SignInScreen.tsx
```

### Authentication Refactoring Steps
1. Migrate to single AuthContext:
```typescript
// REMOVE: src/core/auth/contexts/AuthContext.tsx
// USE: src/health-metrics/contexts/AuthContext.tsx

// Update all imports to use:
import { useAuth } from '@/health-metrics/contexts/AuthContext';
```

2. Consolidate authentication screens:
```typescript
// REMOVE: src/features/authUI/components/LoginScreen.tsx
// REMOVE: src/features/authUI/components/RegisterScreen.tsx
// USE: src/health-metrics/components/SignInScreen.tsx

// Update navigation references in:
src/navigation/AuthStack.tsx -> Use src/health-metrics/navigation/SimpleNavigator.tsx
```

## Phase 2: Health Provider Integration

### Target Files to Remove
```
src/core/contexts/health/    -> Use src/health-metrics/contexts/HealthDataContext.tsx
src/core/constants/metrics.ts -> Consolidate with health-metrics constants
```

### Health Provider Refactoring Steps
1. Consolidate health provider factory:
```typescript
// REMOVE: src/core/contexts/health/providers/HealthProviderFactory.ts
// USE: src/health-metrics/providers/HealthProviderFactory.ts

// Update imports to use:
import { HealthProviderFactory } from '@/health-metrics/providers/HealthProviderFactory';
```

2. Remove duplicate provider implementations:
```typescript
// REMOVE: src/core/contexts/health/providers/apple/AppleHealthProvider.ts
// REMOVE: src/core/contexts/health/providers/google/GoogleHealthProvider.ts
// USE: 
// - src/health-metrics/providers/apple/AppleHealthProvider.ts
// - src/health-metrics/providers/google/GoogleHealthProvider.ts
```

## Phase 3: Navigation Structure

### Target Files to Consolidate
```
src/navigation/             -> Merge with src/health-metrics/navigation/
```

### Navigation Refactoring Steps
1. Adopt simplified navigation structure:
```typescript
// REMOVE: src/navigation/AppStack.tsx
// REMOVE: src/navigation/AuthStack.tsx
// USE: src/health-metrics/navigation/SimpleNavigator.tsx

// Update App.tsx to use:
import { SimpleNavigator } from '@/health-metrics/navigation/SimpleNavigator';
```

2. Consolidate navigation types:
```typescript
// REMOVE: src/navigation/types.ts
// USE: src/health-metrics/navigation/types.ts
```

## Phase 4: Component Structure

### Target Files to Review
```
src/components/common/atoms/metrics/ -> Compare with src/health-metrics/components/
```

### Component Refactoring Steps
1. Evaluate metric components for consolidation:
```typescript
// Review and potentially remove:
src/components/common/atoms/metrics/MetricProgress.tsx
src/components/common/atoms/metrics/MetricProgressWheel.tsx
// If duplicating functionality from:
src/health-metrics/components/RingProgress.tsx
```

2. Update component imports:
```typescript
// Before:
import { MetricProgress } from '@/components/common/atoms/metrics/MetricProgress';
// After:
import { RingProgress } from '@/health-metrics/components/RingProgress';
```

## Phase 5: Error Handling

### Target Files to Consolidate
```
src/core/error/            -> Use src/health-metrics/core/error/
src/utils/error/           -> Consolidate with health-metrics error handling
```

### Error Handling Steps
1. Migrate to single error boundary:
```typescript
// REMOVE: src/core/error/ErrorBoundary.tsx
// USE: src/health-metrics/core/error/ErrorBoundary.tsx
```

2. Update error imports:
```typescript
// Update all error boundary imports to:
import { ErrorBoundary } from '@/health-metrics/core/error/ErrorBoundary';
```

## Phase 6: Database and Storage

### Target Files to Remove
```
src/core/database/         -> Remove in favor of direct Supabase client
src/core/storage/          -> Remove redundant storage service
src/core/supabase/         -> Use src/utils/supabase.ts
```

### Database Refactoring Steps
1. Remove database abstraction layer:
```typescript
// REMOVE: src/core/database/BaseDAO.ts
// REMOVE: src/core/database/ConnectionPool.ts
// REMOVE: src/core/database/TransactionManager.ts

// Use direct Supabase client:
import { supabase } from '@/utils/supabase';
```

## Testing Strategy

For each phase:
1. Create a feature branch
2. Implement changes
3. Verify core functionality:
   - Authentication flow
   - Health data integration
   - Navigation
   - Error handling
4. Run existing tests
5. Add migration tests
6. Perform platform-specific testing:
   - iOS: HealthKit integration
   - Android: Health Connect integration

## Verification Checklist

After each phase:
- [ ] All tests pass
- [ ] No duplicate code exists
- [ ] Navigation flows correctly
- [ ] Error handling works
- [ ] Health data integration functions
- [ ] Platform-specific features work
- [ ] No regressions in core functionality
- [ ] Documentation updated

## Rollback Plan

For each phase:
1. Maintain feature toggles for new changes
2. Keep old code paths until verification complete
3. Document rollback procedures
4. Monitor error rates after deployment

## Post-Refactor Cleanup

1. Remove unused dependencies
2. Update documentation
3. Clean up import paths
4. Remove feature toggles
5. Archive removed code (for reference)

## Success Criteria

- Single source of truth in `src/health-metrics/`
- No duplicate functionality
- Improved type safety
- Cleaner navigation
- Consistent error handling
- Maintained platform compatibility
- Passing test suite
- Updated documentation
