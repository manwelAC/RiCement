# RiCement System Architecture

## Overview

RiCement is a cross-platform cement manufacturing management system with real-time monitoring, collaborative project management, and intelligent automation. The system is designed with a modern, scalable microservices-inspired architecture that supports both mobile (iOS/Android) and web (Admin Dashboard) clients.

---

## 1. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │
│  │   Mobile App     │    │  Mobile App      │    │  Admin Panel     │          │
│  │   (iOS/Android)  │    │  (Web)           │    │  (Web - Vercel)  │          │
│  │                  │    │                  │    │                  │          │
│  │ • Dashboard      │    │ • Dashboard      │    │ • Dashboard      │          │
│  │ • Explore        │    │ • Projects       │    │ • Users          │          │
│  │ • Process        │    │ • Analytics      │    │ • Analytics      │          │
│  │ • Profile        │    │ • Settings       │    │ • Complaints     │          │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘          │
│           │                       │                        │                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                 │                       │                        │
                 └───────────────────────┼────────────────────────┘
                                         │
                    ┌────────────────────▼───────────────────┐
                    │      SHARED SERVICES LAYER             │
                    │  (TypeScript/React Native)             │
                    └────────────────────┬───────────────────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            │                            │                            │
      ┌─────▼────────┐          ┌────────▼────────┐         ┌────────▼────────┐
      │ Auth Service │          │  Firebase       │         │  Admin Service  │
      │              │          │  Service        │         │                 │
      │ • SignUp     │          │                 │         │ • User Mgmt     │
      │ • Login      │          │ • Projects      │         │ • Company Mgmt  │
      │ • Logout     │          │ • Temperature   │         │ • Role Control  │
      │ • Reset Pwd  │          │ • RawMaterials  │         │ • Complaints    │
      │ • AnonymousAuth          │ • RHB Records   │         │ • Analytics     │
      └──────────────┘          │ • Chat Sessions │         │ • Audit Logs    │
                                │ • Collaborators │         │                 │
                                └─────────────────┘         └─────────────────┘
                                         │
                    ┌────────────────────▼───────────────────┐
                    │        DATA ACCESS LAYER               │
                    │     (Firebase SDK v12.4.0)             │
                    └────────────────────┬───────────────────┘
                                         │
            ┌────────────────────────────┼────────────────────────────┐
            │                            │                            │
      ┌─────▼────────┐          ┌────────▼────────┐         ┌────────▼────────┐
      │  Firestore   │          │ Realtime DB     │         │ Cloud Storage   │
      │  (Primary)   │          │ (Timers/Status) │         │ (Images/Files)  │
      │              │          │                 │         │                 │
      │ Collections: │          │ • timerActive   │         │ • Project Images│
      │ • users      │          │ • manual_project│         │ • Documents     │
      │ • projects   │          │   Status        │         │ • 3D Models     │
      │ • admins     │          │                 │         └─────────────────┘
      │ • companies  │          └─────────────────┘
      │ • temperatures│
      │ • rawMaterials│
      │ • rhbRecords │
      │ • chatSessions│
      │ • chatMessages│
      │ • complaints │
      └──────────────┘
```

---

## 2. Detailed Component Architecture

### 2.1 Client Layer

#### Mobile App (iOS/Android)
- **Framework**: React Native with Expo
- **Router**: Expo Router v6+
- **Deployment**: EAS Build
- **Features**:
  - Project management and tracking
  - Real-time temperature monitoring
  - Inventory management (raw materials, RHB records)
  - Process timeline visualization
  - Collaboration tools
  - AI Chat assistant

#### Admin Panel (Web)
- **Framework**: React Web (Expo Web)
- **Routing**: Expo Router with (admin) route group
- **Deployment**: Vercel
- **Features**:
  - Multi-company user management
  - Analytics and reporting
  - Complaint management
  - Project monitoring
  - Admin role controls

#### Shared Components
```
components/
├── Collapsible.tsx              # Expandable UI elements
├── ExternalLink.tsx             # Link handling
├── GlobalAIChat.tsx             # AI assistant component
├── Model3DViewer.tsx            # 3D model visualization
├── ParallaxScrollView.tsx        # Scroll effects
├── ProjectDetailsModal.tsx       # Project info display
├── ScreenWrapper.tsx            # Screen layout wrapper
├── ThemedText.tsx               # Typography
├── ThemedView.tsx               # Layout container
├── ThemeToggle.tsx              # Dark/Light mode
│
├── admin/                       # Admin-specific components
│   ├── UserManagement.tsx
│   ├── CompanyDashboard.tsx
│   ├── AnalyticsPanel.tsx
│   └── ComplaintViewer.tsx
│
└── ui/                          # Reusable UI elements
    ├── Button.tsx
    ├── Modal.tsx
    ├── Card.tsx
    └── Form.tsx
