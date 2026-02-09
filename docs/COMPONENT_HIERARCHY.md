# RiCement Component Hierarchy & Structure Map

## Application Structure Overview

```
RiCement Project Root
├── app/                          # Application Routes (Expo Router)
│   ├── _layout.tsx              # Root layout wrapper
│   ├── index.tsx                # Home/Landing page
│   ├── login.tsx                # Login screen (shared)
│   ├── signup.tsx               # Registration screen (shared)
│   ├── forgot-password.tsx       # Password recovery (shared)
│   ├── terms.tsx                # Terms of service
│   ├── intro.tsx                # App introduction
│   ├── landing.tsx              # Landing page
│   ├── +not-found.tsx           # 404 page
│   │
│   ├── (tabs)/                  # Mobile App Routes
│   │   ├── _layout.tsx          # Tab navigation layout
│   │   ├── index.tsx            # Home/Dashboard
│   │   ├── dashboard.tsx        # Project dashboard
│   │   ├── explore.tsx          # Explore projects
│   │   ├── process.tsx          # Create/manage projects
│   │   ├── admin.tsx            # Admin quick access
│   │   ├── profile.tsx          # User profile
│   │   └── [routes].tsx         # Dynamic routes
│   │
│   └── (admin)/                 # Admin Panel Routes (Web only)
│       ├── _layout.tsx          # Admin layout
│       ├── index.tsx            # Admin home
│       ├── dashboard.tsx        # Analytics dashboard
│       ├── users.tsx            # User management
│       ├── projects.tsx         # Project management
│       ├── complaints.tsx       # Complaint management
│       ├── login.tsx            # Admin login (web-specific)
│       └── [routes].tsx         # Other admin pages
│
├── components/                  # Reusable Components
│   ├── Collapsible.tsx          # Expandable content
│   ├── ExternalLink.tsx         # Link component
│   ├── GlobalAIChat.tsx         # AI chat assistant
│   ├── Model3DViewer.tsx        # 3D model viewer
│   ├── ParallaxScrollView.tsx   # Scroll effects
│   ├── ProjectDetailsModal.tsx  # Project info modal
│   ├── ScreenWrapper.tsx        # Screen layout wrapper
│   ├── ThemedText.tsx           # Text component
│   ├── ThemedView.tsx           # View container
│   ├── ThemeToggle.tsx          # Theme switcher
│   │
│   ├── admin/                   # Admin-specific components
│   │   ├── UserManagementTable.tsx
│   │   ├── CompanyDashboard.tsx
│   │   ├── AnalyticsCharts.tsx
│   │   ├── ComplaintViewer.tsx
│   │   ├── UserForm.tsx
│   │   ├── CompanyForm.tsx
│   │   └── RoleSelector.tsx
│   │
│   ├── mobile/                  # Mobile-specific components
│   │   ├── ProjectCard.tsx
│   │   ├── TemperatureChart.tsx
│   │   ├── TimerWidget.tsx
│   │   ├── InventoryList.tsx
│   │   ├── CollaboratorsList.tsx
│   │   └── StatusIndicator.tsx
│   │
│   └── ui/                      # Generic UI components
│       ├── Button.tsx           # Button variants
│       ├── Modal.tsx            # Modal dialog
│       ├── Card.tsx             # Card container
│       ├── Input.tsx            # Text input
│       ├── Select.tsx           # Dropdown select
│       ├── Badge.tsx            # Status badge
│       ├── Loading.tsx          # Loading spinner
│       ├── Alert.tsx            # Alert/notification
│       └── Tabs.tsx             # Tab navigation
│
├── services/                    # Business Logic Services
│   ├── authService.ts           # Authentication service
│   ├── firebaseService.ts       # Firebase operations
│   ├── adminService.ts          # Admin-specific operations
│   └── [other services].ts      # Future services
│
├── config/                      # Configuration
│   └── firebase.ts              # Firebase initialization
│
├── constants/                   # App Constants
│   └── Colors.ts                # Color scheme
│
├── contexts/                    # React Context
│   ├── ThemeContext.tsx         # Theme management
│   ├── AuthContext.tsx          # Auth state (implied)
│   └── [other contexts].tsx
│
├── hooks/                       # Custom React Hooks
│   ├── useColorScheme.ts        # Color scheme hook
│   ├── useColorScheme.web.ts    # Web-specific version
│   ├── useThemeColor.ts         # Theme color hook
│   └── useThemeToggle.ts        # Theme toggle hook
│
├── types/                       # TypeScript Types
│   ├── user.ts                  # User interfaces
│   └── [other types].ts
│
├── assets/                      # Static Assets
│   ├── fonts/                   # Custom fonts
│   ├── images/                  # Images
│   └── intro-asset/             # Intro images
│
├── android/                     # Android-specific
│   ├── app/
│   │   ├── build.gradle         # Android build config
│   │   ├── src/                 # Android source code
│   │   └── debug.keystore       # Debug keystore
│   └── [gradle config files]
│
├── docs/                        # Documentation
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── ARCHITECTURE_DIAGRAMS.md
│   ├── FIREBASE_SETUP.md
│   ├── ADMIN_SETUP.md
│   ├── ADMIN_WEB_SETUP.md
│   ├── VERCEL_DEPLOYMENT.md
│   ├── EAS_BUILD_GUIDE.md
│   ├── ARDUINO_FIREBASE_INTEGRATION.md
│   ├── COLLABORATION_DEVELOPER_GUIDE.md
│   └── [other docs]
│
├── scripts/                     # Utility Scripts
│   ├── setup-admin-user.js      # Admin user setup
│   └── reset-project.js         # Project reset
│
├── public/                      # Public assets (web)
│
├── app.json                     # Expo config
├── babel.config.js              # Babel config
├── metro.config.js              # Metro bundler config
├── tsconfig.json                # TypeScript config
├── eslint.config.js             # ESLint config
├── package.json                 # Dependencies
└── README.md                    # Project readme

```

