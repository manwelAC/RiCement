# RiCement Architecture - Visual Diagrams

## 1. Complete System Architecture Flow

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                         RICEMENT ECOSYSTEM                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENT INTERFACES                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┏━━━━━━━━━━━━━━━┓     ┏━━━━━━━━━━━━━━━━┓     ┏━━━━━━━━━━━━━━━━━┓   │
│  ┃  iOS APP      ┃     ┃  ANDROID APP   ┃     ┃  ADMIN WEB      ┃   │
│  ┃  (Expo)       ┃     ┃  (Expo)        ┃     ┃  (Vercel)       ┃   │
│  ┣━━━━━━━━━━━━━━━┫     ┣━━━━━━━━━━━━━━━━┫     ┣━━━━━━━━━━━━━━━━━┫   │
│  ┃• Dashboard    ┃     ┃• Dashboard     ┃     ┃• Users Mgmt     ┃   │
│  ┃• Projects     ┃     ┃• Projects      ┃     ┃• Analytics      ┃   │
│  ┃• Monitoring   ┃     ┃• Monitoring    ┃     ┃• Complaints     ┃   │
│  ┃• Chat AI      ┃     ┃• Chat AI       ┃     ┃• Reports        ┃   │
│  ┃• Inventory    ┃     ┃• Inventory     ┃     ┃• Settings       ┃   │
│  ┃• Profile      ┃     ┃• Profile       ┃     ┃• Audit Logs     ┃   │
│  ┗━━━━━━━━━━━━━━━┛     ┗━━━━━━━━━━━━━━━━┛     ┗━━━━━━━━━━━━━━━━━┛   │
│         │                     │                       │                 │
│         └─────────────────────┼───────────────────────┘                 │
│                               │                                         │
└───────────────────────────────┼─────────────────────────────────────────┘
                                │
                ┌───────────────▼───────────────┐
                │      EXPO ROUTER             │
                │    (Platform Routing)         │
                │  • /tabs for mobile          │
                │  • /admin for web            │
                │  • Shared auth routes        │
                └───────────────┬───────────────┘
                                │
                ┌───────────────▼───────────────┐
                │   REACT CONTEXT & HOOKS      │
                │    (State Management)         │
                │  • AuthContext               │
                │  • ThemeContext              │
                │  • User Profile              │
                └───────────────┬───────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                      SERVICES LAYER (TypeScript)                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┏━━━━━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━━┓      │
