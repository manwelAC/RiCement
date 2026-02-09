# RiCement Architecture - Visual Overview

## 1. Complete System Architecture (Netflix-Style Reference)

```
╔════════════════════════════════════════════════════════════════════════════╗
║                         RICEMENT SYSTEM ARCHITECTURE                       ║
║                  (Reference: Netflix Architecture Pattern)                 ║
╚════════════════════════════════════════════════════════════════════════════╝


                              ┏━━━━━━━━━━━━━━━━━━┓
                              ┃   END USERS      ┃
                              ┗━━━━━┬━━━━━┬━━━━━━┛
                                    │     │
                    ┌───────────────┴─────┴────────────────┐
                    │                                      │
           ┏━━━━━━━━▼━━━━━━┓                     ┏━━━━━━━▼━━━━━━━┓
           ┃  iOS/Android  ┃                     ┃   Web Browser  ┃
           ┃  Mobile App   ┃                     ┃  Admin Panel   ┃
           ┃   (Expo)      ┃                     ┃   (Vercel)     ┃
           ┗━━━━━━━┬━━━━━━┛                     ┗━━━━━━━┬━━━━━━━┛
                   │                                    │
                   │                                    │
                   ├────────────────┬──────────────────┤
                   │                │                  │
          ┌────────▼────────────────▼──────────────────▼─────┐
          │      APPLICATION LAYER (React + TypeScript)     │
          ├──────────────────────────────────────────────────┤
          │                                                  │
          │  • Auth Routes (login, signup, reset)           │
          │  • Mobile Routes (tabs - dashboard, explore)    │
          │  • Admin Routes (web - users, analytics)        │
          │  • Shared Routes (terms, landing)               │
          │                                                  │
          └────────────────┬─────────────────────────────────┘
                           │
          ┌────────────────▼──────────────────┐
          │    SERVICES LAYER                 │
          ├───────────────────────────────────┤
          │                                   │
          │  ┌─────────────────────────────┐ │
          │  │ Authentication Service       │ │
          │  │ • signUp/login/logout        │ │
          │  │ • Password reset             │ │
          │  │ • Role checking              │ │
          │  └─────────────────────────────┘ │
          │                                   │
          │  ┌─────────────────────────────┐ │
          │  │ Firebase Service             │ │
          │  │ • Project management         │ │
          │  │ • Collaboration              │ │
          │  │ • Temperature logging        │ │
          │  │ • Inventory management       │ │
          │  │ • Chat sessions              │ │
          │  └─────────────────────────────┘ │
          │                                   │
          │  ┌─────────────────────────────┐ │
          │  │ Admin Service                │ │
          │  │ • User management            │ │
          │  │ • Company management         │ │
          │  │ • Analytics                  │ │
          │  │ • Complaint management       │ │
          │  └─────────────────────────────┘ │
          │                                   │
          └────────────────┬──────────────────┘
                           │
          ┌────────────────▼──────────────────────────┐
          │      DATA ACCESS LAYER (Firebase SDK)    │
          ├───────────────────────────────────────────┤
          │                                           │
          │  Firestore  │ Realtime DB │  Storage    │
          │  (Primary)  │  (Status)   │  (Files)    │
          │             │             │             │
          │  • Users    │ • Timers    │ • Images    │
          │  • Projects │ • Status    │ • Documents │
          │  • Admins   │             │ • Models    │
          │  • Data     │             │             │
          │                                           │
          └────────────────┬──────────────────────────┘
                           │
          ┌────────────────▼──────────────────────────┐
          │   EXTERNAL INTEGRATIONS & SERVICES       │
          ├───────────────────────────────────────────┤
          │                                           │
          │  ┌──────────────┐  ┌──────────────────┐ │
          │  │ Google Auth  │  │ Google Gemini    │ │
          │  │ (Firebase)   │  │ (AI Chat)        │ │
          │  └──────────────┘  └──────────────────┘ │
          │                                           │
          │  ┌──────────────┐  ┌──────────────────┐ │
          │  │ Arduino IoT  │  │ Vercel (Hosting) │ │
          │  │ (Sensors)    │  │ (Web Deployment) │ │
          │  └──────────────┘  └──────────────────┘ │
          │                                           │
          └───────────────────────────────────────────┘
```

