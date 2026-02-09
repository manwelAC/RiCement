# RiCement Architecture Quick Reference Guide

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Key Technologies](#key-technologies)
3. [Directory Structure](#directory-structure)
4. [Main Services](#main-services)
5. [Common Operations](#common-operations)
6. [Deployment Checklist](#deployment-checklist)
7. [Troubleshooting](#troubleshooting)

---

## System Overview

**RiCement** is a cement manufacturing management platform with:
- ✅ Mobile app (iOS/Android) via Expo
- ✅ Web admin panel (Vercel)
- ✅ Real-time collaboration
- ✅ IoT sensor integration (Arduino)
- ✅ AI chat assistant (Google Gemini)
- ✅ Multi-company support with role-based access

**Architecture Pattern**: Client → Services → Firebase (Firestore, Realtime DB, Storage)

---

## Key Technologies

### Frontend Stack
| Technology | Purpose | Version |
|-----------|---------|---------|
| React Native | Mobile UI | 0.81.5 |
| Expo | Cross-platform framework | 54.0.31 |
| Expo Router | Navigation | 6.0.21 |
| TypeScript | Type safety | - |
| React Context | State management | - |

### Backend & Services
| Service | Purpose | Status |
|---------|---------|--------|
| Firebase Auth | User authentication | ✅ Active |
| Firestore | NoSQL database | ✅ Active |
| Realtime DB | Quick status updates | ✅ Active |
| Cloud Storage | File/image storage | ✅ Active |
| Google Gemini | AI chat | ✅ Integrated |
| Firebase REST API | Arduino integration | ✅ Active |

### Deployment
| Platform | Purpose | Command |
|----------|---------|---------|
| EAS Build | Mobile builds | `npm run build:android` |
| Vercel | Web hosting | Auto-deploy on git push |
| Firebase Console | Data management | Manual configuration |

---

## Directory Structure

```
RiCement/
├── app/                          # Expo Router routes
│   ├── (tabs)/                   # Mobile routes
│   ├── (admin)/                  # Web admin routes
│   └── [auth routes]             # Shared auth
├── components/                   # Reusable UI components
│   ├── admin/                    # Admin components
│   ├── mobile/                   # Mobile components
│   └── ui/                       # Generic UI
├── services/                     # Business logic
│   ├── authService.ts            # 🔐 Authentication
│   ├── firebaseService.ts        # 📊 Database operations
│   └── adminService.ts           # 👨‍💼 Admin operations
├── config/                       # Configuration
│   └── firebase.ts               # Firebase init
├── contexts/                     # React Context
├── hooks/                        # Custom hooks
├── types/                        # TypeScript interfaces
├── constants/                    # App constants
├── assets/                       # Images, fonts
├── docs/                         # Documentation ← YOU ARE HERE
│   ├── SYSTEM_ARCHITECTURE.md    # Complete overview
│   ├── ARCHITECTURE_DIAGRAMS.md  # Visual diagrams
│   ├── COMPONENT_HIERARCHY.md    # Component structure
│   └── [other docs]
└── scripts/                      # Utility scripts
```

---

## Main Services

### 1. **AuthService** (`services/authService.ts`)
Handles user authentication and authorization.

**Key Methods**:
```typescript
// Registration
await authService.signUp(email, password, fullName, username);

// Login
await authService.login(email, password);

// Logout
await authService.logout();

// Check role
const isAdmin = await authService.checkAdminStatus(uid);

// Get current user
const user = await authService.getCurrentUser();

// Password reset
await authService.resetPassword(email);
```

**Data Stored**:
- Firestore: `users/{uid}`
- Firebase Auth: User credentials

---

### 2. **FirebaseService** (`services/firebaseService.ts`)
Handles all database operations: projects, temperature logs, inventory, chat.

**Project Operations**:
```typescript
// Create
await firebaseService.createProject({
  name: "Project A",
  blocks: 100,
  estimatedTime: "2 hours",
  date: "2024-01-15"
});

// Read
const projects = await firebaseService.getProjects(userId);

// Update
await firebaseService.updateProject(projectId, { status: "Pouring" });

// Delete
await firebaseService.deleteProject(projectId);

// Collaboration
await firebaseService.addCollaboratorsToProject(
  projectId,
  [userId1, userId2],
  { userId1: {fullName, email}, userId2: {fullName, email} }
);
```

**Temperature Monitoring**:
```typescript
await firebaseService.createTemperatureLog({
  temperature: 65.5,
  projectId: "proj123",
  location: "tank1",
  deviceId: "arduino_01"
});

const logs = await firebaseService.getTemperatureLogs(projectId);
```

**Inventory Management**:
```typescript
// Raw Materials
await firebaseService.createRawMaterial({
  name: "Cement Powder",
  quantity: 100,
  unit: "kg",
  costPerUnit: 50,
  projectId
});

// RHB Records
await firebaseService.createRHBRecord({
  quantity: 50,
  productionDate: new Date(),
  projectId,
  qualityGrade: "A",
  weight: 500
});
```

**AI Chat**:
```typescript
const sessionId = await firebaseService.createChatSession(userId);
await firebaseService.addChatMessage(sessionId, "What is RiCement?");
const messages = await firebaseService.getChatMessages(sessionId);
```

---

### 3. **AdminService** (`services/adminService.ts`)
Handles admin-specific operations: user management, company management, analytics.

**User Management**:
```typescript
// Create admin
await adminService.createAdminUser(email, password, fullName);

// List users
const users = await adminService.getCompanyUsersList(companyId);

// Delete user
await adminService.deleteAdminUser(uid);

// Update role
await adminService.updateAdminRole(uid, "superadmin");
```

**Company Management**:
```typescript
// Create
await adminService.createCompany({
  name: "Cement Co.",
  description: "Cement manufacturer"
});

// Get
const company = await adminService.getCompany(companyId);

// Update
await adminService.updateCompany(companyId, { name: "Updated Name" });
```

**Analytics**:
```typescript
const metrics = await adminService.getCompanyMetrics(companyId);
// Returns: { totalProjects, completedProjects, totalBlocks, avgTime, ... }

const activity = await adminService.getUserActivity(userId, dateRange);
```

**Complaints**:
```typescript
const complaints = await adminService.getComplaints("open");
await adminService.updateComplaintStatus(complaintId, "resolved");
await adminService.assignComplaintToUser(complaintId, assigneeId);
```

---

## Common Operations

### Creating a Project (User)
```
User opens process.tsx
  ↓
Fills form (name, blocks, time)
  ↓
firebaseService.createProject(data)
  ↓
Firestore creates document with auto-ID
  ↓
Real-time listener triggers
  ↓
Project appears in dashboard.tsx
```

### Adding Collaborators
```
User clicks "Add Collaborators"
  ↓
Select users from company list
  ↓
firebaseService.addCollaboratorsToProject(projectId, userIds, details)
  ↓
Firestore updates collaborators array
  ↓
Real-time listeners trigger for all users
  ↓
All collaborators see project in dashboard
```

### Monitoring Temperature
```
Arduino sensor → HTTP POST → Firestore REST API
  ↓
Creates temperatureLogs document
  ↓
Real-time listener on mobile app
  ↓
TemperatureChart updates
  ↓
User sees live temperature graph
```

### Admin Views Analytics
```
Admin opens dashboard.tsx
  ↓
adminService.getCompanyMetrics(companyId)
  ↓
Query Firestore for multiple data:
  - Projects count
  - Completion rates
  - User activities
  - Revenue metrics
  ↓
Process data (calculate KPIs)
  ↓
AnalyticsCharts component renders
```

### AI Chat Interaction
```
User types message
  ↓
firebaseService.addChatMessage()
  ↓
Call Google Gemini API
  ↓
Receive response
  ↓
Update chatMessages document
  ↓
Real-time listener updates UI
  ↓
User sees AI response
```

---

## Firestore Data Structure

### Collections Overview
```
firebaseapp/
├── users/                    # User profiles
│   └── {uid}
│       ├── email: string
│       ├── fullName: string
│       ├── role: 'user' | 'admin' | 'superadmin'
│       └── createdAt: timestamp
│
├── projects/                 # User projects
│   └── {projectId}
│       ├── name: string
│       ├── status: 'Queue' | 'Pouring' | ...
│       ├── collaborators: []  # User IDs
│       └── createdAt: timestamp
│
├── temperatureLogs/          # Sensor readings
│   └── {logId}
│       ├── temperature: number
│       ├── projectId: string
│       └── timestamp: timestamp
│
├── rawMaterials/             # Inventory
│   └── {materialId}
│       ├── name: string
│       ├── quantity: number
│       └── projectId: string
│
├── chatSessions/             # AI chat
│   └── {sessionId}
│       ├── userId: string
│       ├── startTime: timestamp
│       └── isActive: boolean
│
└── admins/                   # Admin users
    └── {uid}
        ├── email: string
        ├── role: 'admin' | 'superadmin'
        └── companyId: string
```

---

## Real-Time Data Sync

### Subscribe to Projects
```typescript
import { onSnapshot, query, collection, where } from 'firebase/firestore';
import { db } from '@/config/firebase';

useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'projects'), where('userId', '==', currentUser.uid)),
    (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projects);
    }
  );

  return () => unsubscribe(); // Cleanup
}, [currentUser.uid]);
```

### Subscribe to Temperature
```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(
    query(collection(db, 'temperatureLogs'), where('projectId', '==', projectId)),
    (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data());
      setTemperatureData(logs);
    }
  );

  return () => unsubscribe();
}, [projectId]);
```

---

## Firebase Security Rules Summary

```
// Users can only access their own data
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Project ownership
match /projects/{projectId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.userId ||
     resource.data.userId in request.auth.token.collaborators);
  allow write: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}

// Admin access
match /admins/{adminId} {
  allow read: if request.auth.uid == adminId;
  allow write: if isAdmin() && canAccessUser(adminId);
}
```

---

## Environment Variables

### Required `.env` File
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### For Vercel (Admin Web Panel)
Set same variables in Vercel Dashboard → Settings → Environment Variables

---

## Deployment Checklist

### Pre-Deployment
- [ ] Update version in `package.json`
- [ ] Run `npm lint` - check for errors
- [ ] Test on iOS/Android (or web)
- [ ] Verify Firebase rules are correct
- [ ] Check environment variables are set
- [ ] Update documentation

### Mobile App Deployment
```bash
# Build for Android
npm run build:android:prod

# Build for iOS
npm run build:ios:prod

# Submit to stores (optional)
eas submit
```

### Web Admin Panel Deployment
```bash
# Push to GitHub master branch
git add .
git commit -m "v1.2.3: New features"
git push origin master

# Vercel auto-deploys on push
# Verify deployment in Vercel dashboard
```

### Post-Deployment
- [ ] Test on all platforms
- [ ] Check Firebase Dashboard for errors
- [ ] Monitor performance metrics
- [ ] Update version in docs
- [ ] Announce to team

---

## Troubleshooting

### Firebase Connection Issues
**Problem**: "Permission denied" or "Authentication required"

**Solution**:
1. Check Firestore security rules
2. Verify Firebase credentials in `.env`
3. Ensure user is authenticated
4. Check Firestore rules match your use case
5. See `docs/FIREBASE_AUTH_FIX.md`

### Real-Time Listener Not Updating
**Problem**: Component doesn't re-render when data changes

**Solution**:
1. Check `unsubscribe()` is called on unmount
2. Verify `onSnapshot` query is correct
3. Check Firestore rules allow read access
4. Ensure `setState` is being called
5. Check browser console for errors

### Arduino Not Posting to Firestore
**Problem**: Temperature logs not appearing

**Solution**:
1. Check Arduino WiFi connection
2. Verify Firebase API key is correct
3. Check Firestore rules allow Arduino writes
4. Verify Arduino is posting to correct collection
5. Check Arduino logs in serial monitor

### Admin Panel Not Showing Data
**Problem**: Admin dashboard is blank

**Solution**:
1. Verify user has admin role
2. Check Firestore security rules for admin access
3. Verify companyId is set correctly
4. Check browser console for errors
5. Review `adminService` methods

### Offline Data Not Syncing
**Problem**: Local changes don't sync when online

**Solution**:
1. Check `firebaseService.syncLocalDataToFirebase()`
2. Verify AsyncStorage has data
3. Check network connectivity
4. Review sync logic in service
5. Check Firestore writes are allowed

---

## Quick Commands

```bash
# Development
npm start                    # Start Expo dev server
npm run web                  # Start web version
npm run admin               # Start admin panel

# Testing & Linting
npm run lint                # Check code style

# Building
npm run build:android       # Android APK
npm run build:ios          # iOS IPA
npm run build:web          # Web build

# Utilities
npm run setup-admin         # Create admin user
npm run reset-project       # Reset project data

# Git
git push origin master      # Deploy to Vercel (web)
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `config/firebase.ts` | Firebase configuration |
| `services/authService.ts` | Authentication logic |
| `services/firebaseService.ts` | Database operations |
| `services/adminService.ts` | Admin operations |
| `UPDATED_FIRESTORE_RULES.tsx` | Security rules |
| `app/_layout.tsx` | Root app layout |
| `app/(tabs)/_layout.tsx` | Mobile tab navigation |
| `app/(admin)/_layout.tsx` | Admin navigation |

---

## Documentation Files

Located in `docs/`:

| Document | Content |
|----------|---------|
| `SYSTEM_ARCHITECTURE.md` | Complete system overview |
| `ARCHITECTURE_DIAGRAMS.md` | Visual flow diagrams |
| `COMPONENT_HIERARCHY.md` | Component structure |
| `FIREBASE_SETUP.md` | Firebase configuration |
| `ADMIN_SETUP.md` | Admin user creation |
| `VERCEL_DEPLOYMENT.md` | Web deployment guide |
| `EAS_BUILD_GUIDE.md` | Mobile build guide |
| `COLLABORATION_DEVELOPER_GUIDE.md` | Multi-user features |
| `ARDUINO_FIREBASE_INTEGRATION.md` | IoT integration |
| `AI_SETUP_GUIDE.md` | AI chat setup |

---

## Important Notes

⚠️ **Security**:
- Never commit `.env` file to GitHub
- Keep Firebase keys private
- Always use HTTPS for API calls
- Test Firestore rules thoroughly

🚀 **Performance**:
- Limit Firestore queries with `where` and `limit`
- Use `onSnapshot` for real-time data
- Clean up listeners on component unmount
- Cache frequently accessed data

📱 **Cross-Platform**:
- Use Expo Router's platform-specific routes
- Test on both iOS and Android
- Test web admin panel in browser
- Use `.web.ts` files for web-specific code

---

**Last Updated**: February 2, 2026
**Quick Reference Version**: 1.0
