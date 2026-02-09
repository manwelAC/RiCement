# RiCement - Technical System Architecture (Netflix-Style)

## Complete Technical Architecture Overview

```
╔════════════════════════════════════════════════════════════════════════════════════════════╗
║                          RICEMENT TECHNICAL ARCHITECTURE                                  ║
║                        (Reference: Netflix Architecture Pattern)                          ║
╚════════════════════════════════════════════════════════════════════════════════════════════╝


┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENT LAYER                                              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                         │
│  │  iOS Devices     │  │ Android Devices  │  │ Web Browser      │                         │
│  │                  │  │                  │  │ (Admin Panel)    │                         │
│  │ • iPhone         │  │ • Samsung        │  │ • Chrome         │                         │
│  │ • iPad           │  │ • Pixel          │  │ • Firefox        │                         │
│  │ • Apple Watch    │  │ • OnePlus        │  │ • Safari         │                         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘                         │
│           │                      │                      │                                   │
│           └──────────────────────┼──────────────────────┘                                   │
│                                  │                                                         │
└──────────────────────────────────┼─────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    LOAD BALANCER (ELB)     │
                    │  • Geographic routing      │
                    │  • Health checks           │
                    │  • SSL/TLS termination     │
                    └──────────────┬──────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
       ┌────────▼────────┐ ┌───────▼────────┐ ┌──────▼──────────┐
       │   EXPO ROUTER   │ │  EXPO ROUTER   │ │  VERCEL EDGE    │
       │  (iOS/Android)  │ │  (Web)         │ │  NETWORK        │
       │                 │ │                │ │                 │
       │ • Routing layer │ │ • URL rewrite  │ │ • CDN caching   │
       │ • Navigation    │ │ • Route guard  │ │ • Compression   │
       │ • Deep linking  │ │ • Fallback     │ │ • GeoIP routing │
       └────────┬────────┘ └────────┬───────┘ └────────┬────────┘
                │                   │                   │
                └───────────────────┼───────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│               APPLICATION LAYER (React Native + React Web)            │
├───────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  Route Handler (_layout.tsx, _auth.tsx, (tabs), (admin))       │  │
│  │  • Platform detection                                          │  │
│  │  • Conditional rendering                                       │  │
│  │  • Context initialization                                      │  │
│  └───────────────────┬──────────────────────────────────────────┘  │
│                      │                                              │
│  ┌───────────────────▼──────────────────────────────────────────┐  │
│  │  View Layer (Components)                                     │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  Mobile Views:              Admin Views:                    │  │
│  │  • dashboard.tsx            • dashboard.tsx                 │  │
│  │  • explore.tsx              • users.tsx                     │  │
│  │  • process.tsx              • projects.tsx                  │  │
│  │  • profile.tsx              • complaints.tsx                │  │
│  │                             • analytics.tsx                 │  │
│  │  Shared Components:                                          │  │
│  │  • ProjectDetailsModal      • TemperatureChart              │  │
│  │  • GlobalAIChat             • ThemedView/ThemedText         │  │
│  │  • Model3DViewer            • ProjectCard                   │  │
│  │                                                              │  │
│  └───────────────────┬──────────────────────────────────────────┘  │
│                      │                                              │
│  ┌───────────────────▼──────────────────────────────────────────┐  │
│  │  State Management Layer                                      │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  Context API:              Local State (useState):           │  │
│  │  • AuthContext             • Form data                      │  │
│  │  • ThemeContext            • Modal visibility               │  │
│  │  • User Profile Context    • Loading states                │  │
│  │                            • Error messages                 │  │
│  │  Real-time Listeners:      Cache Layer:                     │  │
│  │  • onSnapshot              • AsyncStorage                   │  │
│  │  (Firestore)               • Projects cache                │  │
│  │  • onValue                 • User profile cache             │  │
│  │  (Realtime DB)             • Temperature logs               │  │
│  │                                                              │  │
│  └───────────────────┬──────────────────────────────────────────┘  │
│                      │                                              │
└──────────────────────┼──────────────────────────────────────────────┘
                       │
      ┌────────────────▼────────────────┐
      │    API GATEWAY & MIDDLEWARE     │
      ├─────────────────────────────────┤
      │                                 │
      │ • Request validation            │
      │ • Authentication middleware     │
      │ • Error handling                │
      │ • Rate limiting                 │
      │ • Request/Response logging      │
      │ • CORS handling                 │
      │                                 │
      └────────────────┬────────────────┘
                       │
    ┌──────────────────┼──────────────────┐
    │                  │                  │
    ▼                  ▼                  ▼

┌──────────────────────────────────────────────────────────────────────────────┐
│                        SERVICES LAYER (TypeScript)                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │  Authentication Service │  │  Firebase Service (Data Operations)     │  │
│  ├─────────────────────────┤  ├─────────────────────────────────────────┤  │
│  │                         │  │                                         │  │
│  │ Methods:                │  │ Methods:                                │  │
│  │ • signUp()              │  │ • createProject()                       │  │
│  │ • login()               │  │ • getProjects()                         │  │
│  │ • logout()              │  │ • updateProject()                       │  │
│  │ • resetPassword()       │  │ • deleteProject()                       │  │
│  │ • getCurrentUser()      │  │ • addCollaborators()                    │  │
│  │ • checkRole()           │  │ • createTemperatureLog()                │  │
│  │ • updateProfile()       │  │ • getTemperatureLogs()                  │  │
│  │ • signInAnonymously()   │  │ • createRawMaterial()                   │  │
│  │                         │  │ • createRHBRecord()                     │  │
│  │ State:                  │  │ • createChatSession()                   │  │
│  │ • currentUser           │  │ • addChatMessage()                      │  │
│  │ • isAuthenticated       │  │ • syncLocalDataToFirebase()             │  │
│  │ • currentRole           │  │                                         │  │
│  │ • sessionToken          │  │ State:                                  │  │
│  │                         │  │ • db (Firestore instance)               │  │
│  │ Firebase Auth Client:   │  │ • realtimeDb (Realtime DB)              │  │
│  │ • EmailAuthProvider     │  │ • storage (Cloud Storage)               │  │
│  │ • AuthStateListener     │  │ • listeners (active subscriptions)      │  │
│  │ • TokenRefresh          │  │                                         │  │
│  └─────────────────────────┘  └─────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Admin Service (Company & User Management)                           │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │ Methods:                                                             │  │
│  │ • createAdminUser()        • createCompany()                        │  │
│  │ • getAdminUsers()          • getCompanyUsers()                      │  │
│  │ • updateAdminRole()        • updateCompany()                        │  │
│  │ • deleteAdminUser()        • getCompanyMetrics()                    │  │
│  │ • getComplaints()          • getUserActivity()                      │  │
│  │ • updateComplaintStatus()  • getProjectStatistics()                 │  │
│  │ • logAdminAction()         • getAuditLogs()                         │  │
│  │                                                                       │  │
│  │ State:                                                               │  │
│  │ • currentCompanyId         • currentAdminRole                       │  │
│  │ • permissions              • auditLog                               │  │
│  │                                                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────┬───────────────────────────────────────────────────────────────────┘
           │
           │ (Firebase SDK v12.4.0)
           │ • initializeApp()
           │ • initializeFirestore()
           │ • getAuth()
           │ • getDatabase()
           │ • getStorage()
           │
    ┌──────▼────────────────────────────────────────────────────────┐
    │           DATA ACCESS LAYER (Firebase SDK)                   │
    ├────────────────────────────────────────────────────────────────┤
    │                                                                │
    │  Firestore SDK Methods:        Realtime DB SDK Methods:      │
    │  • collection()                • ref()                        │
    │  • doc()                       • onValue()                    │
    │  • query()                     • set()                        │
    │  • where()                     • update()                     │
    │  • orderBy()                   • remove()                     │
    │  • limit()                     • off()                        │
    │  • getDocs()                                                  │
    │  • getDoc()                    Cloud Storage SDK:            │
    │  • onSnapshot()                • ref()                        │
    │  • addDoc()                    • uploadBytes()               │
    │  • updateDoc()                 • getBytes()                  │
    │  • deleteDoc()                 • getDownloadURL()            │
    │  • setDoc()                    • delete()                    │
    │                                • list()                      │
    │  Connection Management:                                       │
    │  • enableNetworkAccess()                                      │
    │  • disableNetworkAccess()                                     │
    │  • Offline Persistence (automatic)                           │
    │                                                                │
    └──────┬─────────────────────────────────────────────────────────┘
           │
    ┌──────▼────────────────────────────────────────────────────────┐
    │      FIREBASE BACKEND (Google Cloud Infrastructure)          │
    ├────────────────────────────────────────────────────────────────┤
    │                                                                │
    │  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ │
    │  │ Firebase Auth    │ │  Firestore       │ │  Cloud Store │ │
    │  │                  │ │  Database        │ │              │ │
    │  │ • User mgmt      │ │                  │ │ • Images     │ │
    │  │ • Credentials    │ │ • Collections:   │ │ • Documents  │ │
    │  │ • Sessions       │ │   - users        │ │ • 3D Models  │ │
    │  │ • Email verify   │ │   - projects     │ │ • Files      │ │
    │  │ • OAuth tokens   │ │   - admins       │ │              │ │
    │  │                  │ │   - companies    │ │ • Location:  │ │
    │  │ Tech:            │ │   - temperatures │ │   us-central1│ │
    │  │ • Firebase Auth  │ │   - materials    │ │              │ │
    │  │ • Google OAuth   │ │   - chats        │ │ Tech:        │ │
    │  │                  │ │   - complaints   │ │ • GCS buckets│ │
    │  │ Replication:     │ │                  │ │ • CDN        │ │
    │  │ • Multi-region   │ │ • Indexes        │ │ • Versioning│ │
    │  │ • Real-time sync │ │ • Triggers       │ │              │ │
    │  │                  │ │ • Rules engine   │ │ Replication: │ │
    │  │ Latency:         │ │                  │ │ • Multi-reg  │ │
    │  │ • < 100ms        │ │ • Sharding       │ │ • CDN dist   │ │
    │  │                  │ │ • Auto-scaling   │ │              │ │
    │  │ Throughput:      │ │                  │ │ Latency:     │ │
    │  │ • Unlimited auth │ │ Limits:          │ │ • < 50ms     │ │
    │  │                  │ │ • 50K reads/sec  │ │ • w/ CDN     │ │
    │  │                  │ │ • 20K writes/sec │ │              │ │
    │  │                  │ │ • 1MB/doc max    │ │              │ │
    │  └──────────────────┘ └──────────────────┘ └──────────────┘ │
    │                                                                │
    │  ┌──────────────────────────────────────────────────────────┐ │
    │  │  Firebase Realtime Database (Manual Projects & Status)  │ │
    │  ├──────────────────────────────────────────────────────────┤ │
    │  │  • Path: /manual_projects/{projectId}                   │ │
    │  │  • Nodes: timerActive, status, lastUpdate               │ │
    │  │  • WebSocket connection (ultra-fast)                    │ │
    │  │  • Throughput: Thousands of concurrent connections      │ │
    │  │  • Latency: < 50ms                                       │ │
    │  │  • JSON tree structure (NoSQL)                           │ │
    │  │  • Auto-scaling                                          │ │
    │  │                                                           │ │
    │  └──────────────────────────────────────────────────────────┘ │
    │                                                                │
    │  ┌──────────────────────────────────────────────────────────┐ │
    │  │        Security Rules Engine (Firestore)               │ │
    │  ├──────────────────────────────────────────────────────────┤ │
    │  │                                                           │ │
    │  │ Rules Version 2 Format:                                 │ │
    │  │ • path-based matching                                   │ │
    │  │ • Custom functions (isAdmin, isSuperAdmin, etc)         │ │
    │  │ • Request validation                                    │ │
    │  │ • Resource comparison                                   │ │
    │  │ • Timestamp checking                                    │ │
    │  │                                                           │ │
    │  │ Enforcement:                                             │ │
    │  │ • Every read enforced                                    │ │
    │  │ • Every write enforced                                   │ │
    │  │ • Server-side evaluation (cannot bypass)                 │ │
    │  │ • < 5ms evaluation per request                          │ │
    │  │                                                           │ │
    │  └──────────────────────────────────────────────────────────┘ │
    │                                                                │
    └────────────────────────────────────────────────────────────────┘
           │
    ┌──────▼────────────────────────────────────────────────────────┐
    │       INFRASTRUCTURE LAYER (Google Cloud Platform)           │
    ├────────────────────────────────────────────────────────────────┤
    │                                                                │
    │  ┌─────────────────────────────────────────────────────────┐ │
    │  │ Compute:                                               │ │
    │  │ • Cloud Run (Firebase backend)                         │ │
    │  │ • App Engine (API handling)                            │ │
    │  │ • Cloud Functions (Triggers)                           │ │
    │  │   - onCreateProject()                                  │ │
    │  │   - onDeleteProject()                                  │ │
    │  │   - onUpdateComplaint()                                │ │
    │  │   - generateReport()                                   │ │
    │  └─────────────────────────────────────────────────────────┘ │
    │                                                                │
    │  ┌─────────────────────────────────────────────────────────┐ │
    │  │ Storage:                                               │ │
    │  │ • Cloud Datastore (Metadata)                           │ │
    │  │ • Cloud SQL (Analytics warehouse)                      │ │
    │  │ • BigQuery (Analytics & reporting)                     │ │
    │  │ • Cloud Storage (File storage - GCS)                   │ │
    │  │ • Memorystore (Redis cache)                            │ │
    │  └─────────────────────────────────────────────────────────┘ │
    │                                                                │
    │  ┌─────────────────────────────────────────────────────────┐ │
    │  │ Networking:                                            │ │
    │  │ • Cloud Load Balancing                                 │ │
    │  │ • Cloud CDN (Content delivery)                         │ │
    │  │ • Cloud Armor (DDoS protection)                        │ │
    │  │ • Cloud VPN (Secure tunneling)                         │ │
    │  │ • Service Mesh (Traffic management)                    │ │
    │  └─────────────────────────────────────────────────────────┘ │
    │                                                                │
    │  ┌─────────────────────────────────────────────────────────┐ │
    │  │ Monitoring & Observability:                            │ │
    │  │ • Cloud Monitoring (Metrics)                           │ │
    │  │ • Cloud Logging (Log aggregation)                      │ │
    │  │ • Cloud Trace (Distributed tracing)                    │ │
    │  │ • Error Reporting (Error tracking)                     │ │
    │  │ • Cloud Profiler (Performance profiling)               │ │
    │  │ • Alert Policies (Threshold-based alerts)              │ │
    │  └─────────────────────────────────────────────────────────┘ │
    │                                                                │
    │  ┌─────────────────────────────────────────────────────────┐ │
    │  │ Security:                                              │ │
    │  │ • Cloud IAM (Identity & Access)                        │ │
    │  │ • Cloud KMS (Key management)                           │ │
    │  │ • VPC Service Controls (Perimeter security)            │ │
    │  │ • Secret Manager (Secrets)                             │ │
    │  │ • Certificate Authority (PKI)                          │ │
    │  └─────────────────────────────────────────────────────────┘ │
    │                                                                │
    └────────────────────────────────────────────────────────────────┘
           │
    ┌──────▼────────────────────────────────────────────────────────┐
    │           EXTERNAL SERVICES & INTEGRATIONS                   │
    ├────────────────────────────────────────────────────────────────┤
    │                                                                │
    │  ┌──────────────────────────────────────────────────────────┐ │
    │  │ Google Gemini API (AI Chat)                             │ │
    │  │                                                           │ │
    │  │ • Endpoint: https://generativelanguage.googleapis.com   │ │
    │  │ • Model: gemini-pro (or latest)                         │ │
    │  │ • Request rate: 60 RPM / 60 requests per minute         │ │
    │  │ • Timeout: 30 seconds                                    │ │
    │  │ • Auth: API Key (EXPO_PUBLIC_GEMINI_API_KEY)            │ │
    │  │ • Response format: JSON (streaming supported)           │ │
    │  │ • Context window: 32K tokens                             │ │
    │  │ • Latency: 1-5 seconds per response                     │ │
    │  │ • Features:                                              │ │
    │  │   - Multi-turn conversations                             │ │
    │  │   - Context awareness                                    │ │
    │  │   - Code generation                                      │ │
    │  │   - Content moderation                                   │ │
    │  │                                                           │ │
    │  └──────────────────────────────────────────────────────────┘ │
    │                                                                │
    │  ┌──────────────────────────────────────────────────────────┐ │
    │  │ Arduino / ESP8266 IoT Integration                        │ │
    │  │                                                           │ │
    │  │ Hardware:                                                │ │
    │  │ • ESP8266 or Arduino with WiFi shield                   │ │
    │  │ • DS18B20 Temperature sensor                             │ │
    │  │ • Relay module (5V)                                      │ │
    │  │ • Power supply                                           │ │
    │  │                                                           │ │
    │  │ Communication:                                            │ │
    │  │ • WiFi 802.11 b/g/n (2.4GHz)                             │ │
    │  │ • HTTP/HTTPS (TLS 1.2)                                   │ │
    │  │ • Firestore REST API v1                                  │ │
    │  │ • Firebase Realtime DB Websocket                         │ │
    │  │                                                           │ │
    │  │ API Endpoints:                                            │ │
    │  │ • POST /firestore/../documents:batchWrite                │ │
    │  │ • POST /firestore/../documents:runQuery                  │ │
    │  │ • POST /database/root/temperature.json                   │ │
    │  │                                                           │ │
    │  │ Data Format:                                              │ │
    │  │ • JSON (temperature: 65.5, timestamp: 1707023400)        │ │
    │  │ • Frequency: Every 30 seconds                            │ │
    │  │ • Retry: Exponential backoff (2s, 4s, 8s)               │ │
    │  │                                                           │ │
    │  │ Security:                                                 │ │
    │  │ • API Key (restricted to Firestore only)                 │ │
    │  │ • Firestore rules restrict write access                  │ │
    │  │ • HTTPS (TLS 1.2+)                                       │ │
    │  │ • Device ID in headers                                   │ │
    │  │                                                           │ │
    │  └──────────────────────────────────────────────────────────┘ │
    │                                                                │
    │  ┌──────────────────────────────────────────────────────────┐ │
    │  │ Vercel Hosting (Admin Web Panel)                         │ │
    │  │                                                           │ │
    │  │ • Platform: Vercel Edge Functions                        │ │
    │  │ • Runtime: Node.js 18+ (Serverless)                      │ │
    │  │ • Build: expo export -p web                              │ │
    │  │ • Output: Static SPA + serverless functions              │ │
    │  │ • CDN: Global edge network (200+ PoPs)                   │ │
    │  │ • Regions: Auto-scale globally                           │ │
    │  │ • Deployment: Auto on git push                           │ │
    │  │ • Monitoring: Built-in analytics & logs                  │ │
    │  │ • Auto-scaling: Infinite (pay-per-execution)             │ │
    │  │ • Latency: < 100ms globally                              │ │
    │  │ • SSL/TLS: Automatic (Let's Encrypt)                     │ │
    │  │                                                           │ │
    │  └──────────────────────────────────────────────────────────┘ │
    │                                                                │
    │  ┌──────────────────────────────────────────────────────────┐ │
    │  │ EAS Build & Submit (Mobile CI/CD)                        │ │
    │  │                                                           │ │
    │  │ • Service: Expo Application Services                     │ │
    │  │ • Build Workers: Managed by EAS                          │ │
    │  │ • Build time: 10-30 minutes                               │ │
    │  │ • Output: APK (Android), IPA (iOS)                       │ │
    │  │ • Distribution:                                           │ │
    │  │   - Internal testing (EAS)                                │ │
    │  │   - Play Store (Android)                                  │ │
    │  │   - App Store (iOS)                                       │ │
    │  │ • Signing: Automatic (with credentials)                  │ │
    │  │ • Versioning: From app.json                              │ │
    │  │ • Notifications: Build status updates                    │ │
    │  │                                                           │ │
    │  └──────────────────────────────────────────────────────────┘ │
    │                                                                │
    └────────────────────────────────────────────────────────────────┘
```