```

---

### 2.2 Services Layer

#### Authentication Service (`authService.ts`)
```
Functions:
- signUp(email, password, fullName, username)
- login(email, password)
- logout()
- resetPassword(email)
- getCurrentUser()
- onAuthStateChanged(callback)
- signInAnonymously()
- updateUserProfile(updates)
- checkAdminStatus(uid)
- checkSuperAdminStatus(uid)

Features:
- Email/Password authentication
- Firebase Auth persistence
- User profile management
- Role-based access control
- Session management
```

#### Firebase Service (`firebaseService.ts`)
```
Project Management:
- createProject(projectData)
- getProjects(userId)
- updateProject(projectId, updates)
- deleteProject(projectId)
- addCollaboratorsToProject(projectId, userIds)
- removeCollaborator(projectId, userId)
- updateCollaboratorBlocks(projectId, userId, blocks)

Data Management:
- createTemperatureLog(data)
- getTemperatureLogs(projectId)
- createRawMaterial(data)
- getRawMaterials(projectId)
- createRHBRecord(data)
- getRHBRecords(projectId)

Chat & AI:
- createChatSession(userId)
- addChatMessage(sessionId, message)
- getChatMessages(sessionId)

Advanced Features:
- syncLocalDataToFirebase()
- checkConnection()
- getFromLocal(key)
- saveToLocal(key, value)
```

#### Admin Service (`adminService.ts`)
```
User Management:
- createAdminUser(email, password, fullName)
- getAdminUsers(companyId)
- updateAdminRole(uid, role)
- deleteAdminUser(uid)

Company Management:
- createCompany(companyData)
- getCompany(companyId)
- updateCompany(companyId, updates)
- getCompanyUsers(companyId)

Analytics:
- getCompanyMetrics(companyId)
- getUserActivity(userId, dateRange)
- getProjectStatistics(companyId)

Complaints:
- getComplaints(filter)
- updateComplaintStatus(complaintId, status)
- assignComplaintToUser(complaintId, userId)

Audit:
- logAdminAction(action, details)
- getAuditLogs(companyId, dateRange)
```

---

### 2.3 Data Layer

#### Firestore Database Structure
```
ricement-app/
│
├── users/{userId}
│   ├── uid: string
│   ├── fullName: string
│   ├── username: string
│   ├── email: string
│   ├── role: 'user' | 'admin' | 'superadmin'
│   ├── companyId: string (for admins)
│   ├── createdAt: timestamp
│   └── lastLogin: timestamp
│
├── admins/{adminId}
│   ├── email: string
│   ├── fullName: string
│   ├── role: 'admin' | 'superadmin'
│   ├── companyId: string
│   ├── createdAt: timestamp
│   └── permissions: string[]
│
├── companies/{companyId}
│   ├── name: string
│   ├── description: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── createdBy: string (superadmin uid)
│   ├── totalAdmins: number
│   └── totalUsers: number
│
├── projects/{projectId}
│   ├── id: string
│   ├── name: string
│   ├── blocks: number
│   ├── estimatedTime: string
│   ├── remainingTime: number (seconds)
│   ├── pouringTime: number (seconds)
│   ├── date: string
│   ├── status: 'Queue' | 'Pouring' | 'Mixing' | 'Pouring2' | 'Completed'
│   ├── userId: string
│   ├── companyId: string
│   ├── collaborators: Collaborator[]
│   │   ├── userId: string
│   │   ├── fullName: string
│   │   ├── email: string
│   │   ├── blocksContributed: number
│   │   └── joinedAt: timestamp
│   ├── completedBlocks: number
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── temperatureLogs/{logId}
│   ├── temperature: number
│   ├── timestamp: timestamp
│   ├── projectId: string
│   ├── location: string
│   └── deviceId: string
│
├── rawMaterials/{materialId}
│   ├── name: string
│   ├── quantity: number
│   ├── unit: string
│   ├── costPerUnit: number
│   ├── dateAdded: timestamp
│   └── projectId: string
│
├── rhbRecords/{recordId}
│   ├── quantity: number
│   ├── productionDate: timestamp
│   ├── projectId: string
│   ├── qualityGrade: string
│   └── weight: number
│
├── chatSessions/{sessionId}
│   ├── userId: string
│   ├── startTime: timestamp
│   ├── endTime: timestamp
│   └── isActive: boolean
│
├── chatMessages/{messageId}
│   ├── sessionId: string
│   ├── message: string
│   ├── sender: 'user' | 'ai'
│   ├── timestamp: timestamp
│   └── aiResponse: string
│
├── complaints/{complaintId}
│   ├── userId: string
│   ├── subject: string
│   ├── description: string
│   ├── status: 'open' | 'in-progress' | 'resolved'
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── assignedTo: string
│
└── manual_projects/{projectId}
    ├── userId: string
    ├── timerActive: boolean
    ├── status: string
    └── ...