---

## Component Dependency Tree

```
App Root (_layout.tsx)
├── AuthContext Provider
│   └── ThemeContext Provider
│       └── Expo Router
│           ├── Auth Routes
│           │   ├── login.tsx
│           │   │   ├── ThemedView
│           │   │   ├── ThemedText
│           │   │   ├── Input
│           │   │   └── Button
│           │   │
│           │   ├── signup.tsx
│           │   │   └── [similar structure]
│           │   │
│           │   └── forgot-password.tsx
│           │       └── [similar structure]
│           │
│           ├── Mobile Routes (tabs)
│           │   └── _layout.tsx (TabNavigation)
│           │       ├── index.tsx (Home)
│           │       │   ├── ThemedView
│           │       │   ├── ParallaxScrollView
│           │       │   ├── ProjectCard (repeated)
│           │       │   │   ├── ThemedText
│           │       │   │   ├── Badge
│           │       │   │   └── Button
│           │       │   └── GlobalAIChat
│           │       │
│           │       ├── dashboard.tsx
│           │       │   ├── ThemedView
│           │       │   ├── TemperatureChart
│           │       │   ├── TimerWidget
│           │       │   ├── ProjectDetailsModal
│           │       │   │   ├── Modal
│           │       │   │   ├── ThemedText
│           │       │   │   ├── Button
│           │       │   │   └── CollaboratorsList
│           │       │   │       ├── Card
│           │       │   │       └── Badge
│           │       │   └── RealTimeListener (Firestore)
│           │       │
│           │       ├── explore.tsx
│           │       │   ├── ThemedView
│           │       │   ├── ScrollView
│           │       │   ├── ProjectCard (multiple)
│           │       │   ├── Input (search)
│           │       │   ├── Select (filter)
│           │       │   └── Loading
│           │       │
│           │       ├── process.tsx
│           │       │   ├── ThemedView
│           │       │   ├── TextInput
│           │       │   ├── Select (status)
│           │       │   ├── Modal
│           │       │   │   ├── Input (project form)
│           │       │   │   ├── Button
│           │       │   │   ├── InventoryList
│           │       │   │   └── CollaboratorsList
│           │       │   ├── ProjectDetailsModal
│           │       │   └── RealTimeListener
│           │       │
│           │       ├── profile.tsx
│           │       │   ├── ThemedView
│           │       │   ├── Card
│           │       │   │   ├── ThemedText
│           │       │   │   └── Badge
│           │       │   ├── Button (Logout)
│           │       │   └── ThemeToggle
│           │       │
│           │       └── admin.tsx
│           │           ├── Button (Admin Portal)
│           │           └── [navigation to admin routes]
│           │
│           └── Admin Routes (admin)
│               └── _layout.tsx (AdminNavigation)
│                   ├── dashboard.tsx
│                   │   ├── ThemedView
│                   │   ├── AnalyticsCharts
│                   │   │   └── [Chart libraries]
│                   │   ├── Card (metrics)
│                   │   └── RealTimeListener
│                   │
│                   ├── users.tsx
│                   │   ├── ThemedView
│                   │   ├── UserManagementTable
│                   │   │   ├── Input (search)
│                   │   │   ├── Select (filter)
│                   │   │   ├── Table/List
│                   │   │   │   └── UserRow
│                   │   │   │       ├── ThemedText
│                   │   │   │       ├── Badge
│                   │   │   │       ├── Button (Edit)
│                   │   │   │       └── Button (Delete)
│                   │   │   └── Modal
│                   │   │       └── UserForm
│                   │   │           ├── Input
│                   │   │           ├── Select (role)
│                   │   │           └── Button
│                   │   └── RealTimeListener
│                   │
│                   ├── projects.tsx
│                   │   ├── ThemedView
│                   │   ├── Input (search)
│                   │   ├── Select (filter/sort)
│                   │   ├── ProjectList
│                   │   │   └── ProjectRow
│                   │   │       ├── ThemedText
│                   │   │       ├── ProgressBar
│                   │   │       └── Button (View)
│                   │   └── Modal
│                   │       └── ProjectDetailsModal
│                   │
│                   ├── complaints.tsx
│                   │   ├── ThemedView
│                   │   ├── ComplaintViewer
│                   │   │   ├── Card
│                   │   │   │   ├── ThemedText
│                   │   │   │   ├── Select (status)
│                   │   │   │   └── Button (Update)
│                   │   │   └── CommentSection
│                   │   └── RealTimeListener
│                   │
│                   └── login.tsx (Admin-specific)
│                       └── [form components]

```

