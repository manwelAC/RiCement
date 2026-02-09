/**
 * Admin User Setup Script
 * 
 * This script helps you set up an admin user in Firebase.
 * Admin users have the 'admin' role in their user profile.
 * 
 * Steps:
 * 1. Create a user account through your app
 * 2. Copy their UID from Firebase Console > Authentication
 * 3. Update their role field in Firestore users collection to 'admin'
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║              RICEMENT ADMIN USER SETUP                         ║
╚════════════════════════════════════════════════════════════════╝

To set up your first admin user, follow these steps:

STEP 1: Create a User Account
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Open your app (mobile or web)
2. Log in with email and password (use an existing account)
3. Remember the email you used!

STEP 2: Get the User UID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Go to: https://console.firebase.google.com/
2. Select project: ricement-app
3. Click "Authentication" in the left menu
4. Find your user in the list
5. Click on the user to see details
6. Copy the "User UID" (looks like: abc123xyz456...)

STEP 3: Update User Role in Firestore
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. In Firebase Console, click "Firestore Database"
2. Navigate to "users" collection
3. Find the document with the UID you copied
4. Edit the document and change the "role" field from "user" to "admin"
5. Click "Save"

NOTE: If the user doesn't exist in the users collection yet:
1. Click "Add document"
2. Document ID: [Paste the User UID]
3. Add these fields:
   
   Field name     |  Type      |  Value
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   email          |  string    |  your-email@example.com
   fullName       |  string    |  Your Name
   username       |  string    |  your-username
   role           |  string    |  admin
   createdAt      |  timestamp |  [Current time]
   lastLogin      |  timestamp |  [Current time]

STEP 4: Test Admin Access
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Log out of the app completely
2. Log back in with your admin account
3. You should now have access to admin features
4. Navigate to: /(admin)/dashboard

╔════════════════════════════════════════════════════════════════╗
║  Admin users can access the admin panel                         ║
║  Regular users can only access the main app dashboard           ║
╚════════════════════════════════════════════════════════════════╝

Need help? Check docs/ADMIN_SETUP.md for detailed instructions.
`);