```

#### Realtime Database Structure
```
ricement-app/
│
├── manual_projects/{projectId}
│   ├── timerActive: boolean
│   └── status: string
```

#### Cloud Storage
```
gs://ricement-app.appspot.com/
│
├── projects/{projectId}/
│   ├── images/
│   ├── documents/
│   └── 3d-models/
│
└── users/{userId}/
    └── profile/
```

---

## 3. Feature Architecture

### 3.1 Project Management
```
Create Project → Store in Firestore → Real-time Sync → Update Status
                    ↓
            Add Collaborators
                    ↓
            Track Progress (blocks, time)
                    ↓
            Generate Reports
```

**Components**:
- `process.tsx` - Project creation and management
- `dashboard.tsx` - Project overview and monitoring
- `ProjectDetailsModal` - Project information display

**Services Used**:
- `firebaseService.createProject()`
- `firebaseService.addCollaboratorsToProject()`
- `firebaseService.updateCollaboratorBlocks()`

---

### 3.2 Temperature Monitoring
```
Arduino/IoT Device → Firebase Realtime DB → Firestore Logs → Analytics
```

**Data Flow**:
1. Arduino sensors collect temperature data
2. Send via HTTP to Firestore REST API
3. Create TemperatureLog documents
4. Mobile app subscribes to real-time updates
5. Display in charts/graphs on dashboard

**Integration**:
- `docs/arduino_pump_controller.ino` - Hardware controller
- `services/firebaseService.ts` - Log management
- `ARDUINO_FIREBASE_INTEGRATION.md` - Setup guide

---

### 3.3 AI Chat Assistant
```
User Input → GlobalAIChat Component → Gemini API → Response
                ↓
        Store in Firestore
        (chatSessions & chatMessages)
```

**Features**:
- Real-time AI responses
- Session management
- Message history storage
- Context-aware assistance

**Configuration**:
- API: Google Gemini
- File: `components/GlobalAIChat.tsx`
- Setup: `docs/AI_SETUP_GUIDE.md`

---

### 3.4 Multi-User Collaboration
```
User A ─┐
        ├─→ Shared Project ──→ Firestore ──→ Real-time Sync ──→ All Users
User B ─┤                                     (Collaborators
User C ─┘                                      Array)
```

**Implementation**:
- `Collaborator` interface in firebaseService
- `addCollaboratorsToProject()` method
- Real-time listeners for project updates
- Block contribution tracking

**Documentation**:
- `docs/COLLABORATION_DEVELOPER_GUIDE.md`

---

### 3.5 Admin & Role Management
```
Superadmin ──→ Create Company ──→ Assign Admins ──→ Manage Users
                                          ↓
                                    Set Permissions
                                          ↓
                                    View Analytics
```

**Roles**:
- **superadmin**: Full system access, company management
- **admin**: Company-level user management, analytics
- **user**: Project-level operations only

**Rules Implementation**:
- `UPDATED_FIRESTORE_RULES.tsx` - Security rules
- `isAdmin()` and `isSuperAdmin()` helper functions
- Row-level security for data access

---

## 4. Security Architecture

### 4.1 Authentication Flow
```
User Input (Email/Password)
        ↓
Firebase Auth (Email Provider)
        ↓
Create Auth Token
        ↓
Create Firestore User Document
        ↓
Store Auth State (Context/Redux)
        ↓
Authenticated User
```

### 4.2 Authorization & Firestore Security Rules
```
request.auth != null
        ↓
Check User Role (admin, superadmin, user)
        ↓
Check Resource Ownership
        ↓
Check Company Permissions (for admins)
        ↓
Allow/Deny Operation
```

**Key Rules**:
- Users can only read/write their own data
- Admins can manage their company's data
- Superadmins can manage all data
- Public read access for timer status (manual_projects)

### 4.3 Data Protection
- **Firestore Cache**: Unlimited cache size (prevents Image.getSize errors)
- **Offline Support**: AsyncStorage fallback
- **Encryption**: Firebase built-in encryption at rest
- **API Keys**: Environment variables (not hardcoded)

---

## 5. Deployment Architecture

### 5.1 Mobile App Deployment
```
Local Development
        ↓