---

## 2. Data Flow - User Journey

```
╔════════════════════════════════════════════════════════════════════════════╗
║                   USER JOURNEY - PROJECT CREATION                         ║
╚════════════════════════════════════════════════════════════════════════════╝

User Opens App
    │
    ├─→ Check persisted auth state
    │   └─→ onAuthStateChanged() listener
    │       └─→ User authenticated?
    │           ├─ YES: Load user profile
    │           │       └─→ Check role (admin/user)
    │           │           ├─ Admin: Redirect to admin dashboard
    │           │           └─ User: Redirect to mobile dashboard
    │           └─ NO: Show login screen
    │
    └─→ User navigates to Process Tab
        └─→ Opens "Create Project" form
            │
            ├─→ User fills form:
            │   ├─ Project name
            │   ├─ Number of blocks
            │   ├─ Estimated time
            │   ├─ Date
            │   └─ Add collaborators (optional)
            │
            ├─→ User clicks "Create Project"
            │   └─→ Validate form data
            │       └─→ firebaseService.createProject({...})
            │           └─→ addDoc(collection(db, 'projects'), data)
            │               │
            │               ├─→ Firestore creates document
            │               │   ├─ Auto-generates projectId
            │               │   ├─ Sets userId = current user
            │               │   ├─ Sets createdAt = now()
            │               │   ├─ status = 'Queue'
            │               │   └─ collaborators = []
            │               │
            │               ├─→ Real-time listener triggers
            │               │   (all subscribed clients)
            │               │   └─→ New project in snapshot
            │               │
            │               └─→ Success notification
            │
            ├─→ Navigate to Dashboard tab
            │   └─→ Dashboard has active listener on projects
            │       └─→ Receives update with new project
            │           └─→ setState() updates projects array
            │               └─→ Component re-renders
            │                   └─→ New ProjectCard appears
            │
            └─→ User can now:
                ├─ Click project to view details
                ├─ Add collaborators
                ├─ Update project status
                ├─ Delete project
                └─ Monitor in real-time
```

---

## 3. Real-Time Synchronization Flow

```
╔════════════════════════════════════════════════════════════════════════════╗
║              REAL-TIME SYNC - MULTI-USER COLLABORATION                    ║
╚════════════════════════════════════════════════════════════════════════════╝

Scenario: Creator adds collaborators to project

CREATOR'S DEVICE:
    User clicks "Add Collaborators"
    │
    ├─→ Select users: [User A, User B, User C]
    │
    ├─→ firebaseService.addCollaboratorsToProject(
    │       projectId,
    │       [userA_id, userB_id, userC_id],
    │       {metadata...}
    │   )
    │
    ├─→ updateDoc(doc(db, 'projects', projectId), {
    │       collaborators: [
    │           {userId: userA_id, fullName, email, blocksContributed: 0},
    │           {userId: userB_id, fullName, email, blocksContributed: 0},
    │           {userId: userC_id, fullName, email, blocksContributed: 0}
    │       ]
    │   })
    │
    ├─→ Firestore updates document
    │   │
    │   └─→ **SYNCHRONIZATION HAPPENS HERE**
    │
    ├─→ Real-time listener on Creator's device
    │   └─→ Receives updated snapshot
    │       └─→ Dashboard re-renders with new collaborators
    │
    └─→ Success message shown to Creator


USER A'S DEVICE:
    │
    ├─→ Real-time listener on projects collection
    │   (was already subscribed)
    │
    ├─→ Receives snapshot with updated collaborators
    │
    ├─→ setState() updates projects array
    │
    ├─→ Component re-renders < 100ms after update
    │
    └─→ User A sees project in dashboard
        ├─ Can view collaborators
        ├─ Can see other collaborators in list
        └─ Can contribute blocks to project


USER B'S DEVICE:
    │
    └─→ Same as User A (instant sync)


USER C'S DEVICE:
    │
    └─→ Same as User A (instant sync)


RESULT: All 4 users (creator + 3 collaborators) see synchronized project state
        across all devices within ~100ms (Firebase latency)
```

