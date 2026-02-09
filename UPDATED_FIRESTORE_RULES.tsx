rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin or superadmin
    function isAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin');
    }
    
    // Helper function to check if user is superadmin
    function isSuperAdmin() {
      return request.auth != null && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'superadmin';
    }
    
    // ================================================
    // PUBLIC READ ACCESS FOR IOT DEVICES (NO AUTH REQUIRED)
    // ================================================
    
    // manual_projects - PUBLIC READ for Arduino water pump control
    match /manual_projects/{projectId} {
      // Allow ANYONE to read (no authentication required)
      // This allows Arduino to check timerActive field
      allow read: if true;
      
      // Keep existing write rules for authenticated users
      allow update, delete: if request.auth != null && 
        resource != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // projects - PUBLIC READ for Arduino mixer control
    match /projects/{projectId} {
      // Allow ANYONE to read (no authentication required)
      // This allows Arduino to check 'up' field
      allow read: if true;
      
      // Keep existing write rules for authenticated users
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // ================================================
    // AUTHENTICATED ACCESS ONLY COLLECTIONS
    // ================================================
    
    // Users collection
    match /users/{userId} {
      // Allow any authenticated user to read all users
      allow list, read: if request.auth != null;
      
      // Users can only update their own profile, admins can update users in their company
      allow update: if request.auth != null && 
        (request.auth.uid == userId || isSuperAdmin() || 
         (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' &&
          get(/databases/$(database)/documents/users/$(userId)).data.company == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company));
      
      // Admins can delete users
      allow delete: if request.auth != null && 
        (isSuperAdmin() || 
         (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' &&
          get(/databases/$(database)/documents/users/$(userId)).data.company == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company));
      
      // Anyone can create their own user profile
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Companies collection - only superadmin can manage, but everyone can read
    match /companies/{companyId} {
      allow read: if true;  // Allow anyone to read companies (needed for signup dropdown)
      allow create, update, delete: if isSuperAdmin();
    }
    
    // Admins collection - for legacy compatibility
    match /admins/{adminId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    // Inventory - users can access their own, admins can read all from their company
    match /inventory/{inventoryId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         (isAdmin() && (isSuperAdmin() || resource.data.companyId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company)));
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Temperature logs - linked to user's projects, admins can read all
    match /temperatureLogs/{logId} {
      allow read: if request.auth != null && 
        (exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid) || isAdmin();
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // Raw materials - linked to user's projects, admins can read all
    match /rawMaterials/{materialId} {
      allow read: if request.auth != null && 
        (exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid) || isAdmin();
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // RHB records - linked to user's projects, admins can read all
    match /rhbRecords/{recordId} {
      allow read: if request.auth != null && 
        (exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid) || isAdmin();
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/projects/$(request.resource.data.projectId)) &&
        get(/databases/$(database)/documents/projects/$(request.resource.data.projectId)).data.userId == request.auth.uid;
    }
    
    // Chat sessions - users can only access their own, admins can read all
    match /chatSessions/{sessionId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || isAdmin());
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Chat messages - linked to user's sessions, admins can read all
    match /chatMessages/{messageId} {
      allow read: if request.auth != null && 
        (exists(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)) &&
        get(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)).data.userId == request.auth.uid) || isAdmin();
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)) &&
        get(/databases/$(database)/documents/chatSessions/$(resource.data.sessionId)).data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        exists(/databases/$(database)/documents/chatSessions/$(request.resource.data.sessionId)) &&
        get(/databases/$(database)/documents/chatSessions/$(request.resource.data.sessionId)).data.userId == request.auth.uid;
    }
    
    // Loading Records - users can access their own, admins can read all from their company
    match /loadingRecords/{recordId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         (isAdmin() && (isSuperAdmin() || resource.data.companyId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company)));
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Backloading Records - users can access their own, admins can read all from their company
    match /backloadingRecords/{recordId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         (isAdmin() && (isSuperAdmin() || resource.data.companyId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company)));
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Complaints collection (from your database structure)
    match /complaints/{complaintId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Manual Controller - for admin and employee control of machine
    // Document ID is the user's UID who is controlling the machine
    match /manual_controller/{userId} {
      // Users can read and write their own controller state
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Admins can read their company users' controller state
      allow read: if request.auth != null && isAdmin() &&
        (isSuperAdmin() || 
         get(/databases/$(database)/documents/users/$(userId)).data.company == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.company);
      
      // Superadmins can read all controller states
      allow read: if isSuperAdmin();
      
      // Allow IoT devices/Arduino to read (no auth required) for hardware control
      allow read: if true;
    }
    
  }
}
