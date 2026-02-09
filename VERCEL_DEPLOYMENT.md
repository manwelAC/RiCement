# RiCement Admin Panel - Vercel Deployment Guide

## Prerequisites
1. Vercel account (sign up at https://vercel.com)
2. Git repository connected to Vercel
3. Firebase configuration

## Deployment Steps

### 1. Install Vercel CLI (Optional for local testing)
```bash
npm install -g vercel
```

### 2. Configure Environment Variables in Vercel Dashboard

Go to your Vercel project settings and add these environment variables:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

**Important:** Get these values from your `config/firebase.ts` file or Firebase Console.

### 3. Deploy via GitHub (Recommended)

1. **Connect Repository:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select the `RiCement-1` folder if it's in a subdirectory

2. **Configure Build Settings:**
   - Framework Preset: `Other`
   - Build Command: `expo export -p web`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add Environment Variables:**
   - Go to Project Settings → Environment Variables
   - Add all Firebase configuration variables listed above

4. **Deploy:**
   - Click "Deploy"
   - Vercel will automatically build and deploy your admin panel

### 4. Deploy via Vercel CLI (Alternative)

```bash
# Login to Vercel
vercel login

# Navigate to project directory
cd c:\Users\johnm\RiCement\RiCement-1

# Deploy to production
vercel --prod
```

When prompted:
- Set up and deploy: `Y`
- Which scope: Select your account
- Link to existing project: `N` (first time) or `Y` (subsequent deploys)
- Project name: `ricement-admin`
- Directory: `./`
- Override settings: `N`

## Build Configuration

The project is configured with:
- **Build Command:** `expo export -p web`
- **Output Directory:** `dist`
- **SPA Routing:** Enabled via `vercel.json` rewrites

## Post-Deployment

### 1. Update Firebase Configuration
Add your Vercel domain to Firebase:
- Go to Firebase Console → Authentication → Settings
- Add authorized domains:
  - `your-project.vercel.app`
  - `your-custom-domain.com` (if using custom domain)

### 2. Update Firestore Security Rules
Ensure your admin authentication works:
```javascript
// Already configured in your project
match /admins/{adminId} {
  allow read, write: if request.auth != null && request.auth.uid == adminId;
}
```

### 3. Test Admin Login
- Visit: `https://your-project.vercel.app`
- Navigate to admin login (if not already redirected)
- Test with your admin credentials

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update Firebase authorized domains

## Environment Variables Reference

Copy these from your local `config/firebase.ts`:

```typescript
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
```

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Ensure Node version is compatible (18.x or 20.x recommended)
- Check Vercel build logs for specific errors

### Routing Issues
- Verify `vercel.json` rewrites are configured correctly
- Check that `expo-router` is properly configured

### Authentication Fails
- Verify Firebase environment variables are set correctly
- Check that Vercel domain is added to Firebase authorized domains
- Ensure Firestore security rules allow admin access

### Assets Not Loading
- Check that asset paths are correct
- Verify `public/` folder assets are included in build
- Clear Vercel cache and redeploy

## Continuous Deployment

Once connected to GitHub:
- Every push to `master` branch triggers automatic deployment
- Preview deployments created for pull requests
- Rollback available from Vercel dashboard

## Production Checklist

- [ ] All environment variables configured
- [ ] Firebase authorized domains updated
- [ ] Admin user created in Firebase
- [ ] Test login functionality
- [ ] Test all admin features (users, projects, complaints)
- [ ] Check mobile responsiveness
- [ ] Configure custom domain (optional)
- [ ] Set up error monitoring (Vercel Analytics)

## Monitoring

Enable Vercel Analytics:
1. Go to Project Settings → Analytics
2. Enable Web Analytics
3. Monitor page views, performance, and errors

## Support

For issues:
- Vercel Docs: https://vercel.com/docs
- Expo Docs: https://docs.expo.dev
- Firebase Docs: https://firebase.google.com/docs

## Notes

- This deploys the web version of your Expo app
- Mobile app (iOS/Android) deployment is separate (use EAS Build)
- The admin panel is web-only (Platform.OS === 'web' checks ensure this)
- Consider adding a custom loading screen
- Set up HTTPS redirect (Vercel does this automatically)