---

## Data Flow Between Components

```
User Opens App
↓
App._layout.tsx
├─ Load Firebase config
├─ Initialize AuthContext
├─ Check persisted auth state
│  └─ onAuthStateChanged()
│     └─ If user exists:
│        ├─ Load user profile from Firestore
│        ├─ Determine role (user, admin, superadmin)
│        └─ Route to appropriate screen
│     └─ If no user:
│        └─ Route to login screen
│
└─ Render Expo Router

If Regular User:
├─ (tabs)/_layout.tsx
│  └─ Render bottom tab navigation
│     ├─ Home tab → index.tsx
│     ├─ Dashboard tab → dashboard.tsx
│     │   └─ firebaseService.getProjects(userId)
│     │      └─ onSnapshot listener
│     │         └─ Real-time project updates
│     │            └─ Update component state
│     │               └─ Re-render ProjectCard components
│     │                  ├─ ThemedText (project name)
│     │                  ├─ Badge (status)
│     │                  └─ Button (view details)
│     │
│     ├─ Explore tab → explore.tsx
│     │   └─ firebaseService.getPublicProjects()
│     │      └─ Display ProjectCard components
│     │         └─ User can click to view details
│     │            └─ Open ProjectDetailsModal
│     │               ├─ Show project info
│     │               ├─ Show collaborators
│     │               └─ Show temperature chart
│     │
│     ├─ Process tab → process.tsx
│     │   └─ firebaseService.createProject(data)
│     │      └─ New project added to Firestore
│     │         └─ Real-time listener triggers
│     │            └─ Project appears in Dashboard
│     │
│     └─ Profile tab → profile.tsx
│         └─ authService.getCurrentUser()
│            └─ Display user info & settings
│
If Admin User:
├─ (admin)/_layout.tsx
│  └─ Render admin navigation
│     ├─ Dashboard → analytics
│     │   └─ adminService.getCompanyMetrics()
│     │      └─ Display AnalyticsCharts
│     │
│     ├─ Users → user management
│     │   └─ adminService.getCompanyUsersList()
│     │      └─ Display UserManagementTable
│     │
│     ├─ Projects → project management
│     │   └─ adminService.getCompanyProjects()
│     │      └─ Display ProjectList
│     │
│     └─ Complaints → complaint management
│         └─ adminService.getComplaints()
│            └─ Display ComplaintViewer

User Interacts (e.g., Create Project):
├─ process.tsx form submission
│  ├─ Validate input
│  ├─ firebaseService.createProject()
│  │  └─ addDoc(collection(db, 'projects'), data)
│  │     └─ Firestore creates document
│  │        └─ Triggers real-time listener
│  │
│  ├─ Navigate to dashboard.tsx
│  │  └─ Real-time listener on projects collection
│  │     └─ Snapshot includes new project
│  │        └─ setState triggers re-render
│  │           └─ New ProjectCard appears
│  │
│  └─ Show success notification
│     └─ Alert or Toast component

User Logs Out:
├─ profile.tsx logout button
│  └─ authService.logout()
│     ├─ signOut() [Firebase Auth]
│     ├─ Clear AuthContext
│     ├─ Clear local storage
│     └─ Expo Router navigates to login.tsx

```