---

## 4. Temperature Monitoring - IoT Integration

```
╔════════════════════════════════════════════════════════════════════════════╗
║           IOT INTEGRATION - ARDUINO TEMPERATURE MONITORING                 ║
╚════════════════════════════════════════════════════════════════════════════╝

ARDUINO DEVICE:
    │
    ├─→ Boot & initialize
    │   ├─ Connect to WiFi
    │   ├─ Read sensor (DS18B20)
    │   └─ Get Firestore credentials
    │
    ├─→ Poll every 30 seconds:
    │   │
    │   ├─→ Read temperature from sensor
    │   │   └─→ e.g., 65.5°C
    │   │
    │   ├─→ HTTP POST to Firestore REST API:
    │   │   POST /firestore/projects/ricement-app/databases/default/documents
    │   │   Body: {
    │   │       "fields": {
    │   │           "temperature": {"doubleValue": 65.5},
    │   │           "timestamp": {"timestampValue": "2024-02-02T10:30:00Z"},
    │   │           "projectId": {"stringValue": "proj123"},
    │   │           "location": {"stringValue": "tank1"},
    │   │           "deviceId": {"stringValue": "arduino_01"}
    │   │       }
    │   │   }
    │   │
    │   └─→ Firestore creates temperatureLogs/{logId}
    │       └─→ Document stored
    │           └─→ **SYNC TRIGGER**
    │
    └─→ On shutdown:
        └─→ Close WiFi & sensors


MOBILE APP:
    │
    ├─→ Component mounts (dashboard.tsx)
    │
    ├─→ Subscribe to temperature listener:
    │   onSnapshot(
    │       query(collection(db, 'temperatureLogs'), where('projectId', '==', projectId)),
    │       (snapshot) => {
    │           setTemperatureData(snapshot.docs.map(doc => doc.data()));
    │       }
    │   )
    │
    ├─→ Real-time listener active
    │   │
    │   └─→ Firestore sends updates when temperatureLogs change
    │       │
    │       ├─→ When Arduino posts new log:
    │       │   └─→ Snapshot received < 100ms
    │       │
    │       ├─→ setTemperatureData() updates state
    │       │
    │       ├─→ TemperatureChart re-renders
    │       │
    │       └─→ User sees new temperature point on chart
    │
    ├─→ Real-time graph updates:
    │   Time: 10:30  Temp: 65.5°C  ← New point appears
    │   Time: 10:29  Temp: 65.2°C
    │   Time: 10:28  Temp: 64.8°C
    │
    └─→ If temperature exceeds threshold:
        └─→ Show alert to user


RESULT: Real-time temperature monitoring from IoT device to mobile app
        Data journey: Arduino → Firestore → Mobile (< 100ms total)
```

---

## 5. Admin Dashboard - Analytics & Monitoring