│  ┃  AUTH SERVICE   ┃   ┃ FIREBASE SERV. ┃   ┃ ADMIN SERVICE  ┃      │
│  ┣━━━━━━━━━━━━━━━━━┫   ┣━━━━━━━━━━━━━━━━┫   ┣━━━━━━━━━━━━━━━━┫      │
│  ┃ signUp()        ┃   ┃ createProject()┃   ┃ createAdmin() ┃      │
│  ┃ login()         ┃   ┃ getProjects()  ┃   ┃ manageUsers()┃      │
│  ┃ logout()        ┃   ┃ updateProject()┃   ┃ getMetrics() ┃      │
│  ┃ resetPassword() ┃   ┃ deleteProject()┃   ┃ complaints() ┃      │
│  ┃ getCurrentUser()┃   ┃ addCollaborat()┃   ┃ auditLogs()  ┃      │
│  ┃ checkRole()     ┃   ┃ addChat()      ┃   ┃ manageCompany()     │
│  ┃ signInAnon()    ┃   ┃ addTempLog()   ┃   ┃ ...          ┃      │
│  ┃ updateProfile()┃   ┃ ...            ┃   ┃              ┃      │
│  ┗━━━━━━━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━━━━┛      │
│                                                                           │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                   FIREBASE SDK v12.4.0                                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┏━━━━━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━┓        │
│  ┃  FIRESTORE      ┃   ┃  REALTIME DB   ┃   ┃  CLOUD STORAGE ┃       │
│  ┃  (Primary)      ┃   ┃  (Status)      ┃   ┃  (Files)       ┃       │
│  ┣━━━━━━━━━━━━━━━━━┫   ┣━━━━━━━━━━━━━━━━┫   ┣━━━━━━━━━━━━━━━┫       │
│  ┃ • users         ┃   ┃ • timerActive  ┃   ┃ • Images       ┃       │
│  ┃ • projects      ┃   ┃ • manual_proj  ┃   ┃ • Documents    ┃       │
│  ┃ • admins        ┃   ┃ • status       ┃   ┃ • 3D Models    ┃       │
│  ┃ • companies     ┃   ┃                ┃   ┃                ┃       │
│  ┃ • temperatures  ┃   ┗━━━━━━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━━━┛       │
│  ┃ • materials     ┃                                                   │
│  ┃ • rhbRecords    ┃                                                   │
│  ┃ • chatSessions  ┃                                                   │
│  ┃ • chatMessages  ┃                                                   │
│  ┃ • complaints    ┃                                                   │
│  ┗━━━━━━━━━━━━━━━━━┛                                                   │
│                                                                           │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┏━━━━━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━━┓   ┏━━━━━━━━━━━━━━━┓        │
│  ┃  GEMINI API     ┃   ┃  ARDUINO IoT   ┃   ┃  VERCEL        ┃        │
│  ┃  (AI Chat)      ┃   ┃  (Sensors)     ┃   ┃  (Hosting)     ┃        │
│  ┣━━━━━━━━━━━━━━━━━┫   ┣━━━━━━━━━━━━━━━━┫   ┣━━━━━━━━━━━━━━━┫        │
│  ┃ • Context ctx   ┃   ┃ • Temperature  ┃   ┃ • Web Deploy   ┃        │
│  ┃ • Response gen  ┃   ┃ • Relay control┃   ┃ • CI/CD        ┃        │
│  ┃ • Multi-turn    ┃   ┃ • Status update┃   ┃ • Analytics    ┃        │
│  ┗━━━━━━━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━━━━┛   ┗━━━━━━━━━━━━━━━┛        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

```

---

## 2. Authentication & Authorization Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  USER AUTHENTICATION FLOW                        │
└──────────────────────────────────────────────────────────────────┘

NEW USER SIGNUP:
└─ Enter Email/Password/Details
   └─ authService.signUp()
      └─ createUserWithEmailAndPassword() [Firebase Auth]
         └─ Create Auth Token
            └─ updateProfile() [User displayName]
               └─ Create User Document in Firestore
                  └─ users/{uid} collection
                     └─ Store: uid, email, fullName, username, role, createdAt
                        └─ Redirect to Dashboard
                           └─ User Authenticated ✓


EXISTING USER LOGIN:
└─ Enter Email/Password
   └─ authService.login()
      └─ signInWithEmailAndPassword() [Firebase Auth]
         └─ Receive Auth Token
            └─ Set Local Persistence
               └─ authService.onAuthStateChanged()
                  └─ Retrieve User Profile from Firestore
                     └─ Update AuthContext
                        └─ Redirect to appropriate screen
                           └─ User Authenticated ✓


ROLE CHECKING (On Login):
└─ Fetch user document
   └─ Check user.role field
      ├─ role: 'user' → Mobile app features
      ├─ role: 'admin' → Admin panel access
      └─ role: 'superadmin' → Full system access


PERSISTENT SESSION:
└─ onAuthStateChanged() listener
   └─ Checks Firebase Auth state on app start
      └─ If authenticated, restore session
         └─ Load user profile from Firestore
            └─ Resume without re-login


LOGOUT:
└─ User clicks Logout
   └─ authService.logout()
      └─ signOut() [Firebase Auth]
         └─ Clear local persistence
            └─ Clear AuthContext
               └─ Redirect to Login screen
                  └─ Session ended ✓

```

---

## 3. Project Management & Collaboration Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│            PROJECT CREATION & COLLABORATION FLOW                 │
└──────────────────────────────────────────────────────────────────┘

PROJECT CREATION (Creator):
└─ User fills project form
   ├─ Name, Blocks, EstimatedTime, Date
   └─ firebaseService.createProject(projectData)
      └─ addDoc(collection(db, 'projects'), {...})
         └─ Firestore generates auto-ID
            └─ Document created:
               ├─ projectId (auto-generated)
               ├─ userId: creator's UID
               ├─ name, blocks, estimatedTime, date
               ├─ status: 'Queue'
               ├─ collaborators: [] (empty initially)
               ├─ createdAt: timestamp
               └─ updatedAt: timestamp
                  └─ Real-time listener triggers
                     └─ Appears in creator's dashboard