---

## Detailed Technical Flow Diagrams

### 1. User Authentication & Session Management Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│              AUTHENTICATION FLOW - TECHNICAL DEEP DIVE                  │
└─────────────────────────────────────────────────────────────────────────┘

CLIENT (Mobile/Web)
    │
    ├─→ User Input: email, password
    │   └─→ POST /auth/login (Local endpoint)
    │
    ├─→ authService.login(email, password)
    │   │
    │   └─→ signInWithEmailAndPassword(auth, email, password)
    │       │
    │       ├─→ HTTPS POST to:
    │       │   https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword
    │       │
    │       ├─→ Request Body:
    │       │   {
    │       │     "email": "user@example.com",
    │       │     "password": "hashedPassword",
    │       │     "returnSecureToken": true
    │       │   }
    │       │
    │       ├─→ Firebase Auth Service (Google)
    │       │   │
    │       │   ├─→ Validate email format
    │       │   ├─→ Query user DB
    │       │   ├─→ Hash & compare password
    │       │   ├─→ Generate JWT tokens
    │       │   └─→ Update lastLogin timestamp
    │       │
    │       └─→ Response:
    │           {
    │             "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImFiYzEyMy4uLiJ9...",
    │             "email": "user@example.com",
    │             "refreshToken": "def456...",
    │             "expiresIn": "3600",
    │             "localId": "uid123"
    │           }
    │
    ├─→ Store tokens locally:
    │   │
    │   ├─→ Auth SDK automatically:
    │   │   ├─ Stores idToken in memory
    │   │   ├─ Stores refreshToken in secure storage
    │   │   └─ Sets expiration (1 hour)
    │   │
    │   └─→ App persists state:
    │       ├─ AsyncStorage (encryption platform-specific)
    │       └─ Auth context
    │
    ├─→ Fetch User Profile:
    │   │
    │   └─→ getDoc(doc(db, 'users', uid))
    │       │
    │       ├─→ HTTPS GET:
    │       │   https://firestore.googleapis.com/v1/projects/ricement-app/
    │       │   databases/(default)/documents/users/{uid}
    │       │
    │       ├─→ Firestore Security Rules checked:
    │       │   allow read: if request.auth.uid == userId
    │       │
    │       └─→ Response (Firestore Document):
    │           {
    │             "name": "projects/ricement-app/databases/(default)/
    │                      documents/users/uid123",
    │             "fields": {
    │               "email": {"stringValue": "user@example.com"},
    │               "fullName": {"stringValue": "John Doe"},
    │               "role": {"stringValue": "user"},
    │               "createdAt": {"timestampValue": "2024-02-01T10:00:00Z"}
    │             }
    │           }
    │
    ├─→ Update AuthContext:
    │   │
    │   └─→ {
    │         currentUser: {...},
    │         isAuthenticated: true,
    │         isAdmin: false,
    │         token: idToken
    │       }
    │
    └─→ Route based on role:
        ├─ Role === 'user' → /dashboard
        └─ Role === 'admin' → /admin/dashboard