---

## Service Layer Architecture

```
Services (TypeScript Classes)
│
├── authService
│   ├── Properties:
│   │   ├── currentUser (cached user)
│   │   └─ auth (Firebase Auth instance)
│   │
│   ├── Methods:
│   │   ├─ signUp()
│   │   │   ├─ createUserWithEmailAndPassword()
│   │   │   ├─ updateProfile()
│   │   │   └─ Create user document in Firestore
│   │   │
│   │   ├─ login()
│   │   │   ├─ signInWithEmailAndPassword()
│   │   │   └─ Retrieve user profile
│   │   │
│   │   ├─ logout()
│   │   │   └─ signOut()
│   │   │
│   │   ├─ resetPassword()
│   │   │   └─ sendPasswordResetEmail()
│   │   │
│   │   ├─ getCurrentUser()
│   │   │   ├─ Get from cache (fast)
│   │   │   └─ Or fetch from Firestore
│   │   │
│   │   ├─ onAuthStateChanged()
│   │   │   └─ Subscribe to auth state
│   │   │
│   │   ├─ checkAdminStatus()
│   │   │   ├─ Query admins collection
│   │   │   └─ Return admin role
│   │   │
│   │   └─ updateUserProfile()
│   │       └─ updateDoc() in Firestore
│   │
│   └── Error Handling:
│       ├─ Firebase Auth errors
│       ├─ Network errors
│       └─ Firestore errors
│
├── firebaseService
│   ├── Properties:
│   │   ├─ db (Firestore instance)
│   │   ├─ realtimeDb (Realtime DB)
│   │   └─ cache (local data)
│   │
│   ├── Project Methods:
│   │   ├─ createProject(data)
│   │   │   └─ addDoc(collection(db, 'projects'), data)
│   │   │
│   │   ├─ getProjects(userId)
│   │   │   └─ query(collection, where userId)
│   │   │      └─ getDocs() or onSnapshot()
│   │   │
│   │   ├─ updateProject(projectId, updates)
│   │   │   └─ updateDoc(doc(db, 'projects', projectId), updates)
│   │   │
│   │   ├─ deleteProject(projectId)
│   │   │   └─ deleteDoc(doc(db, 'projects', projectId))
│   │   │
│   │   ├─ addCollaborators(projectId, userIds, details)
│   │   │   └─ Update collaborators array in Firestore
│   │   │
│   │   └─ updateCollaboratorBlocks(projectId, userId, blocks)
│   │       └─ Increment blocks for collaborator
│   │
│   ├── Data Methods:
│   │   ├─ createTemperatureLog(data)
│   │   ├─ getTemperatureLogs(projectId)
│   │   ├─ createRawMaterial(data)
│   │   ├─ getRawMaterials(projectId)
│   │   ├─ createRHBRecord(data)
│   │   └─ getRHBRecords(projectId)
│   │
│   ├── Chat Methods:
│   │   ├─ createChatSession(userId)
│   │   ├─ addChatMessage(sessionId, message)
│   │   └─ getChatMessages(sessionId)
│   │
│   ├── Utility Methods:
│   │   ├─ syncLocalDataToFirebase()
│   │   ├─ checkConnection()
│   │   ├─ getFromLocal(key)
│   │   └─ saveToLocal(key, value)
│   │
│   └── Real-time Listeners:
│       ├─ onSnapshot() for Firestore
│       ├─ onValue() for Realtime DB
│       └─ Unsubscribe on cleanup
│
└── adminService
    ├── User Management:
    │   ├─ createAdminUser(email, password, fullName)
    │   ├─ getAdminUsers(companyId)
    │   ├─ updateAdminRole(uid, role)
    │   └─ deleteAdminUser(uid)
    │
    ├── Company Management:
    │   ├─ createCompany(data)
    │   ├─ getCompany(companyId)
    │   ├─ updateCompany(companyId, updates)
    │   └─ getCompanyUsers(companyId)
    │
    ├── Analytics Methods:
    │   ├─ getCompanyMetrics(companyId)
    │   ├─ getUserActivity(userId, dateRange)
    │   └─ getProjectStatistics(companyId)
    │
    ├── Complaint Methods:
    │   ├─ getComplaints(filter)
    │   ├─ updateComplaintStatus(id, status)
    │   └─ assignComplaintToUser(id, userId)
    │
    └── Audit Methods:
        ├─ logAdminAction(action, details)
        └─ getAuditLogs(companyId, dateRange)

```