ADD COLLABORATORS:
└─ Creator selects users to collaborate
   └─ firebaseService.addCollaboratorsToProject(
        projectId,
        [userId1, userId2, ...],
        {userId1: {fullName, email}, ...}
      )
      └─ updateDoc(doc(db, 'projects', projectId), {
           collaborators: [
             {userId: 'id1', fullName, email, blocksContributed: 0, joinedAt},
             {userId: 'id2', fullName, email, blocksContributed: 0, joinedAt}
           ]
         })
         └─ Firestore updates project doc
            └─ Real-time listeners on all collaborators' clients trigger
               └─ All collaborators see project in their dashboard
                  ├─ Can view project details
                  ├─ Can see other collaborators
                  └─ Can update their block contributions


UPDATE BLOCK CONTRIBUTION:
└─ Collaborator completes blocks
   └─ firebaseService.updateCollaboratorBlocks(
        projectId,
        userId,
        blocksCompleted
      )
      └─ Find collaborator in array
         └─ Update blocksContributed += blocksCompleted
            └─ Update completedBlocks (total)
               └─ updateDoc(doc(db, 'projects', projectId), {...})
                  └─ Firestore updates
                     └─ Real-time sync to all collaborators
                        └─ Dashboard updates instantly
                           └─ Progress bars update
                              └─ Timeline adjusts


REMOVE COLLABORATOR:
└─ Creator removes user
   └─ firebaseService.removeCollaborator(projectId, userId)
      └─ Remove user from collaborators array
         └─ updateDoc(doc(db, 'projects', projectId), {
              collaborators: [filtered array]
            })
            └─ Firestore updates
               └─ Removed user's client receives update
                  └─ Project disappears from their view ✓


PROJECT STATUS UPDATES:
└─ Any collaborator updates status
   └─ Queue → Pouring → Mixing → Pouring2 → Completed
      └─ firebaseService.updateProject(projectId, {status: newStatus})
         └─ updateDoc(doc(db, 'projects', projectId), {status})
            └─ Real-time listeners all clients trigger
               └─ All collaborators see status change instantly
                  └─ UI updates (timers start/stop)
                     └─ Notifications sent (future feature)

```

---

## 4. Real-Time Monitoring Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│          REAL-TIME MONITORING & SYNCHRONIZATION                 │
└──────────────────────────────────────────────────────────────────┘

FIRESTORE REAL-TIME LISTENER:
└─ Component mounts
   └─ Subscribe to query:
      const unsubscribe = onSnapshot(
        query(
          collection(db, 'projects'),
          where('userId', '==', currentUserId)
        ),
        (snapshot) => {
          setProjects(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        }
      );
      └─ Listener attached to Firestore
         └─ When ANY project document changes:
            ├─ Snapshot captured
            ├─ New data received instantly
            ├─ setProjects() updates state
            ├─ Component re-renders
            └─ UI shows new data (< 100ms latency)


REALTIME DATABASE STATUS:
└─ Quick status updates (timerActive, manual_projects)
   └─ onValue(ref(realtimeDb, 'manual_projects/{projectId}'), (snap) => {...})
      └─ Firebase Realtime DB is ultra-fast
         └─ Perfect for timer/status polling
            └─ Updates app state
               └─ Shows real-time timer countdown


OFFLINE HANDLING:
└─ Internet disconnects
   └─ Firestore cache activated
      ├─ Display cached data (last synced)
      └─ Mark data as "offline"
         └─ Show offline indicator
            └─ Queue operations locally (AsyncStorage)
               └─ When internet returns:
                  └─ Sync queued operations
                     └─ Receive latest data
                        └─ Update UI
                           └─ Show online indicator


CLEANUP ON UNMOUNT:
└─ Component unmounts
   └─ Call unsubscribe()
      └─ Detach listener from Firestore
         └─ Stop receiving updates (save bandwidth)
            └─ Component removed from memory

```

---