TOKEN REFRESH (Background):
    │
    ├─→ Every 30 minutes (before expiry):
    │
    ├─→ refreshToken sent to Firebase Auth
    │
    ├─→ Firebase generates new idToken
    │
    └─→ Token updated in memory & storage


LOGOUT:
    │
    ├─→ authService.logout()
    │
    ├─→ signOut(auth)
    │   │
    │   ├─→ Clear idToken (memory)
    │   ├─→ Clear refreshToken (secure storage)
    │   ├─→ Revoke sessions on server
    │   └─→ Clear AuthContext
    │
    └─→ Route to /login screen
```

---

### 2. Real-Time Data Synchronization Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│        REAL-TIME SYNC - FIRESTORE LISTENERS & WEBSOCKETS                │
└──────────────────────────────────────────────────────────────────────────┘

CLIENT APPLICATION:
    │
    ├─→ Component mounts (useEffect)
    │   │
    │   └─→ onSnapshot(query(...), callback)
    │       │
    │       ├─→ Creates persistent listener
    │       │   ├─ Opens WebSocket connection
    │       │   ├─ Firestore < 100ms latency
    │       │   └─ Compression: gzip
    │       │
    │       └─→ Initial document snapshot sent
    │           └─→ Callback triggered
    │               └─→ setState(projects)
    │                   └─→ Component re-renders
    │
    ├─→ Wait for updates (listener active)
    │   │
    │   ├─→ Server detects document change
    │   │   ├─ Another client updates document
    │   │   ├─ Firestore writes change to:
    │   │   │  ├─ In-memory database (microseconds)
    │   │   │  ├─ Regional storage (milliseconds)
    │   │   │  ├─ Multi-region replication
    │   │   │  └─ Backup storage
    │   │   │
    │   │   └─→ Change captured in change stream
    │   │       └─→ WebSocket notified
    │   │
    │   └─→ Server sends delta (only changed fields)
    │       │
    │       ├─→ Firestore compares states:
    │       │   Old: {name: "A", status: "Queue"}
    │       │   New: {name: "A", status: "Pouring"}
    │       │   Delta: {status: "Pouring"}
    │       │
    │       └─→ WebSocket frame sent (~5KB for typical update)
    │           └─→ Compression applied
    │               └─→ < 100 bytes over network
    │
    ├─→ Client receives update
    │   │
    │   ├─→ Firestore SDK processes:
    │   │   ├─ Merge delta with local cache
    │   │   ├─ Update offline persistence
    │   │   ├─ Call onSnapshot callback
    │   │   └─ Pass new snapshot
    │   │
    │   └─→ Callback function:
    │       setState(projects) → React re-render
    │                              └─→ UI updated < 100ms
    │
    └─→ Component unmounts
        │
        ├─→ useEffect cleanup called
        │
        └─→ unsubscribe()
            ├─ Close WebSocket
            ├─ Remove listener from Firestore
            └─ Stop receiving updates


OFFLINE PERSISTENCE:
    │
    ├─→ Internet disconnected
    │
    ├─→ Firestore cache activated
    │   │
    │   ├─→ Local data (IndexedDB on web, SQLite on mobile)
    │   ├─→ Up to unlimited size (configured)
    │   └─→ Automatic sync when online
    │
    ├─→ App continues using cached data
    │   ├─ Reads served from cache
    │   ├─ UI shows "offline" indicator
    │   └─ Writes queued locally
    │
    └─→ Internet reconnected
        │
        ├─→ Sync queued writes to Firestore
        │
        ├─→ Re-subscribe to listeners
        │
        └─→ Receive latest server data
            └─→ UI updates with fresh data


BATCH UPDATES (Multi-client):
    │
    ├─→ User A updates project status
    │   └─→ updateDoc(projectRef, {status: "Pouring"})
    │
    ├─→ User B gets real-time update
    │   ├─→ Listener receives snapshot
    │   └─→ setState triggers re-render
    │
    ├─→ User C adds collaborator
    │   └─→ updateDoc(projectRef, {collaborators: [...]})
    │
    ├─→ User A & B get update
    │   └─→ Same listener fires (document changed)
    │       └─→ New collaborators visible
    │
    └─→ All 3 users see consistent state
        └─→ Eventual consistency (< 100ms)
```

