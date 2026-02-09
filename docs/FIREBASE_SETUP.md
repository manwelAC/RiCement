# 🔥 Firebase Setup Guide for RiCement

## 📋 **Step 1: Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `ricement-app`
4. Enable Google Analytics (optional)
5. Click "Create project"

## 📋 **Step 2: Enable Services**

### **Authentication:**
1. Go to Authentication → Sign-in method
2. Enable **Email/Password** provider
3. (Optional) Enable Google, Facebook, etc.

### **Firestore Database:**
1. Go to Firestore Database
2. Click "Create database"
3. Start in **test mode** (change rules later)
4. Choose location closest to your users

## 📋 **Step 3: Get Configuration**

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" → Web app
4. Register app name: `RiCement`
5. Copy the configuration object

## 📋 **Step 4: Update Firebase Config**

Replace the config in `config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 📋 **Step 5: Security Rules**

### **Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects - users can only access their own projects
    match /projects/{projectId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Temperature logs - linked to user's projects
    match /temperatureLogs/{logId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // Raw materials - linked to user's projects
    match /rawMaterials/{materialId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // RHB records - linked to user's projects
    match /rhbRecords/{recordId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // Chat sessions - users can only access their own
    match /chatSessions/{sessionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Chat messages - linked to user's sessions
    match /chatMessages/{messageId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)) &&
        get(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)).data.userId == request.auth.uid;
    }
  }
}
```

### **Storage Rules:**
```
Not needed - we're keeping 3D models local in the public folder
```

## 📋 **Step 6: Database Structure**

Your Firestore will have these collections:

```
📁 users
  └── {userId}
      ├── uid: string
      ├── fullName: string
      ├── username: string
      ├── email: string
      ├── createdAt: timestamp
      └── lastLogin: timestamp

📁 projects
  └── {projectId}
      ├── name: string
      ├── blocks: number
      ├── estimatedTime: string
      ├── date: string
      ├── status: string
      ├── userId: string (reference)
      ├── createdAt: timestamp
      └── updatedAt: timestamp

📁 temperatureLogs
  └── {logId}
      ├── temperature: number
      ├── timestamp: timestamp
      ├── projectId: string (reference)
      ├── location: string
      └── deviceId: string

📁 rawMaterials
  └── {materialId}
      ├── name: string
      ├── quantity: number
      ├── unit: string
      ├── costPerUnit: number
      ├── dateAdded: timestamp
      └── projectId: string (reference)

📁 rhbRecords
  └── {recordId}
      ├── quantity: number
      ├── productionDate: timestamp
      ├── projectId: string (reference)
      ├── qualityGrade: string
      └── weight: number

📁 chatSessions
  └── {sessionId}
      ├── userId: string (reference)
      ├── startTime: timestamp
      ├── endTime: timestamp
      └── isActive: boolean

📁 chatMessages
  └── {messageId}
      ├── sessionId: string (reference)
      ├── message: string
      ├── sender: string ('user' | 'ai')
      ├── timestamp: timestamp
      └── aiResponse: string
```

## 📋 **Step 7: Migration Strategy**

To migrate from AsyncStorage to Firebase:

1. **Backup existing data:**
   ```bash
   # Export current AsyncStorage data
   # (This will be handled automatically by the migration function)
   ```

2. **Run migration:**
   ```typescript
   import { firebaseService } from './services/firebaseService';
   
   // This will sync existing local data to Firebase
   await firebaseService.syncLocalToFirebase();
   ```

3. **Test both systems:**
   - Firebase will be primary
   - AsyncStorage will be backup/offline support

## 📋 **Step 8: Benefits You'll Get**

✅ **Real-time sync** - Data updates across all devices instantly  
✅ **Multi-user support** - Multiple users can have separate data  
✅ **Cloud backup** - Never lose data again  
✅ **Offline support** - Works offline, syncs when online  
✅ **Authentication** - Secure user accounts  
✅ **Scalability** - Handles thousands of users  
✅ **3D Models** - Kept locally for fast loading (no storage costs!)  

## 🚀 **Next Steps:**

1. Set up Firebase project with the steps above
2. Update the config file with your credentials
3. Test authentication first
4. Gradually migrate features from AsyncStorage to Firebase
5. Set up proper security rules
6. Deploy and test!

## 🔧 **Troubleshooting:**

**Common Issues:**
- ❌ **Permission denied**: Check Firestore security rules
- ❌ **Network error**: Check internet connection and Firebase config
- ❌ **Auth errors**: Verify authentication setup and user permissions
- ✅ **Offline mode**: App automatically falls back to AsyncStorage when offline

## 📱 **Usage in Your App:**

```typescript
// In your components, replace AsyncStorage calls with:
import { firebaseService, authService } from '@/services';

// Instead of AsyncStorage.getItem('projects')
const projects = await firebaseService.getProjects(userId);

// Instead of AsyncStorage.setItem('projects', data)
await firebaseService.createProject(projectData);
```

Ready to upgrade to Firebase? Let's implement it step by step! 🚀