## 5. AI Chat Integration Flow

```
┌──────────────────────────────────────────────────────────────────┐
│              AI CHAT ASSISTANT INTEGRATION FLOW                  │
└──────────────────────────────────────────────────────────────────┘

USER STARTS CHAT:
└─ User opens GlobalAIChat component
   └─ Check if chatSession exists
      ├─ If NO:
      │  └─ firebaseService.createChatSession(userId)
      │     └─ addDoc(collection(db, 'chatSessions'), {
      │          userId,
      │          startTime: now(),
      │          endTime: null,
      │          isActive: true
      │        })
      │        └─ Firestore creates session
      │           └─ Get sessionId
      └─ If YES:
         └─ Use existing session


USER SENDS MESSAGE:
└─ User types message
   └─ Press Send
      └─ firebaseService.addChatMessage(sessionId, userMessage)
         └─ addDoc(collection(db, 'chatMessages'), {
              sessionId,
              message: userMessage,
              sender: 'user',
              timestamp: now(),
              aiResponse: null
            })
            └─ Message stored in Firestore
               └─ Show message in chat UI
                  └─ Show "AI Thinking..." indicator
                     └─ Call Gemini API:
                        const response = await fetch(
                          'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
                          {
                            method: 'POST',
                            headers: {Authorization: `Bearer ${apiKey}`},
                            body: JSON.stringify({
                              contents: [{
                                parts: [{text: userMessage}]
                              }],
                              generationConfig: {
                                temperature: 0.7,
                                maxOutputTokens: 1024
                              }
                            })
                          }
                        );
                        └─ Gemini processes message
                           └─ Returns AI response
                              └─ updateDoc(doc(db, 'chatMessages', messageId), {
                                   aiResponse: geminiResponse
                                 })
                                 └─ Store response in Firestore
                                    └─ Display response in UI
                                       └─ Message complete


CHAT HISTORY:
└─ Retrieve previous messages:
   └─ firebaseService.getChatMessages(sessionId)
      └─ getDocs(
           query(
             collection(db, 'chatMessages'),
             where('sessionId', '==', sessionId),
             orderBy('timestamp', 'asc')
           )
         )
         └─ Load all messages from session
            └─ Display in scrollable list
               └─ User can review context


END CHAT SESSION:
└─ User closes chat or closes app
   └─ firebaseService.endChatSession(sessionId)
      └─ updateDoc(doc(db, 'chatSessions', sessionId), {
           endTime: now(),
           isActive: false
         })
         └─ Mark session as closed
            └─ Data archived in Firestore

```

---

## 6. Admin Dashboard & Analytics Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│           ADMIN DASHBOARD & ANALYTICS ARCHITECTURE              │
└──────────────────────────────────────────────────────────────────┘

ADMIN LOGIN:
└─ Admin enters credentials
   └─ authService.login()
      └─ Firebase Auth validates
         └─ authService.checkAdminStatus(uid)
            └─ Query Firestore:
               getDocs(
                 query(
                   collection(db, 'admins'),
                   where('..', '==', uid)
                 )
               )
               └─ If admin found:
                  ├─ Check role: 'admin' or 'superadmin'
                  ├─ Check companyId (for admins)
                  └─ Route to admin dashboard
               └─ If not admin:
                  └─ Show error "Not authorized"


ADMIN VIEWS USERS:
└─ adminService.getCompanyUsersList(companyId)
   └─ Query Firestore:
      getDocs(
        query(
          collection(db, 'users'),
          where('companyId', '==', companyId)
        )
      )
      └─ Returns users of company
         └─ Display in Users table
            ├─ Name, email, role, lastLogin
            └─ Actions: Edit, Delete, Reset Password


ADMIN VIEWS ANALYTICS:
└─ adminService.getCompanyMetrics(companyId)
   └─ Multiple queries:
      ├─ Count total projects
      ├─ Count completed projects
      ├─ Sum total blocks
      ├─ Calculate avg completion time
      └─ Get user activity stats
         └─ Process data:
            ├─ Calculate KPIs
            ├─ Create trend data
            └─ Generate charts
               └─ Display on dashboard
                  ├─ Project progress bar
                  ├─ User activity heatmap
                  ├─ Revenue/cost analytics
                  └─ Production timeline