---

### 3. Temperature Monitoring Pipeline (IoT Integration)

```
┌──────────────────────────────────────────────────────────────────────────┐
│         IOT TEMPERATURE MONITORING PIPELINE - TECHNICAL                  │
└──────────────────────────────────────────────────────────────────────────┘

ARDUINO/ESP8266 DEVICE:
    │
    ├─→ Boot Sequence:
    │   │
    │   ├─→ Initialize GPIO pins
    │   │   ├─ Pin D1 = Relay output
    │   │   ├─ Pin D4 = LED indicator
    │   │   └─ Pin D2 = Temperature sensor (OneWire)
    │   │
    │   ├─→ Initialize OneWire protocol (DS18B20)
    │   │   ├─ Parasitic power mode
    │   │   ├─ Resolution: 12-bit (0.0625°C)
    │   │   └─ Max sensors: 8 on single pin
    │   │
    │   ├─→ Connect to WiFi:
    │   │   │
    │   │   └─→ WiFi.begin(SSID, PASSWORD)
    │   │       │
    │   │       ├─→ Scan available networks
    │   │       ├─→ Connect to SSID
    │   │       ├─→ DHCP handshake
    │   │       ├─→ Obtain IP address (< 5 seconds)
    │   │       └─→ Keep-alive heartbeat every 30 seconds
    │   │
    │   └─→ Initialize HTTPS
    │       ├─ Load TLS certificates
    │       └─ Verify server fingerprint (or full cert)
    │
    ├─→ Main Loop (Every 30 seconds):
    │   │
    │   ├─→ Read Temperature:
    │   │   │
    │   │   └─→ sensors.requestTemperatures()
    │   │       │
    │   │       ├─→ Send reset pulse on OneWire
    │   │       ├─→ Send read command to sensor
    │   │       ├─→ Sensor measures temperature
    │   │       ├─→ Conversion time: ~750ms
    │   │       └─→ Return: 65.5°C (float)
    │   │
    │   ├─→ Format JSON Payload:
    │   │   │
    │   │   └─→ {
    │   │       "fields": {
    │   │         "temperature": {"doubleValue": 65.5},
    │   │         "timestamp": {"timestampValue": "2024-02-02T10:30:00Z"},
    │   │         "projectId": {"stringValue": "proj123"},
    │   │         "location": {"stringValue": "tank1"},
    │   │         "deviceId": {"stringValue": "arduino_01"},
    │   │         "humidity": {"doubleValue": 45.2},
    │   │         "signal": {"integerValue": "-67"}
    │   │       }
    │   │     }
    │   │
    │   ├─→ HTTPS POST to Firestore REST API:
    │   │   │
    │   │   └─→ POST https://firestore.googleapis.com/v1/projects/ricement-app/
    │   │       databases/(default)/documents/temperatureLogs
    │   │
    │   │       Headers:
    │   │       Content-Type: application/json
    │   │       Authorization: Bearer {API_KEY}
    │   │       User-Agent: Arduino-ESP8266/1.0
    │   │
    │   │       Body: [JSON above]
    │   │
    │   │       TLS: 1.2+ (256-bit AES encryption)
    │   │
    │   ├─→ Firestore Request Processing:
    │   │   │
    │   │   ├─→ API Gateway receives request
    │   │   │   ├─ Rate limiting check
    │   │   │   ├─ Auth validation (API key)
    │   │   │   └─ Quota check
    │   │   │
    │   │   ├─→ Security Rules Engine
    │   │   │   ├─ rule: allow create if deviceId == arduino_01
    │   │   │   ├─ Validate request
    │   │   │   └─ Calculate cost (1 write = 1 write unit)
    │   │   │
    │   │   ├─→ Document Creation:
    │   │   │   ├─ Generate doc ID (auto)
    │   │   │   ├─ Validate schema
    │   │   │   └─ Store in Firestore:
    │   │   │       /temperatureLogs/{docId}
    │   │   │
    │   │   ├─→ Replication:
    │   │   │   ├─ Write to regional storage
    │   │   │   ├─ Async replication to other regions
    │   │   │   └─ Backup storage
    │   │   │
    │   │   └─→ Trigger Listeners:
    │   │       └─ Send update to all subscribed clients
    │   │
    │   └─→ Response from Firestore:
    │       │
    │       ├─→ HTTP 200 (Success)
    │       │   │
    │       │   ├─→ Response Body:
    │       │   │   {
    │       │   │     "name": "projects/ricement-app/databases/(default)/
    │       │   │              documents/temperatureLogs/abc123",
    │       │   │     "fields": {...},
    │       │   │     "createTime": "2024-02-02T10:30:00.123Z",
    │       │   │     "updateTime": "2024-02-02T10:30:00.123Z"
    │       │   │   }
    │       │   │
    │       │   └─→ Arduino processes response:
    │       │       ├─ Parse JSON
    │       │       ├─ Blink LED (success)
    │       │       └─ Log to serial
    │       │
    │       └─→ HTTP Error (Retry Logic):
    │           │
    │           ├─→ If 429 (Too Many Requests): Wait 60s, retry
    │           ├─→ If 401 (Auth Failed): Alert user
    │           ├─→ If 500 (Server Error): Exponential backoff (2s, 4s, 8s)
    │           └─→ If Network Timeout: Retry with 2s wait
    │
    └─→ Manage Local Queue:
        │
        ├─→ If WiFi offline: Store in EEPROM (1KB)
        │   ├─ Max 20 readings in queue
        │   ├─ Oldest reading discarded if full
        │   └─ Sync when WiFi returns
        │
        └─→ Status LED: Indicates WiFi & storage status
            ├─ Green = WiFi + Posted
            ├─ Yellow = WiFi only
            └─ Red = Offline/Error


MOBILE APP - REAL-TIME DISPLAY:
    │
    ├─→ TemperatureChart Component mounts
    │   │
    │   └─→ onSnapshot(
    │       query(
    │         collection(db, 'temperatureLogs'),
    │         where('projectId', '==', projectId),
    │         orderBy('timestamp', 'desc')
    │       ),
    │       (snapshot) => {
    │         setTemperatureData(snapshot.docs.map(doc => doc.data()));
    │       }
    │     )
    │
    ├─→ Initial snapshot: Last 100 readings
    │   └─→ Render chart with historical data
    │
    ├─→ New reading posted by Arduino
    │   │
    │   ├─→ Firestore notifies via WebSocket
    │   │
    │   ├─→ Listener callback receives snapshot
    │   │
    │   ├─→ setState(temperatureData) with new point
    │   │
    │   └─→ Chart re-renders (< 100ms)
    │       └─→ New point appears on graph
    │           └─→ LineChart auto-scrolls
    │
    ├─→ Continuous monitoring:
    │   ├─ Every 30s new point added
    │   ├─ Chart scrolls (last 1 hour visible)
    │   ├─ Threshold alerts triggered
    │   └─ User sees live temperature in real-time
    │
    └─→ Component unmounts
        └─→ Listener unsubscribed
```