---

## Data Models & Interfaces

```
TypeScript Interfaces (types/)

┌─ UserProfile
│  ├─ uid: string
│  ├─ fullName: string
│  ├─ username: string
│  ├─ email: string
│  ├─ role: 'user' | 'admin' | 'superadmin'
│  ├─ company?: string
│  ├─ createdAt: Date
│  └─ lastLogin: Date
│
├─ Project
│  ├─ id: string
│  ├─ name: string
│  ├─ blocks: number
│  ├─ estimatedTime: string
│  ├─ remainingTime?: number
│  ├─ pouringTime?: number
│  ├─ date: string
│  ├─ status: 'Queue' | 'Pouring' | 'Mixing' | 'Pouring2' | 'Completed'
│  ├─ userId: string
│  ├─ companyId?: string
│  ├─ collaborators?: Collaborator[]
│  ├─ completedBlocks?: number
│  ├─ createdAt: Date
│  └─ updatedAt: Date
│
├─ Collaborator
│  ├─ userId: string
│  ├─ fullName: string
│  ├─ email: string
│  ├─ blocksContributed: number
│  └─ joinedAt?: Date
│
├─ TemperatureLog
│  ├─ id: string
│  ├─ temperature: number
│  ├─ timestamp: Date
│  ├─ projectId: string
│  ├─ location: string
│  └─ deviceId?: string
│
├─ RawMaterial
│  ├─ id: string
│  ├─ name: string
│  ├─ quantity: number
│  ├─ unit: string
│  ├─ costPerUnit: number
│  ├─ dateAdded: Date
│  └─ projectId: string
│
├─ RHBRecord
│  ├─ id: string
│  ├─ quantity: number
│  ├─ productionDate: Date
│  ├─ projectId: string
│  ├─ qualityGrade: string
│  └─ weight: number
│
├─ ChatSession
│  ├─ id: string
│  ├─ userId: string
│  ├─ startTime: Date
│  ├─ endTime?: Date
│  └─ isActive: boolean
│
├─ ChatMessage
│  ├─ id: string
│  ├─ sessionId: string
│  ├─ message: string
│  ├─ sender: 'user' | 'ai'
│  ├─ timestamp: Date
│  └─ aiResponse?: string
│
├─ Complaint
│  ├─ id: string
│  ├─ userId: string
│  ├─ subject: string
│  ├─ description: string
│  ├─ status: 'open' | 'in-progress' | 'resolved'
│  ├─ createdAt: Date
│  ├─ updatedAt: Date
│  └─ assignedTo?: string
│
├─ Company
│  ├─ id: string
│  ├─ name: string
│  ├─ description?: string
│  ├─ createdAt: Date
│  ├─ updatedAt: Date
│  ├─ createdBy: string
│  ├─ totalAdmins?: number
│  └─ totalUsers?: number
│
└─ AdminUser
   ├─ uid: string
   ├─ email: string
   ├─ fullName: string
   ├─ role: 'admin' | 'superadmin'
   ├─ companyId: string
   ├─ createdAt: Date
   └─ permissions: string[]

```

---

## Context & State Management