ADMIN MANAGES COMPLAINTS:
└─ adminService.getComplaints(filter)
   └─ Query Firestore:
      getDocs(
        query(
          collection(db, 'complaints'),
          where('status', '==', filter)
        )
      )
      └─ List complaints
         └─ Admin can:
            ├─ View details
            ├─ Update status (open → in-progress → resolved)
            ├─ Assign to team member
            └─ Add notes/comments
               └─ updateDoc(doc(db, 'complaints', complaintId), {...})


SUPERADMIN MANAGES COMPANIES:
└─ adminService.getCompanies()
   └─ Query Firestore:
      getDocs(collection(db, 'companies'))
      └─ List all companies
         └─ Superadmin can:
            ├─ Create new company
            ├─ Edit company info
            ├─ Manage company admins
            ├─ View company analytics
            └─ Delete company
               └─ Cascading delete (all related data)


AUDIT LOGGING:
└─ Every admin action logged:
   └─ adminService.logAdminAction(action, details)
      └─ addDoc(collection(db, 'auditLogs'), {
           adminId,
           action: 'create_user' | 'delete_project' | etc,
           details: {...},
           timestamp: now(),
           companyId
         })
         └─ Immutable log in Firestore
            └─ For compliance & auditing

```

---

## 7. Hardware Integration (Arduino/IoT)

```
┌──────────────────────────────────────────────────────────────────┐
│          ARDUINO/IoT SENSOR INTEGRATION ARCHITECTURE            │
└──────────────────────────────────────────────────────────────────┘

HARDWARE SETUP:
└─ Arduino/ESP8266 with sensors
   ├─ Temperature sensor (DS18B20)
   ├─ Relay module (for pump control)
   └─ WiFi module (WiFi connectivity)


INITIALIZATION:
└─ Arduino boots
   └─ Connect to WiFi SSID
      └─ Initialize sensors
         └─ Get Firebase API key & Project ID
            └─ Poll Firestore every 2 seconds:
               const apiUrl = 'https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents:runQuery';
               └─ Query for active manual_projects
                  └─ Check timerActive == true


TEMPERATURE MONITORING:
└─ Sensor reads temperature every 30 seconds
   └─ Arduino sends HTTP POST to Firestore REST API:
      POST https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents
      Body: {
        "fields": {
          "temperature": {"doubleValue": 65.5},
          "timestamp": {"timestampValue": "2024-01-15T10:30:00Z"},
          "projectId": {"stringValue": "proj123"},
          "location": {"stringValue": "tank1"},
          "deviceId": {"stringValue": "arduino_01"}
        }
      }
      └─ Firestore creates temperatureLogs document
         └─ Mobile app real-time listener receives update
            └─ Chart updates with new data point
               └─ If temperature exceeds threshold:
                  └─ Send alert to user


RELAY CONTROL:
└─ Firebase Realtime DB stores commands:
   └─ Set /manual_projects/{projectId}/command = 'START_PUMP'
      └─ Arduino polls Realtime DB
         └─ Sees command changed
            └─ Activate relay pin
               └─ Pump starts
                  └─ Set status = 'POURING'
                     └─ Set /manual_projects/{projectId}/command = 'IDLE'


PROJECT STATUS SYNC:
└─ Manual timer (Realtime DB):
   ├─ timerActive: true/false
   ├─ startTime: timestamp
   ├─ remainingSeconds: number
   └─ Arduino & mobile app both sync to this
      └─ Both show same timer countdown
         └─ When timer expires:
            └─ Set timerActive = false
               └─ All clients receive update
                  └─ Stop pouring sequence


ERROR HANDLING:
└─ WiFi disconnects
   └─ Arduino stores readings in local memory
      └─ When WiFi reconnects:
         └─ Batch upload all stored readings
            └─ Firestore updates with all data
               └─ No data loss


SECURITY:
└─ Arduino uses API key (Firebase REST API)
   └─ Can only write to:
      ├─ temperatureLogs collection
      └─ manual_projects status (limited fields)
   └─ Firestore rules restrict access:
      match /temperatureLogs/{recordId} {
        allow create: if request.auth.uid exists OR
                          request.resource.data.deviceId == arduino_id;
      }