```
╔════════════════════════════════════════════════════════════════════════════╗
║              ADMIN DASHBOARD - COMPANY ANALYTICS & MONITORING              ║
╚════════════════════════════════════════════════════════════════════════════╝

Admin Opens Web Dashboard
    │
    ├─→ Admin Login (app/(admin)/login.tsx)
    │   ├─ Enter email & password
    │   ├─ authService.login()
    │   ├─ authService.checkAdminStatus()
    │   │   └─→ Query Firestore: collection(db, 'admins')
    │   │       └─→ If found with correct companyId:
    │   │           └─→ Set admin context
    │   └─→ Redirect to admin dashboard
    │
    ├─→ Admin Dashboard (app/(admin)/dashboard.tsx)
    │   │
    │   ├─→ Load analytics:
    │   │   adminService.getCompanyMetrics(companyId)
    │   │   │
    │   │   ├─→ Query Firestore multiple collections:
    │   │   │   ├─ COUNT projects WHERE companyId == this
    │   │   │   ├─ COUNT completedProjects WHERE status == 'Completed'
    │   │   │   ├─ SUM blocks from all projects
    │   │   │   ├─ AVG completion time
    │   │   │   └─ USER activity stats
    │   │   │
    │   │   ├─→ Process data:
    │   │   │   ├─ Calculate KPIs
    │   │   │   ├─ Calculate trends
    │   │   │   ├─ Calculate percentages
    │   │   │   └─ Format for charts
    │   │   │
    │   │   └─→ Return metrics object:
    │   │       {
    │   │           totalProjects: 150,
    │   │           completedProjects: 125,
    │   │           totalBlocks: 15000,
    │   │           avgCompletionTime: 2.5,
    │   │           activeUsers: 45,
    │   │           completionRate: 83.3%
    │   │       }
    │   │
    │   ├─→ Display on Dashboard:
    │   │   ┌─────────────────────────────────────┐
    │   │   │ RiCement Admin Dashboard            │
    │   │   ├─────────────────────────────────────┤
    │   │   │ Company: Cement Co.                 │
    │   │   ├─────────────────────────────────────┤
    │   │   │                                     │
    │   │   │  Total Projects: 150    Completed: 125    Completion: 83.3%
    │   │   │  
    │   │   │  [PROJECT COMPLETION CHART]
    │   │   │  
    │   │   │  [USER ACTIVITY HEATMAP]
    │   │   │  
    │   │   │  [REVENUE/COST ANALYTICS]
    │   │   │  
    │   │   │  [PRODUCTION TIMELINE]
    │   │   │                                     │
    │   │   └─────────────────────────────────────┘
    │   │
    │   └─→ Navigate to other sections
    │
    ├─→ Users Tab (app/(admin)/users.tsx)
    │   │
    │   ├─→ List all company users
    │   │   adminService.getCompanyUsersList(companyId)
    │   │   └─→ Query users WHERE companyId == this
    │   │
    │   ├─→ Display table:
    │   │   Name | Email | Role | Actions
    │   │   ─────────────────────────────
    │   │   John | j@xx  | user | [Edit] [Delete]
    │   │   Jane | ja@xx | user | [Edit] [Delete]
    │   │
    │   └─→ Admin can:
    │       ├─ Edit user details
    │       ├─ Change user role
    │       ├─ Delete user
    │       └─ Reset password
    │
    ├─→ Projects Tab (app/(admin)/projects.tsx)
    │   │
    │   ├─→ List all company projects
    │   │   adminService.getCompanyProjects(companyId)
    │   │
    │   └─→ Monitor:
    │       ├─ Project status
    │       ├─ Progress
    │       ├─ Team members
    │       └─ Timeline
    │
    └─→ Complaints Tab (app/(admin)/complaints.tsx)
        │
        ├─→ List all complaints
        │   adminService.getComplaints(filter)
        │
        └─→ Manage:
            ├─ Update status
            ├─ Assign to team member
            ├─ Add notes
            └─ Close when resolved
```

---

## 6. Authentication & Authorization Flow

