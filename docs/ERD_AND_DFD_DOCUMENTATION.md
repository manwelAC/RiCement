# RiCement System Architecture Documentation

## Table of Contents
1. [Entity Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
2. [Data Flow Diagram (DFD)](#data-flow-diagram-dfd)
3. [System Overview](#system-overview)
4. [Data Dictionary](#data-dictionary)

---

## Entity Relationship Diagram (ERD)

### Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RICEMENT DATABASE                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│     USERS        │
├──────────────────┤
│ PK: userId       │◄─────┐
│ email            │      │
│ displayName      │      │ 1:N
│ role             │      │
│ isActive         │      │
│ createdAt        │      │
│ updatedAt        │      │
└──────────────────┘      │
                          │
                          │
┌──────────────────┐      │
│    ADMINS        │      │
├──────────────────┤      │
│ PK: adminId      │      │
│ email            │      │
│ role             │      │
│ createdAt        │      │
└──────────────────┘      │
                          │
                          │
┌──────────────────┐      │
│    PROJECTS      │      │
├──────────────────┤      │
│ PK: projectId    │      │
│ FK: userId       │──────┘
│ name             │
│ blocks           │
│ estimatedTime    │      1:N
│ date             │      ├───────┐
│ status           │      │       │
│ createdAt        │      │       │
│ updatedAt        │      │       │
└──────────────────┘      │       │
        │                 │       │
        │ 1:N             │       │
        ├─────────────────┘       │
        │                         │
        │                         │
┌──────────────────┐      ┌──────────────────┐
│ TEMPERATURE_LOGS │      │  RAW_MATERIALS   │
├──────────────────┤      ├──────────────────┤
│ PK: logId        │      │ PK: materialId   │
│ FK: projectId    │      │ FK: projectId    │
│ temperature      │      │ cement           │
│ timestamp        │      │ sand             │
│ zone             │      │ gravel           │
└──────────────────┘      │ water            │
                          │ recordedAt       │
                          └──────────────────┘

┌──────────────────┐      ┌──────────────────┐
│   RHB_RECORDS    │      │ MANUAL_PROJECTS  │
├──────────────────┤      ├──────────────────┤
│ PK: recordId     │      │ PK: projectId    │
│ FK: projectId    │      │ FK: userId       │──┐
│ blocks           │      │ name             │  │
│ producedAt       │      │ blocks           │  │
│ quality          │      │ estimatedTime    │  │
└──────────────────┘      │ remainingTime    │  │ 1:1
                          │ timerActive      │◄─┘
                          │ status           │  │
                          │ date             │  │
                          │ createdAt        │  │
                          │ updatedAt        │  │
                          │ completedAt      │  │
                          │ isManual         │  │
                          └──────────────────┘  │
                                  ▲             │
                                  │             │
                                  │ Reads       │
                                  │             │
                          ┌──────────────────┐  │
                          │     ARDUINO      │  │
                          │   (Hardware)     │  │
                          ├──────────────────┤  │
                          │ Monitors:        │  │
                          │ - timerActive    │──┘
                          │ - remainingTime  │
                          │ Controls:        │
                          │ - Pump/Machine   │
                          └──────────────────┘

┌──────────────────┐      ┌──────────────────┐
│  CHAT_SESSIONS   │      │  CHAT_MESSAGES   │
├──────────────────┤      ├──────────────────┤
│ PK: sessionId    │      │ PK: messageId    │
│ FK: userId       │──────┤ FK: sessionId    │
│ title            │ 1:N  │ role             │
│ createdAt        │      │ content          │
│ updatedAt        │      │ timestamp        │
└──────────────────┘      └──────────────────┘
```

### Entity Relationships

| Relationship | Type | Description |
|-------------|------|-------------|
| Users → Projects | One-to-Many | One user can have multiple projects |
| Users → Manual Projects | One-to-Many | One user can create multiple manual projects |
| Projects → Temperature Logs | One-to-Many | One project can have multiple temperature readings |
| Projects → Raw Materials | One-to-Many | One project can have multiple material records |
| Projects → RHB Records | One-to-Many | One project can produce multiple RHB blocks |
| Users → Chat Sessions | One-to-Many | One user can have multiple chat sessions |
| Chat Sessions → Chat Messages | One-to-Many | One session contains multiple messages |
| Manual Projects ↔ Arduino | One-to-One | Arduino monitors one active manual project at a time |

---

## Data Flow Diagram (DFD)

### Level 0 - Context Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                   │
│                         RICEMENT SYSTEM                           │
│                                                                   │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐ │
│  │  Mobile App    │    │  Admin Panel   │    │    Arduino     │ │
│  │  (React        │    │  (Web)         │    │  (Hardware)    │ │
│  │   Native)      │    │                │    │                │ │
│  └────────────────┘    └────────────────┘    └────────────────┘ │
│          │                      │                     │          │
│          │                      │                     │          │
│          ▼                      ▼                     ▼          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Firebase Firestore Database                  │   │
│  │  - Authentication                                         │   │
│  │  - Real-time Data Sync                                   │   │
│  │  - Security Rules                                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Level 1 - System Overview

```
┌─────────────┐
│   USER      │
│ (Mobile)    │
└──────┬──────┘
       │
       │ Login/Register
       ▼
┌─────────────────────────┐
│  1.0 AUTHENTICATION     │
│  - Email/Password       │
│  - Firebase Auth        │
└────────┬────────────────┘
         │ User Token
         ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│  2.0 PROJECT            │      │  3.0 MANUAL PROJECT     │
│      MANAGEMENT         │      │      TIMER SYSTEM       │
│  - Create Project       │      │  - Create Timer         │
│  - View Projects        │      │  - Start/Stop Timer     │
│  - Update Status        │      │  - Monitor Status       │
│  - Track Progress       │      └────────┬────────────────┘
└────────┬────────────────┘               │
         │                                │
         │ Project Data                   │ Timer Data
         │                                │
         ▼                                ▼
┌──────────────────────────────────────────────────────────┐
│              FIRESTORE DATABASE                           │
│  - users                                                  │
│  - projects                                               │
│  - manual_projects (timerActive, remainingTime)          │
│  - temperatureLogs                                       │
│  - rawMaterials                                          │
│  - rhbRecords                                            │
└────────┬─────────────────────────────────────┬───────────┘
         │                                     │
         │ Read Project Data                   │ Read timerActive
         ▼                                     ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│  4.0 ANALYTICS          │      │  5.0 HARDWARE           │
│  - Dashboard Stats      │      │      CONTROL            │
│  - RHB Calculations     │      │  - Query Firestore      │
│  - Reports              │      │  - Control Pump         │
└─────────────────────────┘      │  - Monitor Timer        │
                                 └─────────────────────────┘
                                           │
                                           │ Physical Control
                                           ▼
                                 ┌─────────────────────────┐
                                 │  PUMP/MACHINE           │
                                 │  (BTS7960 Driver)       │
                                 └─────────────────────────┘
```

### Level 2 - Manual Project Timer Flow (Detailed)

```
┌──────────────┐
│     USER     │
│  (Mobile)    │
└──────┬───────┘
       │
       │ 1. Create Manual Project
       │    (name, blocks)
       ▼
┌─────────────────────────────────────────────┐
│  MOBILE APP - Dashboard Screen              │
│  1. Calculate time (1 block = 1 minute)     │
│  2. Create Firestore document:              │
│     {                                        │
│       name: "Project Name",                 │
│       blocks: 5,                            │
│       timerActive: true,          ◄─────────┼─── Key field for Arduino
│       remainingTime: 300,                   │
│       status: "Processing"                  │
│     }                                        │
└──────┬──────────────────────────────────────┘
       │
       │ 2. Write to Firestore
       ▼
┌─────────────────────────────────────────────┐
│         FIREBASE FIRESTORE                   │
│  Collection: manual_projects                 │
│  Rule: allow read: if true                   │◄─── Public read access
│                                              │
│  Document Structure:                         │
│  {                                           │
│    timerActive: true/false,    ◄─────────────┼─── Arduino monitors this
│    remainingTime: 300,         ◄─────────────┼─── Countdown value
│    name: "Project",                          │
│    blocks: 5,                                │
│    userId: "abc123",                         │
│    status: "Processing/Completed"            │
│  }                                           │
└──────┬───────────────────┬───────────────────┘
       │                   │
       │ 3. Real-time      │ 4. Query every 3 seconds
       │    Listener       │    WHERE timerActive == true
       │                   │
       ▼                   ▼
┌─────────────────┐   ┌─────────────────────────┐
│   MOBILE APP    │   │   ARDUINO ESP32         │
│  Timer Updates  │   │   (Pump Controller)     │
│  Every Second:  │   │                         │
│  - Decrement    │   │  1. Query Firestore     │
│    remainingTime│   │  2. Parse JSON          │
│  - Update UI    │   │  3. Check timerActive   │
│  - When = 0:    │   │  4. Control Logic:      │
│    • Set        │   │     IF true:            │
│      timerActive│   │       → Turn ON pump    │
│      = false    │   │     IF false:           │
│    • Set status │   │       → Turn OFF pump   │
│      = Completed│   │                         │
│    • Show alert │   │  5. Repeat loop         │
└─────────────────┘   └──────────┬──────────────┘
                                 │
                                 │ 5. Physical control signal
                                 │    (GPIO pins)
                                 ▼
                      ┌─────────────────────────┐
                      │    BTS7960 DRIVER       │
                      │    - RPWM (PWM signal)  │
                      │    - REN (Enable)       │
                      │    - LEN (Enable)       │
                      └──────────┬──────────────┘
                                 │
                                 │ 6. Power control
                                 ▼
                      ┌─────────────────────────┐
                      │    PUMP/MACHINE         │
                      │    - ON when active     │
                      │    - OFF when complete  │
                      └─────────────────────────┘
```

### Level 2 - Admin User Management Flow

```
┌──────────────┐
│    ADMIN     │
│   (Web)      │
└──────┬───────┘
       │
       │ 1. Login with admin credentials
       ▼
┌─────────────────────────────────────────────┐
│  FIREBASE AUTHENTICATION                     │
│  - Verify email/password                     │
│  - Check admins collection                   │
└──────┬──────────────────────────────────────┘
       │ 2. Admin token
       ▼
┌─────────────────────────────────────────────┐
│  ADMIN PANEL - User Management              │
│  Available Actions:                          │
│  ┌─────────────────────────────────────┐   │
│  │ 1. READ: Query all users            │   │
│  │ 2. UPDATE: Edit user details        │   │
│  │    - displayName                    │   │
│  │    - role (user/admin)              │   │
│  │    - isActive (true/false)          │   │
│  │ 3. DELETE: Remove user profile      │   │
│  │ 4. SEARCH: Filter by email/name     │   │
│  └─────────────────────────────────────┘   │
└──────┬──────────────────────────────────────┘
       │
       │ 3. CRUD operations
       ▼
┌─────────────────────────────────────────────┐
│         FIRESTORE DATABASE                   │
│  Collection: users                           │
│  {                                           │
│    userId: "abc123",                         │
│    email: "user@example.com",                │
│    displayName: "John Doe",                  │
│    role: "user" | "admin",    ◄─────────────┼─── Admin can modify
│    isActive: true/false,      ◄─────────────┼─── Enable/disable account
│    createdAt: timestamp                      │
│  }                                           │
│                                              │
│  Security Rules:                             │
│  - Admins can read all users                 │
│  - Admins can update user roles              │
│  - Users can only read their own data        │
└──────────────────────────────────────────────┘
```

---

## System Overview

### 1. Mobile Application (React Native)
**Purpose:** User-facing mobile app for project management and monitoring

**Key Features:**
- User authentication (login/register)
- Project creation and tracking
- Manual project timer system
- Real-time dashboard with statistics
- Temperature monitoring
- Raw materials tracking
- RHB block production records

**Technology Stack:**
- React Native 0.79.5
- Expo Router 5.1.5
- Firebase SDK 12.4.0
- AsyncStorage for local data

### 2. Admin Panel (Web)
**Purpose:** Administrative interface for system management

**Key Features:**
- Admin authentication
- User management (CRUD operations)
- Project oversight
- System analytics
- Role management (user/admin)
- Account activation/deactivation

**Technology Stack:**
- React Native Web
- Firebase Admin SDK
- Web-optimized UI components

### 3. Hardware Controller (Arduino ESP32)
**Purpose:** Physical machine control based on timer status

**Key Features:**
- WiFi connectivity
- Firestore REST API queries
- Real-time timer monitoring
- Pump control via BTS7960 driver
- Automatic start/stop based on `timerActive`

**Technology Stack:**
- Arduino ESP32
- HTTPClient library
- ArduinoJson library
- BTS7960 motor driver

### 4. Firebase Backend
**Purpose:** Cloud database and authentication

**Collections:**
- `users` - User profiles
- `admins` - Admin accounts
- `projects` - Regular projects
- `manual_projects` - Timer-based projects
- `temperatureLogs` - Temperature readings
- `rawMaterials` - Material usage records
- `rhbRecords` - Block production data
- `chatSessions` - AI chat sessions
- `chatMessages` - Chat history

---

## Data Dictionary

### Users Collection
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| userId | String (PK) | Unique user identifier | Auto-generated by Firebase Auth |
| email | String | User email address | Unique, required |
| displayName | String | User's display name | Optional |
| role | String | User role | Enum: "user", "admin" |
| isActive | Boolean | Account status | Default: true |
| createdAt | Timestamp | Account creation date | Auto-generated |
| updatedAt | Timestamp | Last update date | Auto-updated |

### Projects Collection
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| projectId | String (PK) | Unique project identifier | Auto-generated |
| userId | String (FK) | Owner user ID | Required, references users |
| name | String | Project name | Required, max 100 chars |
| blocks | Number | Number of blocks | Required, integer, min 1 |
| estimatedTime | String | Estimated completion time | Format: "HH:MM:SS" |
| date | String | Project date | Format: "DD/MM/YYYY" |
| status | String | Current status | Enum: "Pending", "In Progress", "Completed" |
| createdAt | Timestamp | Creation date | Auto-generated |
| updatedAt | Timestamp | Last update | Auto-updated |

### Manual Projects Collection
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| projectId | String (PK) | Unique project identifier | Auto-generated |
| userId | String (FK) | Owner user ID | Required, references users |
| name | String | Project name | Required |
| blocks | Number | Number of blocks | Required, integer, min 1 |
| estimatedTime | String | Total time | Format: "HH:MM:SS" |
| **timerActive** | **Boolean** | **Timer running status** | **true = running, false = stopped** |
| **remainingTime** | **Number** | **Seconds remaining** | **Decrements every second** |
| status | String | Project status | "Processing" or "Completed" |
| date | String | Project date | Format: "DD/MM/YYYY" |
| isManual | Boolean | Manual project flag | Always true |
| createdAt | Timestamp | Creation date | Auto-generated |
| updatedAt | Timestamp | Last update | Auto-updated |
| completedAt | Timestamp | Completion date | Set when timer = 0 |

### Temperature Logs Collection
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| logId | String (PK) | Unique log identifier | Auto-generated |
| projectId | String (FK) | Associated project | Required, references projects |
| temperature | Number | Temperature reading | Required, in Celsius |
| timestamp | Timestamp | Reading time | Auto-generated |
| zone | String | Temperature zone | Optional |

### Raw Materials Collection
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| materialId | String (PK) | Unique record identifier | Auto-generated |
| projectId | String (FK) | Associated project | Required, references projects |
| cement | Number | Cement quantity | Required, in kg |
| sand | Number | Sand quantity | Required, in kg |
| gravel | Number | Gravel quantity | Required, in kg |
| water | Number | Water quantity | Required, in liters |
| recordedAt | Timestamp | Record date | Auto-generated |

### RHB Records Collection
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| recordId | String (PK) | Unique record identifier | Auto-generated |
| projectId | String (FK) | Associated project | Required, references projects |
| blocks | Number | Blocks produced | Required, integer |
| producedAt | Timestamp | Production date | Auto-generated |
| quality | String | Quality grade | Optional |

### Chat Sessions Collection
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| sessionId | String (PK) | Unique session identifier | Auto-generated |
| userId | String (FK) | Session owner | Required, references users |
| title | String | Session title | Optional |
| createdAt | Timestamp | Creation date | Auto-generated |
| updatedAt | Timestamp | Last message date | Auto-updated |

### Chat Messages Collection
| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| messageId | String (PK) | Unique message identifier | Auto-generated |
| sessionId | String (FK) | Parent session | Required, references chatSessions |
| role | String | Message sender | Enum: "user", "assistant" |
| content | String | Message text | Required |
| timestamp | Timestamp | Send time | Auto-generated |

---

## Data Flow Scenarios

### Scenario 1: User Creates Manual Project

```
1. User opens mobile app → Dashboard
2. User taps "Create Manual Project" button
3. User enters:
   - Project name: "Test Project"
   - Blocks: 5
4. App calculates: estimatedTime = 5 minutes = "00:05:00"
5. App creates Firestore document:
   {
     name: "Test Project",
     blocks: 5,
     estimatedTime: "00:05:00",
     remainingTime: 300,
     timerActive: true,
     status: "Processing",
     userId: "currentUser123",
     createdAt: "2025-10-24T...",
     isManual: true
   }
6. Firebase stores document with auto-generated ID
7. App starts local timer (1 second countdown)
8. App shows timer card on dashboard
```

### Scenario 2: Arduino Controls Pump

```
1. Arduino wakes up (every 3 seconds)
2. Arduino queries Firestore:
   POST /documents:runQuery
   WHERE timerActive == true
   LIMIT 1
3. Firestore checks security rules: allow read: if true ✅
4. Firestore returns matching documents (if any)
5. Arduino parses JSON response
6. IF document found with timerActive == true:
   - Arduino sets GPIO pins HIGH
   - Pump turns ON
   - Serial prints: "PUMP ON"
7. IF no documents found:
   - Arduino sets GPIO pins LOW
   - Pump turns OFF
   - Serial prints: "PUMP OFF"
8. Repeat after 3 seconds
```

### Scenario 3: Timer Completes

```
1. Mobile app countdown reaches 0
2. App updates Firestore:
   {
     timerActive: false,        ← Arduino will detect this
     remainingTime: 0,
     status: "Completed",
     completedAt: "2025-10-24T..."
   }
3. App shows completion alert
4. Arduino queries Firestore (next cycle)
5. Arduino finds no documents with timerActive == true
6. Arduino turns pump OFF
7. Project marked complete in database
```

### Scenario 4: Admin Updates User Role

```
1. Admin logs into web panel
2. Admin navigates to "Users" tab
3. Admin searches for user by email
4. Admin clicks "Edit" on user row
5. Modal opens with user details
6. Admin changes role from "user" to "admin"
7. Admin clicks "Save Changes"
8. Web panel updates Firestore:
   UPDATE users/{userId}
   SET role = "admin", updatedAt = now()
9. Firestore validates: isAdmin() == true ✅
10. User's role updated
11. User can now access admin panel
```

---

## Security Rules Summary

### Public Access
- ✅ `manual_projects` - **Read only** (for Arduino)
  - Anyone can query and read documents
  - Only authenticated users can create/update/delete

### Authenticated Access
- ✅ `users` - Users can read/write their own profile
- ✅ `projects` - Users can CRUD their own projects
- ✅ `temperatureLogs` - Linked to user's projects
- ✅ `rawMaterials` - Linked to user's projects
- ✅ `rhbRecords` - Linked to user's projects
- ✅ `chatSessions` - Users can CRUD their own sessions
- ✅ `chatMessages` - Linked to user's sessions

### Admin Access
- ✅ Admins can **read all** collections
- ✅ Admins can **modify** users collection
- ✅ Admins can **manage** admin collection
- ✅ Admins have full CRUD on all data

---

## System Integration Points

### Mobile App ↔ Firebase
- Protocol: Firebase SDK (WebSocket for real-time)
- Authentication: Firebase Auth (email/password)
- Data sync: Real-time listeners (onSnapshot)
- Offline support: Firebase cache

### Admin Panel ↔ Firebase
- Protocol: Firebase SDK (HTTP/WebSocket)
- Authentication: Firebase Auth + Admin check
- Data operations: REST API calls
- Platform: Web browser only

### Arduino ↔ Firebase
- Protocol: **HTTP REST API** (no SDK)
- Authentication: **None** (public read access)
- Data operations: **GET** queries only
- Update frequency: Every 3 seconds

---

## Performance Considerations

### Database Queries
- **Mobile App:** Real-time listeners (efficient)
- **Admin Panel:** On-demand queries (paginated)
- **Arduino:** Polling every 3 seconds (minimal impact)

### Optimization Strategies
1. Firestore indexes on frequently queried fields
2. Limit query results (Arduino uses LIMIT 1)
3. Cached data in mobile app (AsyncStorage)
4. Efficient timer updates (batched writes)

### Scalability
- **Users:** Unlimited (Firebase Auth scales automatically)
- **Projects:** Unlimited (Firestore scales horizontally)
- **Arduino devices:** Multiple supported (each queries independently)
- **Concurrent timers:** One per user recommended

---

## Conclusion

This documentation provides a comprehensive view of the RiCement system architecture, including:

✅ **Entity relationships** - How data connects across collections
✅ **Data flows** - How information moves through the system
✅ **Integration points** - How components communicate
✅ **Security model** - Who can access what data
✅ **System scenarios** - Real-world usage examples

The system uses a modern, scalable architecture with:
- Cloud-based Firebase backend
- Real-time data synchronization
- Secure role-based access control
- Hardware integration via REST API
- Cross-platform mobile and web apps

---

**Last Updated:** October 24, 2025
**Version:** 1.0
**System:** RiCement Project Management System