---

### 4. Security & Authentication Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│          SECURITY ARCHITECTURE - FIRESTORE RULES & TOKENS               │
└──────────────────────────────────────────────────────────────────────────┘

CLIENT-SIDE SECURITY:
    │
    ├─→ JWT Token Management:
    │   │
    │   ├─→ Token Structure (Firebase idToken):
    │   │   │
    │   │   └─→ Base64 encoded JWT:
    │   │       Header.Payload.Signature
    │   │
    │   │       Header: {
    │   │         "alg": "RS256",
    │   │         "kid": "key_id_12345",
    │   │         "typ": "JWT"
    │   │       }
    │   │
    │   │       Payload: {
    │   │         "iss": "https://securetoken.google.com/ricement-app",
    │   │         "aud": "ricement-app",
    │   │         "auth_time": 1707020400,
    │   │         "user_id": "uid123",
    │   │         "sub": "uid123",
    │   │         "iat": 1707020400,
    │   │         "exp": 1707024000,
    │   │         "email": "user@example.com",
    │   │         "email_verified": false,
    │   │         "firebase": {
    │   │           "identities": {
    │   │             "email": ["user@example.com"]
    │   │           },
    │   │           "sign_in_provider": "password"
    │   │         },
    │   │         "custom:role": "user",
    │   │         "custom:company_id": "company123"
    │   │       }
    │   │
    │   │       Signature: RS256 (RSA-256 signed by Firebase)
    │   │
    │   ├─→ Token Lifecycle:
    │   │   ├─ Issued: 1 hour expiry
    │   │   ├─ Auto-refresh: Before expiry
    │   │   ├─ Revocation: On logout
    │   │   └─ Validation: On server every request
    │   │
    │   └─→ Storage:
    │       ├─ iOS: Keychain (encrypted)
    │       ├─ Android: SharedPreferences (encrypted)
    │       ├─ Web: SessionStorage (memory)
    │       └─ All: Auto-managed by Firebase SDK
    │
    ├─→ HTTPS Communication:
    │   │
    │   ├─→ TLS 1.2+ (minimum)
    │   ├─→ Certificate pinning (optional)
    │   ├─→ Cipher suites: AES-256-GCM
    │   └─→ Perfect Forward Secrecy: ECDHE
    │
    └─→ API Key Restrictions:
        │
        ├─→ Restrict to Firebase Services only
        ├─→ HTTP Referrer restrictions (domain whitelist)
        ├─→ Android app restrictions (SHA-1 fingerprint)
        ├─→ iOS app restrictions (bundle ID)
        └─→ Rate limiting: Per IP, per key