```
╔════════════════════════════════════════════════════════════════════════════╗
║                  AUTHENTICATION & AUTHORIZATION FLOW                       ║
╚════════════════════════════════════════════════════════════════════════════╝

NEW USER SIGNUP:
    │
    ├─→ signup.tsx form
    │   ├─ Email
    │   ├─ Password (must be 8+ chars)
    │   ├─ Full Name
    │   └─ Username
    │
    ├─→ authService.signUp(email, password, fullName, username)
    │   │
    │   ├─→ createUserWithEmailAndPassword(auth, email, password)
    │   │   └─→ Firebase Auth creates user
    │   │       └─→ Returns: user UID
    │   │
    │   ├─→ updateProfile(user, {displayName: fullName})
    │   │   └─→ Firebase Auth updates profile
    │   │
    │   ├─→ Create Firestore document:
    │   │   setDoc(doc(db, 'users', uid), {
    │   │       uid,
    │   │       email,
    │   │       fullName,
    │   │       username,
    │   │       role: 'user',
    │   │       createdAt: now(),
    │   │       lastLogin: now()
    │   │   })
    │   │   └─→ Firestore users/{uid} created
    │   │
    │   └─→ Return UserProfile object
    │
    ├─→ AuthContext updated
    │   └─→ currentUser = newUser
    │
    └─→ Redirect to dashboard
        └─→ User authenticated ✓


EXISTING USER LOGIN:
    │
    ├─→ login.tsx form
    │   ├─ Email
    │   └─ Password
    │
    ├─→ authService.login(email, password)
    │   │
    │   ├─→ signInWithEmailAndPassword(auth, email, password)
    │   │   └─→ Firebase Auth validates
    │   │       └─→ If valid: Returns user UID
    │   │       └─→ If invalid: Throws error
    │   │
    │   ├─→ Get user profile from Firestore
    │   │   getDoc(doc(db, 'users', uid))
    │   │   └─→ Load profile data
    │   │
    │   ├─→ Check user role
    │   │   const role = userDoc.role
    │   │   └─→ 'user' or 'admin' or 'superadmin'
    │   │
    │   └─→ Return UserProfile object
    │
    ├─→ AuthContext updated
    │   └─→ currentUser = user
    │       └─→ isAdmin = (role === 'admin' || role === 'superadmin')
    │
    └─→ Route based on role:
        ├─ role === 'user' → Redirect to /dashboard
        ├─ role === 'admin' → Redirect to /admin/dashboard
        └─ role === 'superadmin' → Redirect to /admin/dashboard


PERSISTENT SESSION:
    │
    ├─→ App starts (App._layout.tsx)
    │   └─→ onAuthStateChanged() listener activated
    │       │
    │       ├─→ If Firebase Auth has cached token:
    │       │   ├─ Load user from cache
    │       │   ├─ Load profile from Firestore
    │       │   ├─ Update AuthContext
    │       │   └─ User immediately authenticated
    │       │       (No login screen shown)
    │       │
    │       └─→ If no cached token:
    │           └─ Show login screen
    │
    └─→ No need to login again ✓


LOGOUT:
    │
    ├─→ User clicks Logout
    │
    ├─→ authService.logout()
    │   │
    │   ├─→ signOut(auth)
    │   │   └─→ Firebase Auth clears token
    │   │
    │   ├─→ Clear AuthContext
    │   │   └─→ currentUser = null
    │   │
    │   └─→ Clear local caches
    │
    └─→ Redirect to login screen


ROLE-BASED ACCESS CONTROL:
    │
    ├─→ After login, role is checked:
    │   
    │   Regular User (role === 'user'):
    │   ├─ Can only access mobile app routes
    │   ├─ Can create own projects
    │   ├─ Can view own data
    │   ├─ Cannot access admin panel
    │   └─ Firestore rules enforce this
    │
    │   Admin (role === 'admin'):
    │   ├─ Can access admin panel
    │   ├─ Can manage users in their company
    │   ├─ Can view company analytics
    │   ├─ Cannot manage other companies
    │   └─ Firestore rules enforce this
    │
    │   Superadmin (role === 'superadmin'):
    │   ├─ Can access admin panel
    │   ├─ Can manage all companies
    │   ├─ Can manage all users
    │   ├─ Can view all analytics
    │   └─ Firestore rules enforce this
    │
    └─→ Firestore Security Rules verify role on every read/write
        └─→ Backend enforces access control
```

---

## 7. Component Rendering Tree

