# Admin Web Panel Setup Guide

## Overview

This project supports **both mobile app and web admin panel** from a single codebase using Expo Router. The mobile app and admin panel share Firebase configuration, services, and business logic while maintaining separate user interfaces.

## Architecture

```
RiCement Project
├── Shared Code
│   ├── Firebase (config, auth, database)
│   ├── Services (authService, firebaseService)
│   └── Types (user.ts, etc.)
│
├── Mobile App (iOS/Android)
│   └── app/(tabs)/ - Mobile-specific routes
│       ├── dashboard.tsx
│       ├── explore.tsx
│       ├── profile.tsx
│       └── etc.
│
└── Admin Panel (Web)
    └── app/(admin)/ - Admin-specific routes
        ├── dashboard.tsx
        ├── users.tsx
        ├── analytics.tsx
        └── etc.
```

## Development

### Running the Project

#### Start Development Server
```powershell
npx expo start
```

From the menu, choose:
- Press **`w`** → Open admin web panel in browser (http://localhost:8081)
- Press **`a`** → Open mobile app on Android emulator
- Press **`i`** → Open mobile app on iOS simulator
- Scan QR code → Open mobile app on physical device

#### Run Web Only
```powershell
npx expo start --web
```

#### Run Mobile Only
```powershell
# Android
npx expo start --android

# iOS
npx expo start --ios
```

### What You'll See

**Mobile App (on device/emulator):**
- User-facing mobile interface
- Bottom tab navigation
- Mobile-optimized components
- Access to: dashboard, explore, profile, etc.

**Admin Panel (in browser):**
- Desktop web interface
- Admin-specific features
- Full browser DevTools access
- Access to: user management, analytics, settings, etc.

### Hot Reload

Both platforms support hot reload:
- Change shared code → Both mobile & web reload
- Change admin-only code → Only web reloads
- Change mobile-only code → Only mobile reloads

## Deployment

### Web Admin Panel → Vercel/Netlify

#### Build Web Version
```powershell
npx expo export -p web
```

This creates a static web build in the `dist/` folder.

#### Deploy to Vercel
```powershell
# Install Vercel CLI (first time only)
npm install -g vercel

# Deploy
vercel deploy
```

#### Deploy to Netlify
```powershell
# Install Netlify CLI (first time only)
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Deploy to Firebase Hosting
```powershell
# Install Firebase CLI (first time only)
npm install -g firebase-tools

# Initialize Firebase Hosting
firebase init hosting

# Deploy
firebase deploy --only hosting
```

**Result:** Admin panel accessible at your custom domain (e.g., `https://admin.ricement.com`)

### Mobile App → App Stores

#### Prerequisites
```powershell
# Install EAS CLI (first time only)
npm install -g eas-cli

# Login to Expo
eas login
```

#### Build for Android
```powershell
eas build --platform android
```

#### Build for iOS
```powershell
eas build --platform ios
```

#### Submit to App Stores
```powershell
# Submit to Google Play Store
eas submit --platform android

# Submit to Apple App Store
eas submit --platform ios
```

**Result:** Apps available for download from Google Play Store and Apple App Store

## Deployment Summary

| Platform | Build Command | Deploy To | Access Via |
|----------|--------------|-----------|------------|
| **Web Admin** | `npx expo export -p web` | Vercel/Netlify/Firebase | Browser URL |
| **Mobile App** | `eas build --platform [android\|ios]` | App Stores | App download |

## Key Benefits

✅ **Single Codebase** - Maintain one project for both mobile and web
✅ **Shared Logic** - Firebase auth, database services, types shared across platforms
✅ **Independent Deployment** - Update web without rebuilding mobile apps
✅ **Platform-Specific UI** - Optimized interfaces for mobile and web
✅ **Different Release Cycles** - Web updates instantly, mobile via app stores
✅ **Cost Effective** - No need for separate backend or duplicate codebases

## Project Structure

```
app/
├── _layout.tsx           # Root layout with platform routing
├── (tabs)/              # Mobile app routes (iOS/Android)
│   ├── _layout.tsx
│   ├── dashboard.tsx
│   ├── explore.tsx
│   └── profile.tsx
│
├── (admin)/             # Admin panel routes (Web only)
│   ├── _layout.tsx
│   ├── dashboard.tsx
│   ├── users.tsx
│   └── analytics.tsx
│
├── login.tsx            # Shared login (mobile & web)
├── signup.tsx           # Shared signup
└── forgot-password.tsx  # Shared password recovery

components/
├── mobile/              # Mobile-specific components
└── admin/               # Web admin-specific components

services/
├── authService.ts       # Shared authentication
└── firebaseService.ts   # Shared Firebase operations

config/
└── firebase.ts          # Shared Firebase configuration
```

## Environment Setup

### Development
```powershell
# Install dependencies
npm install

# Start development server
npx expo start
```

### Production Environment Variables

Create `.env.production` for web deployment:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Workflow Example

### Daily Development
1. Start server: `npx expo start`
2. Press `w` for admin panel in browser
3. Open Android/iOS simulator for mobile app
4. Make changes, both reload automatically

### Deploying Updates

**Admin Panel (Web):**
```powershell
npx expo export -p web
vercel deploy --prod
```
→ Updates live immediately

**Mobile App:**
```powershell
eas build --platform android --platform ios
eas submit --platform android --platform ios
```
→ Updates after app store review (1-7 days)

## Notes

- **Web admin requires browser** - Not accessible from mobile app
- **Mobile app requires download** - Not accessible from browser
- **Shared Firebase** - Both use same authentication and database
- **Independent updates** - Web and mobile can be updated separately
- **Platform-specific code** - Use `Platform.OS === 'web'` for conditional rendering

## Support

For issues or questions:
- Check [Expo Router docs](https://docs.expo.dev/router/introduction/)
- Check [EAS Build docs](https://docs.expo.dev/build/introduction/)
- Check [Firebase docs](https://firebase.google.com/docs)

## Next Steps

1. Create admin routes in `app/(admin)/`
2. Build admin-specific components
3. Set up authentication guards for admin access
4. Test on web browser locally
5. Deploy to Vercel/Netlify
6. Configure custom domain for admin panel