SERVER-SIDE SECURITY (FIRESTORE RULES):
    │
    ├─→ Rules Engine Architecture:
    │   │
    │   ├─→ Every Firestore read/write request:
    │   │   ├─ Intercepted by Rules Engine
    │   │   ├─ Evaluated against security rules
    │   │   ├─ Token validated (JWT verification)
    │   │   ├─ Custom claims checked
    │   │   ├─ Data validation
    │   │   └─ Allow/Deny decision (< 5ms)
    │   │
    │   └─→ Cannot be bypassed:
    │       ├─ Server-side enforcement only
    │       ├─ Client-side SDK cannot override
    │       ├─ Direct database access requires rules approval
    │       └─ All operations logged & auditable
    │
    ├─→ Sample Rule Structure:
    │   │
    │   └─→ rules_version = '2';
    │       service cloud.firestore {
    │         match /databases/{database}/documents {
    │
    │           // Helper functions
    │           function isAuth() {
    │             return request.auth != null;
    │           }
    │
    │           function isOwner(userId) {
    │             return request.auth.uid == userId;
    │           }
    │
    │           function isAdmin() {
    │             return get(/databases/$(database)/documents/admins/
    │                      $(request.auth.uid)).data.role == 'admin';
    │           }
    │
    │           // Concrete rules
    │           match /users/{userId} {
    │             allow read: if isOwner(userId);
    │             allow write: if isOwner(userId) && 
    │                          validateUserData(request.resource.data);
    │           }
    │
    │           match /projects/{projectId} {
    │             allow read: if isAuth() && 
    │               (isOwner(resource.data.userId) ||
    │                resource.data.userId in request.auth.token.collaborators);
    │             allow create: if isAuth() && 
    │               request.resource.data.userId == request.auth.uid &&
    │               validateProjectData(request.resource.data);
    │             allow update: if isOwner(resource.data.userId) &&
    │               validateProjectUpdate(request.resource.data);
    │           }
    │
    │           match /admins/{adminId} {
    │             allow read: if request.auth.uid == adminId;
    │             allow write: if isSuperAdmin();
    │           }
    │         }
    │       }
    │
    ├─→ Request Validation:
    │   │
    │   ├─→ Data type checking:
    │   │   ├─ name (string, required)
    │   │   ├─ blocks (integer, > 0)
    │   │   ├─ status (enum: Queue, Pouring, Completed)
    │   │   └─ timestamp (timestamp, not in future)
    │   │
    │   └─→ Business logic validation:
    │       ├─ User can only create projects in their company
    │       ├─ Admin can only manage users in their company
    │       ├─ Superadmin can manage everything
    │       └─ Fields cannot be tampered with
    │
    ├─→ Field-Level Security:
    │   │
    │   ├─→ Users cannot see other users' emails
    │   ├─→ Users cannot modify their own role
    │   ├─→ Admins cannot see superadmin data
    │   └─→ Public fields can be read by anyone (with permission)
    │
    └─→ Audit Logging:
        │
        ├─→ All admin actions logged to auditLogs collection
        ├─→ Timestamp + Admin UID + Action + Details
        ├─→ Retention: 90 days
        └─→ Compliance: GDPR, SOC 2