```
╔════════════════════════════════════════════════════════════════════════════╗
║                     COMPONENT HIERARCHY - MOBILE APP                       ║
╚════════════════════════════════════════════════════════════════════════════╝

App._layout.tsx (Root)
│
├─ AuthContext Provider
│  └─ ThemeContext Provider
│     └─ Expo Router
│        │
│        ├── Auth Routes
│        │   ├── login.tsx
│        │   │   └─ ThemedView
│        │   │      ├─ ThemedText "Login"
│        │   │      ├─ TextInput (email)
│        │   │      ├─ TextInput (password)
│        │   │      └─ Button "Sign In"
│        │   │
│        │   ├── signup.tsx [similar structure]
│        │   │
│        │   └── forgot-password.tsx [similar structure]
│        │
│        └── (tabs)/_layout.tsx
│            └─ BottomTabNavigator
│               │
│               ├─ Tab: Home
│               │  └─ index.tsx
│               │     └─ ThemedView
│               │        ├─ ParallaxScrollView
│               │        ├─ ThemedText "Welcome"
│               │        ├─ GlobalAIChat (AI Assistant)
│               │        └─ ProjectCard[] (map over projects)
│               │           ├─ ThemedText (project name)
│               │           ├─ Badge (status)
│               │           └─ Button "View"
│               │
│               ├─ Tab: Dashboard
│               │  └─ dashboard.tsx
│               │     └─ ThemedView
│               │        ├─ ThemedText "Projects"
│               │        ├─ TemperatureChart (LineChart)
│               │        ├─ TimerWidget
│               │        └─ ProjectDetailsModal
│               │           └─ ProjectCard (selected)
│               │              ├─ CollaboratorsList
│               │              │  └─ Card[]
│               │              │     ├─ ThemedText (name)
│               │              │     └─ Badge (blocks)
│               │              ├─ StatusSelect
│               │              └─ Button "Update"
│               │
│               ├─ Tab: Explore
│               │  └─ explore.tsx
│               │     └─ ThemedView
│               │        ├─ TextInput (search)
│               │        ├─ Select (filter)
│               │        └─ ScrollView
│               │           └─ ProjectCard[] (all projects)
│               │
│               ├─ Tab: Process
│               │  └─ process.tsx
│               │     └─ ThemedView
│               │        ├─ TextInput "Project Name"
│               │        ├─ TextInput "Number of Blocks"
│               │        ├─ TextInput "Estimated Time"
│               │        ├─ Select "Date"
│               │        ├─ Button "Create Project"
│               │        └─ InventoryList (RawMaterials)
│               │           └─ Card[]
│               │
│               └─ Tab: Profile
│                  └─ profile.tsx
│                     └─ ThemedView
│                        ├─ Card (user info)
│                        │  ├─ ThemedText (name)
│                        │  ├─ ThemedText (email)
│                        │  └─ Badge (role)
│                        ├─ ThemeToggle
│                        └─ Button "Logout"
```

---

## 8. State Management Flow

```
╔════════════════════════════════════════════════════════════════════════════╗
║                  STATE MANAGEMENT - DATA FLOW                              ║
╚════════════════════════════════════════════════════════════════════════════╝

Global State (Context):
┌─────────────────────────────────────────┐
│          AuthContext                    │
├─────────────────────────────────────────┤
│ • currentUser: UserProfile | null       │
│ • isLoading: boolean                    │
│ • isAdmin: boolean                      │
│ • error: string | null                  │
│                                         │
│ Updated by:                             │
│ • authService.signUp()                  │
│ • authService.login()                   │
│ • authService.logout()                  │
│ • onAuthStateChanged()                  │
└─────────────────────────────────────────┘
          │
          └─→ Used by all components
              ├─ For conditional rendering
              ├─ For role-based routing
              └─ For user info display


┌─────────────────────────────────────────┐
│        ThemeContext                     │
├─────────────────────────────────────────┤
│ • colorScheme: 'light' | 'dark'         │
│ • colors: ColorDefinition               │
│ • toggleTheme: () => void               │
│                                         │
│ Updated by:                             │
│ • User clicks ThemeToggle button        │
│ • System preference changes             │
└─────────────────────────────────────────┘
          │
          └─→ Used by themed components
              ├─ ThemedText
              ├─ ThemedView
              └─ Other UI elements


Local Component State (useState):
┌─────────────────────────────────────────┐
│      dashboard.tsx                      │
├─────────────────────────────────────────┤
│ • projects: Project[]                   │
│ • selectedProject: Project | null       │
│ • isModalVisible: boolean              │
│ • isLoading: boolean                    │
│ • error: string | null                  │
│ • temperatureData: TempLog[]            │
│                                         │
│ Updated by:                             │
│ • onSnapshot listener → setProjects()   │
│ • User interaction → setState()         │
│ • API calls → setState()                │
└─────────────────────────────────────────┘
          │
          └─→ Component re-renders
              ├─ ProjectCard updates
              ├─ TemperatureChart updates
              └─ Modal shows/hides


Real-Time Data (Firestore Listeners):
┌─────────────────────────────────────────┐
│      Firestore onSnapshot               │
├─────────────────────────────────────────┤
│ • Listens to projects collection        │
│ • Listens to temperature logs           │
│ • Listens to chat messages              │
│ • Listens to manual_projects (Realtime) │
│                                         │
│ Trigger:                                │
│ • Data changes in Firestore             │
│ • Snapshot received < 100ms             │
│ • setState() called with new data       │
│ • Component re-renders                  │
└─────────────────────────────────────────┘
          │
          └─→ Real-time sync
              ├─ All clients updated
              ├─ Instant feedback
              └─ Collaborative features


Caching Strategy:
┌─────────────────────────────────────────┐
│      AsyncStorage (Local Cache)         │
├─────────────────────────────────────────┤
│ • Cache frequently accessed data        │
│ • Offline support                       │
│ • Faster app startup                    │
│                                         │
│ Data:                                   │
│ • User profile                          │
│ • Project list (synced)                 │
│ • Recent searches                       │
└─────────────────────────────────────────┘
          │
          └─→ Fallback when offline
              ├─ Read from AsyncStorage
              ├─ Show cached data
              ├─ Queue operations
              └─ Sync when online
```

