# AuthProvider Migration Guide

## Overview

This guide explains the new `AuthProvider` that prevents crashes caused by accessing `session.user` before the session is loaded.

## Key Changes

### 1. Three-State Session Approach

The new `AuthProvider` uses a three-state session approach:
- `undefined` = Still initializing (show loading screen)
- `null` = No session found (redirect to login)
- `Session` = Valid session (show main app)

### 2. New AuthProvider (`contexts/AuthProvider.tsx`)

The new `AuthProvider` provides:
- **Three-state session management**: `undefined | null | Session`
- Safe session loading with `supabase.auth.getSession()`
- Proper loading states to prevent crashes
- Safe session access patterns
- Simplified API with `{ session, user, loading, signIn, signOut, signUp }`
- Better logging for debugging session state
- `isInitialized` state to ensure UI only renders after session is confirmed

### 3. Safe Supabase Client (`lib/supabaseClient.ts`)

A new safe Supabase client that:
- Validates environment variables on initialization
- Handles SSR safely
- Provides consistent error handling

### 4. Safe Session Access Patterns

Replace direct session access:
```typescript
// ❌ Unsafe - can cause crashes
const userId = session.user.id;

// ✅ Safe - prevents crashes
if (session === undefined) return <LoadingScreen />;
if (session === null) return <AuthScreen />;
const userId = session.user.id;
```

## Usage Examples

### Basic Usage with Three-State Approach

```typescript
import { useAuth, useSession } from '@/contexts/AuthProvider';

function MyComponent() {
  const { session, user, loading } = useAuth();
  const { userId } = useSession();

  // Check for initialization state
  if (session === undefined) {
    return <LoadingScreen />;
  }

  // Check for loading state (additional safety)
  if (loading) {
    return <LoadingScreen />;
  }

  // Check for no session
  if (session === null) {
    return <Redirect to="/login" />;
  }

  // Check for valid session
  if (!session?.user || !userId) {
    return <Redirect to="/login" />;
  }

  return <div>Welcome, {user?.name}</div>;
}
```

### Safe Session Access Pattern

```typescript
function SafeSessionComponent() {
  const { session, loading } = useSession();

  // 1. Check initialization state
  if (session === undefined) return <LoadingScreen />;

  // 2. Check loading state
  if (loading) return <LoadingScreen />;

  // 3. Check if session exists
  if (session === null) return <AuthScreen />;

  // 4. Check if session has user
  if (!session?.user) return <AuthScreen />;

  // 5. Now safely access session.user properties
  const userId = session.user.id;
  const userName = session.user.name || 'Unknown User';

  return <div>User: {userName}</div>;
}
```

## Debugging

### Console Logs

The AuthProvider now includes detailed logging:

- `"Session loading..."` - When fetching session from storage
- `"Session null — showing login"` - When no session is found
- `"Session found — navigating to home"` - When session is valid
- `"AppContent: Session still initializing, showing loading screen"` - During initialization
- `"AppContent: Valid session found, rendering app"` - When app content renders

### Debug Components

Use these components to monitor session state:

```typescript
import SessionDebugger from '@/components/SessionDebugger';
import SessionStateTester from '@/components/SessionStateTester';

// Add to any screen for debugging
<SessionDebugger />
<SessionStateTester />
```

## Migration Steps

1. **Update imports**: Replace `@/contexts/AuthContext` with `@/contexts/AuthProvider`
2. **Update hooks**: Use `useAuth()` and `useSession()` from the new provider
3. **Implement three-state checks**: Use the pattern `undefined → null → Session`
4. **Add safe checks**: Implement safe session access patterns in all components
5. **Test thoroughly**: Ensure no crashes occur during app launch
6. **Monitor logs**: Check console for session loading status

## Environment Variables

Ensure these are set in your `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Benefits

- ✅ Prevents crashes on app launch
- ✅ Provides clear loading states
- ✅ Safe session access patterns
- ✅ Better error handling
- ✅ Simplified API
- ✅ SSR-safe Supabase client
- ✅ **NEW**: Three-state session management
- ✅ **NEW**: Detailed logging for debugging
- ✅ **NEW**: Guaranteed initialization before UI renders
- ✅ **NEW**: Clear distinction between initialization and authentication states

## Troubleshooting

If you encounter issues:

1. Check that environment variables are properly set
2. Ensure all session access follows the three-state pattern
3. Verify that loading states are properly handled
4. Check console logs for session loading status
5. Use debug components to monitor session state
6. Ensure you're checking `session === undefined` before `session === null`

## Fixed Issues

- ✅ Session loading is now properly asynchronous
- ✅ UI only renders after session state is confirmed
- ✅ All direct session access replaced with safe patterns
- ✅ Added comprehensive logging for debugging
- ✅ Prevented rendering of components that depend on valid session until confirmed
- ✅ **NEW**: Clear distinction between initialization (undefined) and no session (null)
- ✅ **NEW**: Three-state session management prevents crashes 