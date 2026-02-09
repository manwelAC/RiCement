# 🚀 Quick Start: Admin Web Panel

## Access Your Admin Panel

### 1. Start the server:
\`\`\`powershell
npm start
\`\`\`

### 2. Press `w` to open web browser

### 3. Navigate to:
\`\`\`
http://localhost:8081/admin
\`\`\`

---

## ⚠️ First Time Setup Required!

Before you can login, you need to create an admin user:

### Quick Setup Steps:

1. **Create a user account** (through your mobile app or web signup)
   
2. **Get the User UID:**
   - Go to: https://console.firebase.google.com/
   - Select: `ricement-app` project
   - Click: **Authentication** → Find your user
   - Copy the **User UID**

3. **Add admin role in Firestore:**
   - Click: **Firestore Database**
   - Create collection: `admins`
   - Add document with ID: [Your User UID]
   - Add fields:
     ```
     email: "your-email@example.com"
     fullName: "Your Name"
     role: "admin"
     createdAt: [timestamp - current time]
     ```

4. **Login to admin panel:**
   - URL: http://localhost:8081/admin
   - Email: [Your email]
   - Password: [Your password]

---

## 📊 What You'll See

After login, your dashboard shows:

- 👥 **Total Users** - Count of all registered users
- 📋 **Total Projects** - All projects in the system
- ✅ **Completed Projects** - With completion percentage
- 🧱 **RHB Blocks Produced** - Total blocks manufactured
- 📈 **Status Breakdown** - Queue, Processing, Completed

---

## 🎯 Features

✅ Web-only access (mobile users can't access)
✅ Secure role-based authentication
✅ Real-time data from Firebase
✅ Beautiful responsive design
✅ Easy logout functionality

---

## 📱 How to Deploy

### For Web Admin:
\`\`\`powershell
npx expo export -p web
vercel deploy
\`\`\`

### For Mobile App:
\`\`\`powershell
eas build --platform android
eas build --platform ios
\`\`\`

---

## 📚 Full Documentation

- **Admin Setup**: `docs/ADMIN_SETUP.md`
- **Deployment Guide**: `docs/ADMIN_WEB_SETUP.md`
- **Implementation Details**: `ADMIN_IMPLEMENTATION.md`

---

## Need Help?

Run this for setup instructions:
\`\`\`powershell
npm run setup-admin
\`\`\`

Or check the documentation files above! 🎉