---

## 9. Error Handling & Recovery

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    ERROR HANDLING & RECOVERY FLOW                          ║
╚════════════════════════════════════════════════════════════════════════════╝

Firebase Operation:
│
├─→ Try-Catch Block
│
├─→ Normal Path (Success):
│   └─→ Data operation completes
│       └─→ setState() updates UI
│           └─→ Component re-renders
│               └─→ Success shown to user
│
└─→ Error Path (Failure):
    │
    ├─→ Catch error
    │   └─→ Error logged to console
    │
    ├─→ Check error type:
    │   │
    │   ├─ "Permission denied" (Firestore rules):
    │   │  ├─→ Show: "Not authorized to perform this action"
    │   │  └─→ Check: User role & Firestore rules
    │   │
    │   ├─ "Network error" (Internet):
    │   │  ├─→ Show: "No internet connection"
    │   │  ├─→ Enable: Offline mode
    │   │  └─→ Queue: Operation for later
    │   │
    │   ├─ "Authentication required":
    │   │  ├─→ Clear: AuthContext
    │   │  └─→ Route: To login screen
    │   │
    │   ├─ "Document not found":
    │   │  └─→ Show: "Item not found"
    │   │
    │   └─ "Unknown error":
    │      └─→ Show: Generic error message
    │
    └─→ User Actions:
        ├─ Retry: Retry operation
        ├─ Offline: Work offline
        ├─ Contact: Show contact support
        └─ Navigate: Go back


Offline Handling:
│
├─→ Internet disconnects
│   │
│   ├─→ Firestore cache activated
│   │   └─→ Display last synced data
│   │
│   ├─→ Show "Offline" indicator
│   │   └─→ Banner at top of screen
│   │
│   ├─→ Queue local changes
│   │   └─→ Store in AsyncStorage
│   │
│   └─→ Disable real-time updates
│       └─→ No new data from server
│
├─→ Internet reconnects
│   │
│   ├─→ Sync local changes to Firestore
│   │   └─→ firebaseService.syncLocalDataToFirebase()
│   │
│   ├─→ Receive latest server data
│   │   └─→ Re-subscribe to listeners
│   │
│   ├─→ Update UI with latest data
│   │   └─→ setState() with fresh data
│   │
│   └─→ Hide "Offline" indicator
│       └─→ Show "Online" indicator
│
└─→ User never loses data ✓


Network Retry Logic:
│
└─→ On network failure:
    │
    ├─→ Wait 2 seconds (exponential backoff)
    │
    ├─→ Retry operation
    │   ├─ Successful? → Done ✓
    │   └─ Failed? → Continue
    │
    ├─→ Wait 4 seconds
    │
    ├─→ Retry operation
    │   ├─ Successful? → Done ✓
    │   └─ Failed? → Continue
    │
    ├─→ Wait 8 seconds
    │
    ├─→ Retry operation
    │   ├─ Successful? → Done ✓
    │   └─ Failed? → Show error
    │
    └─→ Give up after 3 retries
        └─→ Show error to user
            └─→ User can retry manually
```

---

**Last Updated**: February 2, 2026  
**Architecture Version**: 2.0  
**Visual Diagrams Version**: 1.0