```
React Context API Usage:

┌─ AuthContext
│  ├─ Value:
│  │   ├─ currentUser: UserProfile | null
│  │   ├─ isLoading: boolean
│  │   ├─ isAdmin: boolean
│  │   ├─ isSuperAdmin: boolean
│  │   └─ error: string | null
│  │
│  ├─ Provider:
│  │   └─ Wraps entire app in App._layout.tsx
│  │
│  └─ Usage:
│      ├─ useContext(AuthContext)
│      ├─ Check user auth status
│      ├─ Access current user
│      └─ Route based on role
│
├─ ThemeContext
│  ├─ Value:
│  │   ├─ colorScheme: 'light' | 'dark'
│  │   ├─ colors: { light: {...}, dark: {...} }
│  │   └─ toggleTheme: () => void
│  │
│  ├─ Provider:
│  │   └─ Wraps entire app
│  │
│  └─ Usage:
│      ├─ useContext(ThemeContext)
│      ├─ ThemedView uses colors
│      ├─ ThemedText uses colors
│      └─ Apply theme throughout app
│
└─ Component Local State (useState):
   ├─ Form data
   ├─ Modal visibility
   ├─ Loading states
   ├─ Error messages
   ├─ Projects array
   ├─ Collaborators array
   └─ Real-time listener data

```

---

## Routing Structure

```
Expo Router - File-based Routing

/                           (Root)
├── login.tsx               GET  /login
├── signup.tsx              GET  /signup
├── forgot-password.tsx     GET  /forgot-password
├── terms.tsx               GET  /terms
├── intro.tsx               GET  /intro
├── landing.tsx             GET  /landing
│
├── (tabs)/                 (Tab Group - Mobile)
│   ├── _layout.tsx         (Tab Navigation)
│   ├── index.tsx           GET  /
│   ├── dashboard.tsx       GET  /dashboard
│   ├── explore.tsx         GET  /explore
│   ├── process.tsx         GET  /process
│   ├── profile.tsx         GET  /profile
│   ├── admin.tsx           GET  /admin
│   └── [routes].tsx        Dynamic routes
│
├── (admin)/                (Admin Group - Web)
│   ├── _layout.tsx         (Admin Navigation)
│   ├── index.tsx           GET  /admin
│   ├── dashboard.tsx       GET  /admin/dashboard
│   ├── users.tsx           GET  /admin/users
│   ├── projects.tsx        GET  /admin/projects
│   ├── complaints.tsx      GET  /admin/complaints
│   ├── login.tsx           GET  /admin/login
│   └── [routes].tsx        Dynamic routes
│
└── +not-found.tsx          GET  /* (404)

Platform-specific Routing:
├─ Mobile (iOS/Android)
│  └─ Loads (tabs) routes
│     └─ Bottom tab navigation
│
└─ Web (Admin)
   └─ Loads (admin) routes
      └─ Side/top navigation

Programmatic Navigation:
├─ router.push('/projects/123')
├─ router.replace('/login')
├─ router.back()
└─ Link component <Link href="/dashboard">

```

---

## Custom Hooks

```
Hooks Directory (hooks/)

useColorScheme.ts           Platform Color Scheme
├─ Returns: 'light' | 'dark' | null
├─ Usage:
│  └─ const colorScheme = useColorScheme();
│
└─ Web version (.web.ts):
   └─ Checks system preference

useColorScheme.web.ts       Web-specific Hook
├─ Uses: window.matchMedia
├─ Returns: 'light' | 'dark'
└─ Usage: Admin panel styling

useThemeColor.ts           Theme Color Lookup
├─ Props: colorName: string
├─ Returns: color value
├─ Usage:
│  └─ const backgroundColor = useThemeColor({light: '#fff', dark: '#000'});
│
└─ Combines with useColorScheme()

useThemeToggle.ts          Theme Toggle
├─ Returns: toggleTheme() function
├─ Usage:
│  └─ onClick={() => toggleTheme()}
│
└─ Updates AuthContext

Future Custom Hooks:
├─ useProjects()            Project data
├─ useCollaborators()       Collaborators list
├─ useTemperature()         Temperature data
├─ useProjectStatus()       Real-time status
├─ useAdminMetrics()        Admin analytics
├─ useLocalStorage()        AsyncStorage wrapper
└─ useFirebase()            Firebase wrapper

```

---

**Last Updated**: February 2, 2026
**Component Architecture Version**: 2.0
