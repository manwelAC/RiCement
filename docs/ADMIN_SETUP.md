# Admin Setup Guide

## Setting Up Your First Admin User

Since the admin panel requires users to have an admin role in Firebase, you need to manually add the first admin user to your Firebase Firestore database.

### Steps to Create an Admin User:

#### Option 1: Using Firebase Console (Recommended)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `ricement-app`
3. **Navigate to Firestore Database**
4. **Create a new collection called `admins`** (if it doesn't exist)
5. **Add a new document**:
   - Document ID: Use the UID of your user (get this from Authentication → Users)
   - Fields:
     ```
     email: "your-admin@email.com" (string)
     fullName: "Your Name" (string)
     role: "admin" (string)
     createdAt: [Click "Add field" → Select "timestamp" → Use current time]
     ```
6. **Save the document**

#### Option 2: Using This Script

Create a temporary script to add an admin user:

```javascript
// setup-admin.js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createAdminUser(email, password, fullName) {
  try {
    // Create user in Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: fullName
    });

    console.log('User created:', userRecord.uid);

    // Add admin role in Firestore
    await db.collection('admins').doc(userRecord.uid).set({
      email: email,
      fullName: fullName,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('UID:', userRecord.uid);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

// Usage
createAdminUser('admin@ricement.com', 'YourSecurePassword123!', 'Admin User');
```

Run with: `node setup-admin.js`

### Test Your Admin Login

1. **Start the development server**:
   ```powershell
   npx expo start
   ```

2. **Press `w`** to open the web version

3. **Navigate to**: `http://localhost:8081/admin/login`

4. **Login with**:
   - Email: The email you set up
   - Password: The password you set up

5. **You should see the dashboard** with:
   - Total Users count
   - Total Projects count
   - Completed Projects count
   - Total RHB Blocks produced

## Admin Panel Features

### Current Features:
- ✅ Secure admin login with role checking
- ✅ Dashboard with real-time statistics
- ✅ Total users count
- ✅ Total projects count
- ✅ Completed projects count
- ✅ Total RHB blocks produced
- ✅ Project status breakdown (Queue, Processing, Completed)
- ✅ Web-only access (mobile users can't access)

### Adding More Admins:

To add more admin users later:

1. First, create a regular user account through your app
2. Get their UID from Firebase Authentication console
3. Add a document in the `admins` collection with their UID as the document ID
4. Include fields: `email`, `fullName`, `role: "admin"`, `createdAt`

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never hardcode admin credentials** in your code
2. **Use strong passwords** for admin accounts
3. **Limit admin access** to trusted personnel only
4. **Consider adding 2FA** for admin accounts in production
5. **Set up Firebase Security Rules** to protect admin data:

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Admin collection - only admins can read/write
    match /admins/{adminId} {
      allow read, write: if request.auth != null && 
        exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    
    // Other collections...
  }
}
```

## Troubleshooting

### "Unauthorized: You do not have admin access"
- Check that the user exists in the `admins` collection
- Verify the document ID matches the user's UID exactly
- Make sure the `role` field is set to "admin"

### "Admin panel is only available on web"
- Admin panel only works in browser (press `w` in Expo dev server)
- Mobile users will be redirected automatically

### Dashboard shows 0 for all stats
- Make sure you have data in your Firebase collections
- Check Firebase console to verify data exists
- Check browser console for any errors

## Next Steps

Consider adding these features to your admin panel:

1. **User Management** - View, edit, delete users
2. **Project Management** - View all projects, change status
3. **Analytics** - Charts and graphs for better visualization
4. **Reports** - Export data to CSV/PDF
5. **Settings** - System configuration options
6. **Activity Logs** - Track admin actions

Would you like me to implement any of these features?