EAS Build Queue
        ↓
Android APK / iOS IPA
        ↓
EAS Submit (Optional)
        ↓
Google Play Store / Apple App Store
```

**Commands**:
```bash
npm run build:android           # Android debug
npm run build:android:prod      # Android production
npm run build:ios              # iOS debug
npm run build:ios:prod         # iOS production
```

### 5.2 Admin Web Deployment
```
Local Development (expo start --web)
        ↓
Build: expo export -p web
        ↓
Vercel Deployment
        ↓
Auto-deploy on git push
        ↓
https://your-project.vercel.app
```

**Environment Setup**:
- Vercel environment variables (Firebase config)
- Firebase authorized domains
- Firestore security rules

**Documentation**:
- `VERCEL_DEPLOYMENT.md` - Complete guide

---

## 6. Data Flow Diagrams

### 6.1 Create Project Flow
```
1. User fills form (process.tsx)
        ↓
2. firebaseService.createProject()
        ↓
3. addDoc(collection(db, 'projects'), projectData)
        ↓
4. Firestore creates document with auto-ID
        ↓
5. Real-time listener updates UI
        ↓
6. Project appears in dashboard
```

### 6.2 Update Project Status Flow
```
1. User changes status dropdown
        ↓
2. firebaseService.updateProject(projectId, {status: newStatus})
        ↓
3. updateDoc(doc(db, 'projects', projectId), {status})
        ↓
4. Firestore updates document
        ↓
5. Real-time listeners trigger
        ↓
6. All clients see updated status immediately
```

### 6.3 Multi-User Collaboration Flow
```
1. Project Owner: Add Collaborator
        ↓
2. firebaseService.addCollaboratorsToProject()
        ↓
3. Add user to collaborators array + create log
        ↓
4. Firestore updates project document
        ↓
5. All collaborators' clients receive update
        ↓
6. Collaborator can now:
   - View project
   - Update blocks contributed
   - See real-time changes
```

### 6.4 AI Chat Flow
```
1. User types message (GlobalAIChat.tsx)
        ↓
2. Create ChatSession if not exists
        ↓
3. Add message to chatMessages collection
        ↓
4. Call Gemini API with context
        ↓
5. Receive AI response
        ↓
6. Store response in chatMessages
        ↓
7. Display to user in real-time
```

---

## 7. Technology Stack

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React Native | 0.81.5 |
| CLI | Expo | 54.0.31 |
| Router | Expo Router | 6.0.21 |
| State Management | React Context + Hooks | 19.1.0 |
| Icons | Expo Vector Icons | 15.0.3 |
| Animation | React Native Reanimated | 4.1.1 |
| Gestures | React Native Gesture Handler | 2.28.0 |
| Styling | StyleSheet + ThemedView | Native |

### Backend & Database
| Component | Technology | Details |
|-----------|-----------|---------|
| Authentication | Firebase Auth | Email/Password provider |
| Firestore | Cloud Firestore | NoSQL, Real-time sync |
| Realtime DB | Firebase Realtime Database | For timer status |
| Storage | Cloud Storage | Images, documents, 3D models |
| API | Firebase REST API | Arduino integration |

### Services & Tools
| Service | Purpose | Status |
|---------|---------|--------|
| Google Gemini | AI Chat Assistant | Integrated |
| Arduino/ESP8266 | Temperature Monitoring | Optional hardware |
| Vercel | Admin Web Hosting | Production |
| EAS Build | Mobile App Building | CI/CD |

---

## 8. System Constraints & Performance

### 8.1 Performance Optimizations
- **Firestore Cache**: Unlimited cache size for offline support
- **Lazy Loading**: Components load data on demand
- **Real-time Listeners**: Efficient subscription management
- **Image Optimization**: Expo Image component with caching
- **3D Model Loading**: Local file system for fast access

### 8.2 Scalability Considerations
- **Firestore Limits**: 
  - Read: 50K reads/sec
  - Write: 20K writes/sec
  - Per-document: 1MB max size
- **Firebase Auth**: Unlimited users
- **Cloud Storage**: Unlimited storage (pay-as-you-go)

### 8.3 Rate Limiting
- Arduino sensors: ~2 requests/sec (configurable)
- Mobile app: Real-time listeners (optimized)
- Admin panel: On-demand queries

---

## 9. Error Handling & Logging

### 9.1 Error Handling Strategy
```
Firebase Operation
        ↓
Try-Catch Block
        ↓
Log Error to Console
        ↓
Show User-Friendly Message
        ↓