```

---

## 8. Deployment Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│              DEPLOYMENT & CI/CD PIPELINE                        │
└──────────────────────────────────────────────────────────────────┘

MOBILE APP DEPLOYMENT:
└─ Developer pushes code to GitHub (master branch)
   └─ (Optional) Trigger EAS Build manually or on git tag
      └─ npm run build:android  or  npm run build:ios
         └─ EAS Build Queue processes:
            ├─ Install dependencies
            ├─ Run TypeScript compiler
            ├─ Run ESLint
            ├─ Execute tests
            ├─ Build app (APK/IPA)
            └─ Output ready for distribution
               └─ (Optional) EAS Submit to stores
                  └─ Manual store submission


WEB ADMIN PANEL DEPLOYMENT:
└─ Developer pushes code to GitHub (master branch)
   └─ Vercel webhook triggered automatically
      └─ Vercel CI/CD pipeline:
         ├─ Pull latest code
         ├─ Run: npm install
         ├─ Run: expo export -p web
         ├─ Tests run (if configured)
         ├─ Build artifacts created in dist/
         └─ Deploy to Vercel edge network
            └─ Available at: https://your-project.vercel.app
               └─ Auto-scales based on traffic
                  └─ Rollback available if needed


ENVIRONMENT VARIABLES:
└─ Firebase credentials set in:
   ├─ Mobile App:
   │  └─ .env file (EAS reads these)
   │     ├─ EXPO_PUBLIC_FIREBASE_API_KEY
   │     ├─ EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
   │     ├─ EXPO_PUBLIC_FIREBASE_PROJECT_ID
   │     └─ ...other config
   │
   └─ Web App:
      └─ Vercel Dashboard → Environment Variables
         ├─ EXPO_PUBLIC_FIREBASE_API_KEY
         ├─ EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
         └─ ...same config


FIRESTORE SECURITY RULES DEPLOYMENT:
└─ Update rules in UPDATED_FIRESTORE_RULES.tsx
   └─ Copy rules to Firebase Console
      └─ Firebase Rules Editor
         └─ Save and publish
            └─ Rules become active (takes ~2 minutes)
               └─ All clients immediately use new rules


VERSION MANAGEMENT:
└─ package.json version bumped
   └─ Git tag created (v1.2.3)
      └─ EAS Build reads version
         └─ Built app includes version
            └─ Stores track app versions
               └─ Users notified of updates


MONITORING:
└─ Post-deployment:
   ├─ Check Firebase Dashboard for errors
   ├─ Monitor app crash reports (EAS)
   ├─ Monitor web analytics (Vercel)
   ├─ Check user feedback
   └─ Monitor database metrics (Firestore)

```

---

## 9. Security Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                  SECURITY LAYERS & CONTROLS                      │
└──────────────────────────────────────────────────────────────────┘

AUTHENTICATION LAYER:
└─ Firebase Auth (OAuth2)
   ├─ Email/Password provider
   ├─ Session tokens (auto-managed by Firebase)
   ├─ Token refresh (auto-managed)
   └─ Secure in-transit (HTTPS)


AUTHORIZATION LAYER:
└─ Firestore Security Rules (Row-Level Security)
   ├─ Check: request.auth != null (authenticated)
   ├─ Check: request.auth.uid == resource.data.userId (ownership)
   ├─ Check: Role-based access (admin, superadmin)
   └─ Check: Company-level access (admins see only their company)
      └─ Example Rule:
         match /projects/{projectId} {
           allow read: if request.auth != null &&
                          (request.auth.uid == resource.data.userId ||
                           resource.data.userId in request.auth.token.collaborators);
           allow write: if request.auth != null &&
                           request.auth.uid == resource.data.userId;
         }


DATA ENCRYPTION:
├─ In-Transit:
│  └─ HTTPS (TLS 1.3) for all API calls
│     └─ Firestore uses HTTPS
│     └─ Cloud Storage uses HTTPS
│     └─ Arduino API calls use HTTPS
│
└─ At-Rest:
   └─ Firebase encryption (built-in, no config needed)
      ├─ Firestore docs encrypted
      ├─ Cloud Storage files encrypted
      └─ Customer-managed keys (optional, future)


