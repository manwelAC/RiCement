# Firebase Authentication Setup - Step by Step Fix

## Current Error Analysis

**Error**: `auth/admin-restricted-operation` and `Missing or insufficient permissions`

**Root Cause**: 
1. Email/Password authentication not enabled in Firebase Console
2. Firestore rules have a bug for CREATE operations

---

## Step-by-Step Solution

### 1. Enable Email/Password Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your `ricement-app` project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Email/Password**
5. **Enable** the first option (Email/Password)
6. Click **Save**

### 2. Fix Firestore Rules (Critical Bug Fix)
The current rule has a bug - for CREATE operations, you can't check `resource.data.userId` because `resource` is null during creation.

**Replace your current Firestore rules with:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects - FIXED RULES
    match /projects/{projectId} {
      // For reads and updates, check if user owns the project  
      allow read, update, delete: if request.auth != null && 
        resource != null && request.auth.uid == resource.data.userId;
      // For creates, check the incoming data (resource is null during create)
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Temperature logs - FIXED RULES
    match /temperatureLogs/{logId} {
      allow read, update, delete: if request.auth != null && 
        resource != null &&
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // Raw materials - FIXED RULES
    match /rawMaterials/{materialId} {
      allow read, update, delete: if request.auth != null && 
        resource != null &&
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // RHB records - FIXED RULES
    match /rhbRecords/{recordId} {
      allow read, update, delete: if request.auth != null && 
        resource != null &&
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // Chat sessions - FIXED RULES
    match /chatSessions/{sessionId} {
      allow read, update, delete: if request.auth != null && 
        resource != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Chat messages - FIXED RULES
    match /chatMessages/{messageId} {
      allow read, update, delete: if request.auth != null && 
        resource != null &&
        exists(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)) &&
        get(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/chatSessions/$(request.resource.data.sessionId)) &&
        get(/databases/$(database)/documents/chatSessions/$(request.resource.data.sessionId)).data.userId == request.auth.uid;
    }
  }
}
```

### 3. Apply the Rules
1. In Firebase Console → **Firestore Database** → **Rules**
2. Replace the entire rules content with the above code
3. Click **Publish**

### 4. Test the Connection
1. In your app, go to Dashboard
2. Tap **"Test Firebase"** button
3. The test will now:
   - Create a temporary test user account
   - Test Firestore read/write operations
   - Clean up test data
   - Show success message

---

## What Was Fixed

1. **Authentication Method**: Now uses email/password instead of anonymous auth
2. **Create vs Read Rules**: Separated CREATE rules (use `request.resource.data`) from READ/UPDATE/DELETE rules (use `resource.data`)
3. **Null Checks**: Added `resource != null` checks to prevent errors during CREATE operations
4. **Better Error Messages**: App now provides specific instructions for each type of error

---

## Security Notes

✅ **Your rules are secure:**
- Users can only access their own data
- All operations require authentication
- Projects are properly scoped to owners
- Cross-references are validated

✅ **Production Ready:**
- No overly permissive rules
- Proper data isolation
- User ownership validation