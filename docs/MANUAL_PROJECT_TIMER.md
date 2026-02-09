# Manual Project Real-Time Timer

## Overview
Manual projects now have a real-time countdown timer that controls hardware operation through a `timerActive` field in Firebase.

## How It Works

### 1. Creating a Manual Project
When a user creates a manual project:
- They input the number of blocks (1 block = 1 minute)
- A countdown timer starts automatically
- The project is saved to Firebase with these fields:

```javascript
{
  name: "Project Name",
  blocks: 5,                    // Number of blocks
  estimatedTime: "00:05:00",   // Total time (HH:MM:SS)
  remainingTime: 300,          // Remaining seconds
  timerActive: true,           // ⚡ Hardware reads this!
  status: "Processing",
  userId: "user123",
  createdAt: "2025-10-23T...",
  isManual: true
}
```

### 2. Timer Behavior
- **Timer Running**: `timerActive: true` - Hardware should operate
- **Timer Complete**: `timerActive: false` - Hardware should stop
- Updates in real-time every second

### 3. Hardware Integration

#### Reading the Timer State (Firebase)
Your hardware can monitor the `timerActive` field:

```javascript
// Example: Read timerActive in real-time
const { db } = require('./firebase-config');
const { collection, query, where, onSnapshot } = require('firebase/firestore');

// Listen for active manual projects
const q = query(
  collection(db, 'manual_projects'),
  where('timerActive', '==', true)
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  if (!snapshot.empty) {
    const project = snapshot.docs[0].data();
    console.log('Hardware should run:', project.timerActive);
    console.log('Time remaining:', project.remainingTime, 'seconds');
    
    // 🔧 TURN ON YOUR HARDWARE HERE
    controlHardware(true);
  } else {
    console.log('No active projects - hardware should stop');
    
    // 🔧 TURN OFF YOUR HARDWARE HERE
    controlHardware(false);
  }
});
```

#### Simple Boolean Check
```javascript
// Quick check if hardware should be running
async function shouldHardwareRun(userId) {
  const q = query(
    collection(db, 'manual_projects'),
    where('userId', '==', userId),
    where('timerActive', '==', true)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty; // true = run, false = stop
}
```

### 4. Timer States

| State | `timerActive` | `status` | Hardware Action |
|-------|---------------|----------|-----------------|
| Started | `true` | "Processing" | ✅ **RUN** |
| Running | `true` | "Processing" | ✅ **RUN** |
| Completed | `false` | "Completed" | ❌ **STOP** |

### 5. App Features

#### Visual Timer Display
When a manual project is running, the app shows:
- Project name
- Countdown timer (real-time)
- Number of blocks
- Status indicator (green dot = running)

#### User Notifications
- Alert when timer completes
- Prevents starting multiple manual projects at once
- Shows time remaining in HH:MM:SS format

### 6. Firebase Structure

#### Collection: `manual_projects`
```
manual_projects/
├── {projectId}/
│   ├── name: string
│   ├── blocks: number
│   ├── estimatedTime: string (HH:MM:SS)
│   ├── remainingTime: number (seconds)
│   ├── timerActive: boolean ⚡
│   ├── status: "Processing" | "Completed"
│   ├── userId: string
│   ├── createdAt: ISO string
│   ├── updatedAt: ISO string
│   ├── completedAt: ISO string (when done)
│   └── isManual: true
```

### 7. Example Hardware Flow

```javascript
// 1. Setup Firebase listener
let hardwareRunning = false;

const monitorManualProjects = (userId) => {
  const q = query(
    collection(db, 'manual_projects'),
    where('userId', '==', userId),
    where('timerActive', '==', true)
  );

  onSnapshot(q, (snapshot) => {
    if (!snapshot.empty && !hardwareRunning) {
      // Timer started - turn on hardware
      console.log('🟢 Starting hardware...');
      startHardware();
      hardwareRunning = true;
    } else if (snapshot.empty && hardwareRunning) {
      // Timer completed - turn off hardware
      console.log('🔴 Stopping hardware...');
      stopHardware();
      hardwareRunning = false;
    }
  });
};

// 2. Implement hardware control
function startHardware() {
  // Your hardware start code here
  // e.g., GPIO pins, serial communication, etc.
}

function stopHardware() {
  // Your hardware stop code here
}
```

### 8. Security Rules

Make sure your Firestore rules allow reading `manual_projects`:

```javascript
match /manual_projects/{projectId} {
  allow read: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null && 
    resource.data.userId == request.auth.uid;
}
```

### 9. Testing

1. **Create a manual project** with 1 block (1 minute)
2. **Observe** the timer counting down in real-time
3. **Check Firebase** - see `timerActive: true` and `remainingTime` decreasing
4. **Wait for completion** - `timerActive` changes to `false`
5. **Hardware reads** - should stop when `timerActive: false`

### 10. Key Points

- ✅ Real-time updates every second
- ✅ Automatic timer completion
- ✅ Only one manual project can run at a time
- ✅ Hardware reads `timerActive` field for control
- ✅ Timer persists even if app is closed (Firebase)
- ✅ Clean completion notification

## Summary

**For Hardware Developers:**
Simply monitor the `timerActive` boolean field in Firebase:
- `true` = Hardware should RUN
- `false` = Hardware should STOP

The app handles all the timer logic - your hardware just needs to react to the `timerActive` state! 🚀
