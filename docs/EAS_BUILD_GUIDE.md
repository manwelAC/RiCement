# 📱 EAS Build Guide - Building Your Mobile App

## Overview
This guide will help you build your RiCement mobile app for Android and iOS using Expo Application Services (EAS).

## Prerequisites

1. **Expo Account**: Sign up at https://expo.dev
2. **EAS CLI**: Install globally
3. **Firebase Configuration**: Already set up ✅
4. **App Identifiers**: 
   - Android Package: `com.mxnwel.RiCement`
   - iOS Bundle ID: (needs to be added if building for iOS)

## Step 1: Install EAS CLI

```powershell
npm install -g eas-cli
```

## Step 2: Login to Expo

```powershell
eas login
```

Enter your Expo credentials when prompted.

## Step 3: Configure Your Project

Your project already has `eas.json` configured! But let's review:

### Current Configuration:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### Build Profiles:
- **development**: For testing with Expo Dev Client
- **preview**: Internal testing builds (APK/IPA)
- **production**: Production builds for app stores

## Step 4: Build Your App

### For Android (APK for Testing)

```powershell
# Development build (for testing)
eas build --profile development --platform android

# Preview build (shareable APK)
eas build --profile preview --platform android

# Production build (for Google Play Store)
eas build --profile production --platform android
```

### For iOS (Requires Apple Developer Account)

```powershell
# Preview build
eas build --profile preview --platform ios

# Production build (for App Store)
eas build --profile production --platform ios
```

### Build Both Platforms

```powershell
eas build --profile preview --platform all
```

## Step 5: First Build Process

When you run `eas build` for the first time:

1. **Project Initialization**: EAS will ask to create a project
   - Press `Y` to continue
   - It will link your local project to EAS

2. **Android Keystore** (first Android build):
   - EAS will ask: "Would you like to generate a Keystore?"
   - Press `Y` - EAS will generate and manage it for you

3. **iOS Certificate** (first iOS build):
   - EAS will handle certificates automatically
   - You need an Apple Developer account ($99/year)

4. **Build Queue**: Your build will be queued on Expo servers
   - Build time: 5-15 minutes typically
   - You'll get a notification when complete

## Step 6: Download Your Build

After build completes:

1. **Via Web**: Check https://expo.dev/accounts/[your-account]/projects/ricement/builds
2. **Via CLI**: Download link will be shown in terminal
3. **Install on Device**: 
   - Android: Install APK directly
   - iOS: Install via TestFlight or download IPA

## Build Commands Reference

### Android Commands

```powershell
# Quick APK for testing
eas build -p android --profile preview

# Production AAB for Google Play
eas build -p android --profile production

# Check build status
eas build:list
```

### iOS Commands

```powershell
# Preview IPA for testing
eas build -p ios --profile preview

# Production build for App Store
eas build -p ios --profile production
```

## Step 7: Install on Your Device

### Android (APK)
1. Download the APK from Expo dashboard
2. Transfer to your Android device
3. Enable "Install from Unknown Sources" in Settings
4. Open APK file and install

### iOS (TestFlight)
1. First build: EAS will guide you through TestFlight setup
2. You'll get a TestFlight link
3. Install TestFlight app on your iPhone
4. Open the link to install your app

## Updating Your App

### Update Version Number

Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Update this
    "android": {
      "versionCode": 2   // Auto-increments with "production" profile
    },
    "ios": {
      "buildNumber": "2" // Add this for iOS
    }
  }
}
```

Then rebuild:
```powershell
eas build --profile production --platform android
```

## Environment Variables (Optional)

If you need different Firebase configs for production:

```powershell
# Create eas.json with environment variables
eas secret:create --name FIREBASE_API_KEY --value your_production_key
```

Then update `app.json`:
```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": process.env.FIREBASE_API_KEY
    }
  }
}
```

## Common Issues & Solutions

### Issue: "Project not configured"
```powershell
eas build:configure
```

### Issue: Build fails with dependency errors
```powershell
# Clear cache and rebuild
npm install
eas build --clear-cache -p android
```

### Issue: "Android package name already exists"
- Go to Expo dashboard
- Delete old project or use different package name in `app.json`

### Issue: Need to update credentials
```powershell
eas credentials
```

## Publishing Updates (OTA - Over The Air)

For quick JS/asset updates without rebuilding:

```powershell
# Install eas-update (if not already)
npm install -g eas-cli

# Publish update
eas update --branch production --message "Bug fixes"
```

Users will get updates automatically without reinstalling!

## App Store Submission

### Google Play Store (Android)

1. Build production AAB:
   ```powershell
   eas build --profile production --platform android
   ```

2. Download AAB from Expo dashboard

3. Go to Google Play Console: https://play.google.com/console
   - Create new app
   - Upload AAB
   - Fill in store listing
   - Submit for review

### Apple App Store (iOS)

1. Build production:
   ```powershell
   eas build --profile production --platform ios
   ```

2. EAS will submit to App Store Connect automatically (if configured)
   
3. Or use EAS Submit:
   ```powershell
   eas submit --platform ios
   ```

## Build Monitoring

### Check Build Status
```powershell
# List all builds
eas build:list

# View specific build
eas build:view [build-id]

# Cancel a build
eas build:cancel [build-id]
```

### Build Dashboard
https://expo.dev/accounts/[your-account]/projects/ricement/builds

## Cost Information

- **Free Tier**: Limited builds per month
- **Paid Plans**: Unlimited builds, priority queue
- Check: https://expo.dev/pricing

## Quick Start Commands

```powershell
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Build Android APK for testing
eas build --profile preview --platform android

# 4. Wait for build to complete (~10 mins)

# 5. Download and install APK on your phone
```

## Testing Workflow

1. **Local Development**: 
   ```powershell
   npm start
   # Scan QR with Expo Go app
   ```

2. **Build for Testing**:
   ```powershell
   eas build --profile preview --platform android
   ```

3. **Install & Test**: Share APK with testers

4. **Production Build**: When ready for app stores
   ```powershell
   eas build --profile production --platform android
   ```

## Next Steps

1. ✅ Run `eas login`
2. ✅ Run `eas build --profile preview --platform android`
3. ✅ Download APK and test on your device
4. ✅ When satisfied, build production version
5. ✅ Submit to Google Play Store

## Resources

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- EAS Submit Docs: https://docs.expo.dev/submit/introduction/
- App Store Guidelines: https://developer.apple.com/app-store/guidelines/
- Play Store Policies: https://play.google.com/about/developer-content-policy/

## Support

For issues:
- Expo Forums: https://forums.expo.dev
- Discord: https://chat.expo.dev
- Documentation: https://docs.expo.dev

---

**Pro Tip**: Start with a preview build to test everything works before doing production builds!
