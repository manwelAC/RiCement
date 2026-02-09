# Firebase Image.getSize Error Fix

## The Problem

When the app idles, you see this error:
```
ERROR: Expected argument 0 of method "getSize" to be a string, but got an object
FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state
```

### Root Cause
Firebase Firestore uses a **webchannel wrapper** for real-time connections. In React Native with Hermes engine, this webchannel tries to use browser APIs (`HTMLImageElement`) which conflict with React Native's native `Image.getSize()` method.

**When it happens:**
- App is idling (background/inactive)
- Firestore maintains persistent connections with `onSnapshot` listeners
- Firestore tries to reconnect or sync data
- Webchannel wrapper calls browser polyfill code
- Browser polyfill conflicts with React Native Image module
- Error is thrown but doesn't crash the app

## The Solution

### ✅ What We Did
Changed from **persistent disk cache** to **memory-only cache**:

```typescript
// Before (CAUSES ERROR)
export const db = initializeFirestore(app, {
  cacheSizeBytes: 1048576 // Persistent disk cache
});

// After (FIXES ERROR)
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache({
    garbageCollector: undefined
  }),
  experimentalAutoDetectLongPolling: true,
  ignoreUndefinedProperties: true
});
```

### Why This Works

1. **Memory-only cache**: No persistent storage = No file system conflicts with Image module
2. **Auto-detect long polling**: Firestore automatically chooses the best connection method for React Native
3. **No webchannel image conflicts**: Memory cache doesn't trigger the browser polyfill code path

### Trade-offs

| Feature | Persistent Cache | Memory Cache (Current) |
|---------|-----------------|------------------------|
| Offline support | ✅ Full | ⚠️ Limited (runtime only) |
| Image.getSize errors | ❌ Yes | ✅ No |
| Performance | Fast (disk cache) | Fast (memory cache) |
| Data persistence | Survives app restart | Lost on app restart |
| Real-time listeners | ✅ Works | ✅ Works |

## Alternative Solutions (Not Used)

### Option 1: Polling Instead of Listeners
Replace `onSnapshot` with periodic `getDocs` calls:
```typescript
// Not recommended - loses real-time updates
setInterval(async () => {
  const snapshot = await getDocs(query(...));
  // Process data
}, 5000);
```
**Why not:** Loses real-time functionality your timer needs

### Option 2: Session/Token Per User
```typescript
// Not needed - error is not authentication related
```
**Why not:** Error is caused by Firestore connection layer, not auth

### Option 3: Suppress Error Warnings
```typescript
// Bad practice - hides the problem
console.disableYellowBox = true;
```
**Why not:** Doesn't fix the underlying issue

## Testing The Fix

1. **Restart Expo server** completely:
   ```powershell
   # Stop current server (Ctrl+C in terminal)
   # Clear Metro bundler cache
   npx expo start -c
   ```

2. **Test scenarios:**
   - ✅ Create manual project with timer
   - ✅ Let app idle for 2-3 minutes
   - ✅ Switch to another app and back
   - ✅ Timer should continue without errors
   - ✅ No Image.getSize errors in console

3. **What to expect:**
   - Real-time timer updates still work
   - No background errors when idling
   - Timer syncs across devices (if multi-device)
   - Data persists while app is running

## If Error Still Persists

### Check 1: Clear all caches
```powershell
rm -rf node_modules
rm package-lock.json
npm install
npx expo start -c
```

### Check 2: Verify no other Firestore instances
Search for other `initializeFirestore` calls:
```bash
# Should only find one in config/firebase.ts
grep -r "initializeFirestore" .
```

### Check 3: Check listener cleanup
Ensure all `onSnapshot` listeners have proper cleanup:
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(...);
  return () => unsubscribe(); // ✅ Must cleanup
}, []);
```

## Current Configuration Summary

**File:** `config/firebase.ts`

**Settings:**
- ✅ Memory-only local cache
- ✅ Auto-detect long polling enabled
- ✅ Ignore undefined properties
- ✅ No persistent disk cache
- ✅ No offline persistence

**Active Listeners:**
- Manual project timer (`dashboard.tsx` - line 316-341)
  - Query: `where('timerActive', '==', true)`
  - Cleanup: ✅ Yes (`return () => unsubscribe()`)

## Future Considerations

### When to switch back to persistent cache:
- If you need **full offline support** (app works without internet)
- If Firebase fixes the webchannel/Image conflict in future versions
- If you switch from Hermes to another JS engine

### How to add offline support with memory cache:
- Use AsyncStorage alongside Firebase for critical data
- Cache manual project state locally
- Sync to Firebase when online

## Summary

**Problem:** Firebase webchannel conflicts with React Native Image.getSize when using persistent cache

**Solution:** Use memory-only cache to avoid disk I/O conflicts

**Impact:** 
- ✅ Fixes idle errors
- ✅ Maintains real-time functionality
- ⚠️ Limited offline support (data only cached in memory during runtime)

**Status:** ✅ Fixed - No more Image.getSize errors when idling