Fallback to AsyncStorage (if offline)
        ↓
Retry Logic (for critical operations)
```

### 9.2 Offline Support
```
Internet Available
        ↓
Sync with Firebase ✓
        ↓
Online with Firestore
        ↓

Internet Unavailable
        ↓
Store locally (AsyncStorage)
        ↓
Show offline indicator
        ↓
Sync when online
```

---

## 10. Integration Points

### 10.1 External APIs
- **Gemini API**: AI chat responses
- **Firebase REST API**: Arduino integration
- **Vercel API**: Deployment automation

### 10.2 Hardware Integration
- **Arduino/ESP8266**: Temperature sensors & relay control
- **Firebase Realtime DB**: Real-time command/status

### 10.3 Third-Party Services
- **Google Services**: Maps, Analytics (future)
- **Push Notifications**: FCM (future implementation)

---

## 11. Maintenance & Operations

### 11.1 Key Configuration Files
```
config/firebase.ts          # Firebase initialization
app.json                    # Expo configuration
eas.json                    # EAS build config
vercel.json                 # Vercel deployment config
eslint.config.js            # Code linting
tsconfig.json               # TypeScript config
babel.config.js             # JavaScript transpiling
```

### 11.2 Environment Variables
```
EXPO_PUBLIC_FIREBASE_API_KEY
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
EXPO_PUBLIC_FIREBASE_APP_ID
EXPO_PUBLIC_FIREBASE_DATABASE_URL
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
```

### 11.3 Monitoring
- **Console Logs**: Development and error tracking
- **Firebase Console**: Real-time monitoring
- **Vercel Dashboard**: Web app analytics
- **EAS Dashboard**: Mobile app analytics

---

## 12. Future Enhancements

### Phase 2
- [ ] Push Notifications (FCM)
- [ ] Advanced Analytics Dashboard
- [ ] Predictive Maintenance (ML)
- [ ] IoT Dashboard for hardware management
- [ ] PDF Report Generation

### Phase 3
- [ ] Mobile Payment Integration
- [ ] Advanced Search & Filtering
- [ ] Video Integration
- [ ] Augmented Reality (3D models)
- [ ] Blockchain for quality assurance

---

## 13. Documentation References

Key documentation files in `docs/`:

| Document | Purpose |
|----------|---------|
| `FIREBASE_SETUP.md` | Firebase configuration guide |
| `ADMIN_SETUP.md` | Admin user creation |
| `ADMIN_WEB_SETUP.md` | Admin panel architecture |
| `VERCEL_DEPLOYMENT.md` | Web deployment guide |
| `EAS_BUILD_GUIDE.md` | Mobile app building |
| `ARDUINO_FIREBASE_INTEGRATION.md` | Hardware integration |
| `COLLABORATION_DEVELOPER_GUIDE.md` | Multi-user features |
| `FIREBASE_AUTH_FIX.md` | Authentication troubleshooting |
| `FIREBASE_RULES_FIX.md` | Security rules updates |
| `AI_SETUP_GUIDE.md` | AI chat configuration |

---

## 14. Quick Reference: Key Methods

### Authentication
```typescript
await authService.signUp(email, password, fullName, username)
await authService.login(email, password)
await authService.logout()
await authService.resetPassword(email)
```

### Projects
```typescript
await firebaseService.createProject(projectData)
await firebaseService.getProjects(userId)
await firebaseService.updateProject(projectId, updates)
await firebaseService.deleteProject(projectId)
```

### Collaboration
```typescript
await firebaseService.addCollaboratorsToProject(projectId, userIds, userDetails)
await firebaseService.updateCollaboratorBlocks(projectId, userId, blocks)
await firebaseService.removeCollaborator(projectId, userId)
```

### Data Management
```typescript
await firebaseService.createTemperatureLog(data)
await firebaseService.createRawMaterial(data)
await firebaseService.createRHBRecord(data)
```

### Admin Operations
```typescript
await adminService.createAdminUser(email, password, fullName)
await adminService.createCompany(companyData)
await adminService.getCompanyMetrics(companyId)
```

---

## Conclusion

RiCement's architecture is designed to be:
- **Scalable**: Handles multiple companies and thousands of users
- **Real-time**: Instant data sync across all clients
- **Secure**: Role-based access control with Firestore rules
- **Resilient**: Offline support with local caching
- **Flexible**: Supports mobile, web, and IoT integration

The system leverages Firebase's modern architecture for rapid development while maintaining separation of concerns through well-organized services layer.

---

**Last Updated**: February 2, 2026
**Architecture Version**: 2.0
**Status**: Production Ready
