# Complete Firestore Security Rules with Admin Access

## Updated Rules for Admin User Management

Copy and paste these rules into Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Users collection - Users can read/write their own, Admins can manage all
    match /users/{userId} {
      // Users can read and update their own profile
      allow read: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      
      // Admins can read, update, and delete any user
      allow read, update, delete: if isAdmin();
      
      // Anyone can create a user profile (signup)
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins collection - Only admins can read
    match /admins/{adminId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Projects - Users can CRUD their own, Admins can read all
    match /projects/{projectId} {
      allow read: if request.auth != null && 
        (resource != null && request.auth.uid == resource.data.userId || isAdmin());
      allow update, delete: if request.auth != null && 
        resource != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Manual Projects - Users can CRUD their own, Arduino can read all (public read)
    match /manual_projects/{projectId} {
      // Public read access for Arduino hardware
      allow read: if true;
      
      // Users can update/delete their own projects
      allow update, delete: if request.auth != null && 
        resource != null && request.auth.uid == resource.data.userId;
      
      // Users can create their own projects
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      
      // Admins can manage all projects
      allow read, write: if isAdmin();
    }
    
    // Temperature logs - linked to user's projects  
    match /temperatureLogs/{logId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
      allow read: if isAdmin();
    }
    
    // Raw materials - linked to user's projects
    match /rawMaterials/{materialId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
      allow read: if isAdmin();
    }
    
    // RHB records - linked to user's projects
    match /rhbRecords/{recordId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
      allow read: if isAdmin();
    }
    
    // Chat sessions - users can only access their own
    match /chatSessions/{sessionId} {
      allow read, update, delete: if request.auth != null && 
        resource != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow read: if isAdmin();
    }
    
    // Chat messages - linked to user's sessions
    match /chatMessages/{messageId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)) &&
        get(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/chatSessions/$(request.resource.data.sessionId)) &&
        get(/databases/$(database)/documents/chatSessions/$(request.resource.data.sessionId)).data.userId == request.auth.uid;
      allow read: if isAdmin();
    }
  }
}
```

## Key Changes:

### 1. Admin Helper Function
```javascript
function isAdmin() {
  return request.auth != null && 
    exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}
```
This checks if the authenticated user has a document in the `admins` collection.

### 2. Users Collection Rules
- **Users**: Can read and update their own profile
- **Admins**: Can read, update, and delete ANY user
- **Signup**: Anyone authenticated can create their own user document

### 3. Admin Collection Rules
- All authenticated users can read (to check admin status)
- Only admins can write

### 4. All Other Collections
- Added `allow read: if isAdmin()` to let admins view all data

## How to Apply:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project: `ricement-app`
3. Go to **Firestore Database** → **Rules** tab
4. Replace the entire content with the rules above
5. Click **Publish**

## Testing:

After applying the rules:
1. Log in to admin panel with an admin account
2. Try to edit a user → Should work ✅
3. Try to delete a user → Should work ✅
4. Try to toggle user status → Should work ✅

## Security Notes:

✅ **Regular users**: Can only manage their own data
✅ **Admins**: Can manage all users and view all data
✅ **Arduino**: Can read `manual_projects` without authentication
✅ **Signup**: New users can create their profile
✅ **Authentication**: All operations require login (except Arduino reads)

## Current Admin Check:

Your code checks admin status using:
```typescript
const adminDoc = await getDoc(doc(db, 'admins', user.uid));
if (!adminDoc.exists()) {
  throw new Error('Unauthorized');
}
```

This matches the `isAdmin()` function in the rules perfectly! ✅