ENVIRONMENT VARIABLES:
└─ Never hardcode secrets
   ├─ Use .env files (git-ignored)
   ├─ Use process.env.EXPO_PUBLIC_* for public vars
   ├─ Vercel environment variables for web deployment
   └─ EAS Build environment for mobile


API KEY PROTECTION:
├─ Public API keys restricted in Firebase Console:
│  └─ Firebase Console → Settings → API keys
│     ├─ Restrict key to Firebase services only
│     ├─ Add HTTP referrer restrictions
│     └─ Add Android app restrictions
│
└─ Arduino API Key:
   └─ Consider separate key with minimal permissions


USER DATA PRIVACY:
├─ Only store necessary data
├─ Provide data export (future)
├─ Support account deletion
│  └─ Cascade delete all user data
└─ GDPR compliance:
   └─ Right to access
   └─ Right to delete
   └─ Data portability


AUDIT LOGGING:
└─ All admin actions logged
   ├─ adminService.logAdminAction()
   ├─ Immutable audit trail in Firestore
   └─ Compliance with regulations


NETWORK SECURITY:
├─ Firestore: Private API (no public internet access)
├─ Storage: Signed URLs for downloads
├─ Realtime DB: Security rules enforced
└─ Arduino: IP whitelisting (optional)

```

---

## 10. Scaling & Performance Considerations

```
┌──────────────────────────────────────────────────────────────────┐
│           SCALABILITY & PERFORMANCE ARCHITECTURE                 │
└──────────────────────────────────────────────────────────────────┘

FIRESTORE SCALING:
└─ Distributed NoSQL database
   ├─ Auto-scales for read/write operations
   ├─ Max 50K reads/sec per database
   ├─ Max 20K writes/sec per database
   └─ For exceeded limits:
      └─ Consider sharding collection
         └─ Split data across multiple collections
            ├─ projects_company1
            ├─ projects_company2
            └─ Queries limited to subset


FIREBASE AUTH SCALING:
├─ Unlimited user accounts
├─ Built-in email verification
├─ Supports millions of concurrent users
└─ No configuration needed (auto-scales)


CLOUD STORAGE SCALING:
├─ Unlimited storage
├─ Pay-as-you-go pricing
├─ Global CDN for fast downloads
└─ Automatic versioning support


REALTIME DATABASE SCALING:
├─ Supports thousands of simultaneous connections
├─ Optimized for status/timer updates
├─ Not recommended for heavy analytics queries
└─ Use Firestore for complex queries


MOBILE APP OPTIMIZATION:
├─ Firestore offline persistence:
│  └─ Unlimited cache size
│     ├─ Downloaded data available offline
│     └─ Syncs when online
│
├─ AsyncStorage fallback:
│  └─ Local storage for critical data
│     ├─ 3-5MB limit per app
│     └─ Sync with Firebase on connect
│
├─ Image caching:
│  └─ Expo Image component
│     ├─ Automatic caching
│     └─ No re-downloads
│
└─ 3D model optimization:
   └─ Local file system storage
      └─ No cloud bandwidth used


WEB APP OPTIMIZATION:
├─ Code splitting (Expo Router)
├─ Lazy loading of routes
├─ CSS optimization (Vercel)
└─ Image optimization (next/image)


DATABASE INDEXING:
└─ Create composite indexes for:
   ├─ Queries with multiple filters
   └─ Firestore Console → Indexes
      └─ Auto-suggest missing indexes
         └─ Performance boost for queries


CONNECTION POOLING:
└─ Firebase handles connection management
   ├─ Max 1 connection per client
   ├─ Automatic reconnection
   └─ Exponential backoff for retries


MONITORING & ALERTS:
├─ Firestore Usage Dashboard
├─ Cloud Monitoring (Google Cloud)
├─ Vercel Analytics
├─ EAS Dashboard
└─ Set up alerts for:
   ├─ High read/write rates
   ├─ High costs
   ├─ API errors
   └─ Deployment failures

```

---

**Last Updated**: February 2, 2026
**Diagrams Version**: 2.0