DEPLOYMENT-TIME SECURITY:
    │
    ├─→ Environment Variables:
    │   │
    │   ├─→ Never hardcoded in source:
    │   │   ├─ .env file (git ignored)
    │   │   ├─ Vercel secrets (encrypted)
    │   │   ├─ EAS Build secrets
    │   │   └─ GitHub Actions secrets
    │   │
    │   └─→ At runtime: Injected into process.env
    │       └─→ Accessible only to app process
    │
    ├─→ API Key Management:
    │   │
    │   ├─→ Public API Key (browser/mobile):
    │   │   ├─ Can be exposed (restricted by rules)
    │   │   └─ Validates in Firestore rules
    │   │
    │   └─→ Server API Key (backend only):
    │       ├─ Never exposed to client
    │       ├─ Higher rate limits
    │       └─ Less restricted
    │
    └─→ Secret Rotation:
        ├─ Firebase key rotation: Annual
        ├─ JWT refresh: Hourly
        └─ API credentials: On compromise
```

---

**Architecture Details Completed**

This technical architecture document covers:
- ✅ Complete infrastructure stack (clients to cloud)
- ✅ Service-to-database communication patterns
- ✅ Real-time sync mechanisms (WebSockets)
- ✅ IoT integration (Arduino/ESP8266)
- ✅ Security enforcement (Rules engine)
- ✅ Data flow diagrams (technical level)
- ✅ External service integrations
- ✅ Latency & performance specifications

**Last Updated**: February 2, 2026
**Technical Architecture Version**: 1.0 (Netflix-style detailed)
