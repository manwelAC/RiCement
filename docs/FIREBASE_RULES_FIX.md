# Firebase Rules Fix for Authentication Issues

## Problem
Your Firestore rules require authentication, but the rule for creating projects has an issue. The rule is checking `resource.data.userId` for CREATE operations, but `resource` is null during CREATE operations.

## Solution

### 1. Enable Anonymous Authentication (Required for testing)
1. Go to Firebase Console → Authentication
2. Click "Sign-in method" tab  
3. Click "Anonymous" → Enable → Save

### 2. Fix Firestore Rules
Replace your current rules with these corrected rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects - CORRECTED RULES
    match /projects/{projectId} {
      // For reads and updates, check if user owns the project
      allow read, update, delete: if request.auth != null && 
        resource != null && request.auth.uid == resource.data.userId;
      // For creates, check the incoming data
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Temperature logs - linked to user's projects  
    match /temperatureLogs/{logId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // Raw materials - linked to user's projects
    match /rawMaterials/{materialId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // RHB records - linked to user's projects
    match /rhbRecords/{recordId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // Chat sessions - users can only access their own
    match /chatSessions/{sessionId} {
      allow read, update, delete: if request.auth != null && 
        resource != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Chat messages - linked to user's sessions
    match /chatMessages/{messageId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)) &&
        get(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/chatSessions/$(request.resource.data.sessionId)) &&
        get(/databases/$(database)/documents/chatSessions/$(request.resource.data.sessionId)).data.userId == request.auth.uid;
    }
  }
}
```

## Key Changes Made:

1. **Anonymous Authentication**: Enabled for testing purposes
2. **Separate Create Rules**: Create operations now use `request.resource.data` instead of `resource.data`
3. **Resource Null Check**: Added `resource != null` checks for read/update operations
4. **Consistent Patterns**: Applied the same pattern to all collections

## Testing Steps:

1. Update the rules in Firebase Console
2. Enable Anonymous Authentication
3. Run the Firebase test in your app
4. The test will now sign in anonymously and test all operations

## Production Security:

- Anonymous users can only access their own data
- All operations require authentication
- Users cannot access other users' projects or data
- Each collection is properly scoped to user ownership

Your rules are now secure and will work with both anonymous (testing) and regular (production) users!