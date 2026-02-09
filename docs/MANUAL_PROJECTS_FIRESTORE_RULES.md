# Firebase Rules for Manual Projects Collection

## Issue
The `manual_projects` collection doesn't have Firestore security rules, causing "Missing or insufficient permissions" errors.

## Solution

Add the following rules to your Firestore Security Rules in Firebase Console:

```javascript
// Add this to your existing Firestore rules
// Manual Projects - users can only access their own manual projects
match /manual_projects/{projectId} {
  // For reads and updates, check if user owns the project
  allow read, update, delete: if request.auth != null && 
    resource != null && request.auth.uid == resource.data.userId;
  // For creates, check the incoming data
  allow create: if request.auth != null && 
    request.auth.uid == request.resource.data.userId;
}
```

## Complete Updated Firestore Rules

Here's the complete set of rules including manual_projects:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Admin collection - authenticated users can read to check admin status
    match /admins/{adminId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if isAdmin(); // Admins can read all users
    }
    
    // Projects - users can only access their own projects
    match /projects/{projectId} {
      allow read, update, delete: if request.auth != null && 
        resource != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow read: if isAdmin(); // Admins can read all projects
    }
    
    // Manual Projects - users can only access their own manual projects
    match /manual_projects/{projectId} {
      allow read, update, delete: if request.auth != null && 
        resource != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow read: if isAdmin(); // Admins can read all manual projects
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

## Steps to Apply:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click "Firestore Database" in left sidebar
4. Click "Rules" tab
5. Replace all rules with the complete rules above
6. Click "Publish"

## What This Does:

- ✅ Allows authenticated users to create manual projects with their userId
- ✅ Allows users to read/update/delete only their own manual projects
- ✅ Allows admins to read all manual projects
- ✅ Prevents unauthorized access to other users' data

## Test After Applying:

Try creating a manual project again - it should work now!
